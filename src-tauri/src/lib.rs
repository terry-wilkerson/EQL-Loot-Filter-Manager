use chrono::Local;
use rusqlite::{params, Connection, OpenFlags};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{Manager, State};

/// How many timestamped backups to keep per filter file.
const MAX_BACKUPS: usize = 5;
/// Valid filter action IDs (see FILTER_MAP on the frontend).
const MIN_FILTER_ID: u8 = 1;
const MAX_FILTER_ID: u8 = 4;
/// Max autocomplete matches returned by `search_eq_items`. High enough that a
/// specific query always includes the target, but capped so a broad substring
/// (e.g. "a" matches ~124k items) can't lock up the webview rendering the list.
/// The frontend shows a "refine your search" hint when this many come back.
const SEARCH_RESULT_LIMIT: usize = 200;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LootItem {
    pub item_id: u32,
    pub filter_id: u8,
    pub icon_id: u32,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FilterFileInfo {
    pub name: String,
    pub path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScanResult {
    pub active_directory: String,
    pub files: Vec<FilterFileInfo>,
}

/// User preferences persisted to `settings.json` in the app data directory.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub dark_mode: bool,
    pub ui_directory: Option<String>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            dark_mode: true,
            ui_directory: None,
        }
    }
}

struct AppState {
    db: Mutex<Connection>,
    /// The confined root directory that all file commands must stay within.
    /// Set by `scan_ui_directory`; `None` until a directory is selected.
    ui_dir: Mutex<Option<PathBuf>>,
    /// Location of the persisted settings file (app_data_dir/settings.json).
    settings_path: PathBuf,
}

/// Extract and validate just the file name from whatever path string the
/// frontend sent. Splitting on both separators (rather than relying on
/// `Path::file_name`) is deliberate: the confined root is a canonicalized path,
/// which on Windows carries the `\\?\` verbatim prefix where `/` is NOT treated
/// as a separator — so a frontend-built `root/name` path would otherwise yield a
/// bogus "file name". Rejecting `..` plus the fact that the result contains no
/// separator means it can't traverse out of the root once joined.
fn sanitized_filter_file_name(file_path: &str) -> Result<String, String> {
    let name = file_path
        .rsplit(|c| c == '/' || c == '\\')
        .next()
        .unwrap_or("");
    if name.is_empty()
        || name.contains("..")
        || !(name.starts_with("LF_") && name.to_lowercase().ends_with(".ini"))
    {
        return Err("File name must match LF_*.ini".to_string());
    }
    Ok(name.to_string())
}

/// The confined root directory recorded by `scan_ui_directory`.
fn ui_root(state: &AppState) -> Result<PathBuf, String> {
    state
        .ui_dir
        .lock()
        .map_err(|_| "Failed to lock UI directory state".to_string())?
        .clone()
        .ok_or_else(|| "No UI directory selected".to_string())
}

/// Resolve `file_path` to a `LF_*.ini` file inside `root`. Only the file name
/// from `file_path` is used; the directory is always `root`.
///
/// This is the security boundary: the resolved path is always inside `root`, so
/// the webview cannot reach any file outside the selected directory.
/// `require_existing` distinguishes reads/overwrites from creation.
fn resolve_in_root(
    root: &Path,
    file_path: &str,
    require_existing: bool,
) -> Result<PathBuf, String> {
    let file_name = sanitized_filter_file_name(file_path)?;
    let resolved = root.join(&file_name);
    if require_existing && !resolved.exists() {
        return Err("File does not exist".to_string());
    }
    Ok(resolved)
}

/// Create an empty filter file inside `root`. Errors if it already exists.
fn create_file_in(root: &Path, file_path: &str) -> Result<(), String> {
    let path = resolve_in_root(root, file_path, false)?;
    if path.exists() {
        return Err("File already exists".into());
    }
    fs::write(path, "[Filters]\n").map_err(|e| e.to_string())
}

/// Read and parse a filter file's items.
fn load_file_in(root: &Path, file_path: &str) -> Result<Vec<LootItem>, String> {
    let path = resolve_in_root(root, file_path, true)?;
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    Ok(content.lines().filter_map(parse_filter_line).collect())
}

/// Validate every item, back up an existing file, then write the new contents.
fn save_file_in(root: &Path, file_path: &str, items: &[LootItem]) -> Result<(), String> {
    let path = resolve_in_root(root, file_path, false)?;

    // Validate before writing anything, so a bad item can't leave a half-written
    // file. The '^' delimiter and newlines would corrupt the format.
    for item in items {
        validate_item(item)?;
    }

    // Back up the existing file before overwriting, then prune old backups.
    if path.exists() {
        let timestamp = Local::now().format("%Y%m%d_%H%M%S");
        let backup = format!("{}.bak_{}", path.to_string_lossy(), timestamp);
        let _ = fs::copy(&path, &backup);
        prune_backups(&path);
    }

    fs::write(&path, serialize_items(items)).map_err(|e| e.to_string())
}

/// Whether a filter file exists inside `root`.
fn file_exists_in(root: &Path, file_path: &str) -> Result<bool, String> {
    Ok(resolve_in_root(root, file_path, false)?.exists())
}

/// Map a `(id, icon, name)` catalog row onto a LootItem (default filter id 1).
/// The catalog stores id/icon as TEXT, so both are parsed leniently.
fn row_to_loot_item(row: &rusqlite::Row) -> rusqlite::Result<LootItem> {
    Ok(LootItem {
        item_id: row
            .get::<_, String>(0)
            .unwrap_or_else(|_| "0".to_string())
            .parse()
            .unwrap_or(0),
        filter_id: 1,
        icon_id: row
            .get::<_, String>(1)
            .unwrap_or_else(|_| "0".to_string())
            .parse()
            .unwrap_or(0),
        name: row.get(2)?,
    })
}

#[tauri::command]
fn search_eq_items(
    state: State<AppState>,
    query: String,
    tradeskill_only: Option<bool>,
) -> Result<Vec<LootItem>, String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database")?;
    let tradeskill_only = tradeskill_only.unwrap_or(false);

    let is_numeric = !query.is_empty() && query.chars().all(char::is_numeric);
    let base = if is_numeric {
        "SELECT id, icon, name FROM eq_items WHERE id = ?"
    } else {
        "SELECT id, icon, name FROM eq_items WHERE name LIKE ? ESCAPE '\\'"
    };
    // Restrict to tradeskill items when requested (tradeskills is a '0'/'1' TEXT flag).
    let sql = if tradeskill_only {
        format!("{base} AND tradeskills = '1' LIMIT {SEARCH_RESULT_LIMIT}")
    } else {
        format!("{base} LIMIT {SEARCH_RESULT_LIMIT}")
    };
    let mut stmt = db.prepare(&sql).map_err(|e| e.to_string())?;

    // Escape LIKE metacharacters so a stray % or _ doesn't match everything.
    let sql_param = if is_numeric {
        query
    } else {
        let escaped = query
            .replace('\\', "\\\\")
            .replace('%', "\\%")
            .replace('_', "\\_");
        format!("%{escaped}%")
    };

    let item_iter = stmt
        .query_map(params![sql_param], row_to_loot_item)
        .map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for item in item_iter {
        if let Ok(i) = item {
            results.push(i);
        }
    }
    Ok(results)
}

/// SQLite's default bind-variable limit is 999; stay well under it per chunk.
const ID_CHUNK: usize = 900;

/// Return the subset of `ids` that exist in the catalog. When `tradeskill_only`
/// is set, only ids flagged as tradeskill items are returned. Chunked so we
/// never exceed SQLite's bind-variable limit.
fn query_present_ids(
    conn: &Connection,
    ids: &[u32],
    tradeskill_only: bool,
) -> Result<Vec<u32>, String> {
    let mut found = Vec::new();
    for chunk in ids.chunks(ID_CHUNK) {
        let placeholders = std::iter::repeat("?")
            .take(chunk.len())
            .collect::<Vec<_>>()
            .join(",");
        let sql = if tradeskill_only {
            format!(
                "SELECT DISTINCT id FROM eq_items WHERE tradeskills = '1' AND id IN ({placeholders})"
            )
        } else {
            format!("SELECT DISTINCT id FROM eq_items WHERE id IN ({placeholders})")
        };
        let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
        // ids are stored as TEXT, so bind them as strings.
        let str_params: Vec<String> = chunk.iter().map(|i| i.to_string()).collect();
        let rows = stmt
            .query_map(rusqlite::params_from_iter(str_params.iter()), |row| {
                row.get::<_, String>(0)
            })
            .map_err(|e| e.to_string())?;
        for r in rows.flatten() {
            if let Ok(n) = r.parse::<u32>() {
                found.push(n);
            }
        }
    }
    Ok(found)
}

/// The `WHERE` clause selecting tradeskill items eligible for the tradeskill
/// depot (used by the bulk "add all tradeskill items" action). The depot only
/// accepts stackable trade goods, so this excludes anything that can't go in:
///
/// - `stacksize > 1`     — depot holds stackable trade goods only
/// - `nodrop <> '0'`     — exclude No-Trade (the flag is inverted: 0 = No Drop)
/// - `norent <> '0'`     — exclude Temporary (inverted: 0 = No Rent / temporary)
/// - `attunable <> '1'`  — exclude Attunable
/// - `loregroup = '0'`   — exclude Lore (nonzero / -1 means lore)
/// - `heirloom <> '1'`   — exclude Heirloom
/// - `bagslots = 0`      — exclude containers/bags
/// - `itemtype NOT IN …` — exclude weapons (0-4), armor (10), jewelry (29), bags (67)
///
/// Columns are TEXT in the catalog, so numeric fields are CAST and the itemtype
/// list uses string literals to match how values are stored.
const DEPOT_TRADESKILL_WHERE: &str = "tradeskills = '1' \
     AND CAST(stacksize AS INTEGER) > 1 \
     AND nodrop <> '0' \
     AND norent <> '0' \
     AND attunable <> '1' \
     AND (loregroup IS NULL OR loregroup = '0') \
     AND heirloom <> '1' \
     AND CAST(bagslots AS INTEGER) = 0 \
     AND itemtype NOT IN ('0','1','2','3','4','10','29','67')";

/// Every distinct depot-eligible tradeskill item in the catalog, as addable
/// LootItems (see `DEPOT_TRADESKILL_WHERE`).
fn query_all_tradeskill_items(conn: &Connection) -> Result<Vec<LootItem>, String> {
    let sql = format!(
        "SELECT id, icon, name FROM eq_items WHERE {DEPOT_TRADESKILL_WHERE} GROUP BY id"
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_to_loot_item)
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows.flatten() {
        if r.item_id != 0 {
            out.push(r);
        }
    }
    Ok(out)
}

/// Insert custom items into the catalog, enforcing unique item ids: an id that
/// already exists (in the catalog or earlier in this batch) is skipped. Returns
/// how many rows were actually inserted. Icons may be shared across items, so
/// only the id is required to be unique.
fn insert_custom_items(conn: &Connection, items: &[LootItem]) -> Result<usize, String> {
    let mut inserted = 0usize;
    for item in items {
        // Guard the caret-delimited format even though these come from a file
        // that was already parsed — defense in depth.
        if item.name.contains('^') || item.name.contains('\n') || item.name.contains('\r') {
            return Err(format!(
                "Item \"{}\" contains an invalid character (^, newline).",
                item.name
            ));
        }
        // INSERT ... SELECT ... WHERE NOT EXISTS makes the unique-id guarantee
        // atomic: nothing is written if the id is already present.
        let n = conn
            .execute(
                "INSERT INTO eq_items (id, name, icon, tradeskills) \
                 SELECT ?1, ?2, ?3, '0' \
                 WHERE NOT EXISTS (SELECT 1 FROM eq_items WHERE id = ?1)",
                params![item.item_id.to_string(), item.name, item.icon_id.to_string()],
            )
            .map_err(|e| e.to_string())?;
        inserted += n;
    }
    Ok(inserted)
}

/// Which of the loaded filter's item ids are tradeskill items.
#[tauri::command]
fn classify_tradeskill_ids(state: State<AppState>, ids: Vec<u32>) -> Result<Vec<u32>, String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database")?;
    query_present_ids(&db, &ids, true)
}

/// Every tradeskill item in the catalog (for "add all tradeskill items").
#[tauri::command]
fn list_tradeskill_items(state: State<AppState>) -> Result<Vec<LootItem>, String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database")?;
    query_all_tradeskill_items(&db)
}

/// Item ids present in the loaded filter but absent from the catalog (custom
/// EQL items). Order is preserved and duplicates removed.
#[tauri::command]
fn find_unknown_item_ids(state: State<AppState>, ids: Vec<u32>) -> Result<Vec<u32>, String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database")?;
    let present: std::collections::HashSet<u32> =
        query_present_ids(&db, &ids, false)?.into_iter().collect();
    let mut seen = std::collections::HashSet::new();
    let mut unknown = Vec::new();
    for id in ids {
        if !present.contains(&id) && seen.insert(id) {
            unknown.push(id);
        }
    }
    Ok(unknown)
}

/// Add custom items to the catalog. Returns the number actually inserted
/// (ids that already existed are skipped to keep item ids unique).
#[tauri::command]
fn add_custom_items(state: State<AppState>, items: Vec<LootItem>) -> Result<usize, String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database")?;
    insert_custom_items(&db, &items)
}

#[tauri::command]
fn scan_ui_directory(state: State<AppState>, dir_path: String) -> Result<ScanResult, String> {
    let mut path = PathBuf::from(&dir_path);
    if path.join("userdata").exists() {
        path.push("userdata");
    }

    if !path.exists() || !path.is_dir() {
        return Err("Directory does not exist".into());
    }

    // Canonicalize and remember this as the confined root for later file ops.
    let path = path
        .canonicalize()
        .map_err(|e| format!("Invalid directory: {e}"))?;

    let mut files = Vec::new();
    if let Ok(entries) = fs::read_dir(&path) {
        for entry in entries.flatten() {
            let p = entry.path();
            if let Some(file_name) = p.file_name().and_then(|n| n.to_str()) {
                if file_name.starts_with("LF_") && file_name.to_lowercase().ends_with(".ini") {
                    files.push(FilterFileInfo {
                        name: file_name.to_string(),
                        path: p.to_string_lossy().to_string(),
                    });
                }
            }
        }
    }
    files.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    *state
        .ui_dir
        .lock()
        .map_err(|_| "Failed to lock UI directory state".to_string())? = Some(path.clone());

    Ok(ScanResult {
        active_directory: path.to_string_lossy().to_string(),
        files,
    })
}

#[tauri::command]
fn create_advloot_file(state: State<AppState>, file_path: String) -> Result<(), String> {
    create_file_in(&ui_root(&state)?, &file_path)
}

/// Parse one caret-delimited filter line into a LootItem. Returns None for
/// section headers, blank lines, or malformed rows.
fn parse_filter_line(line: &str) -> Option<LootItem> {
    if line.starts_with('[') || line.trim().is_empty() {
        return None;
    }
    let parts: Vec<&str> = line.split('^').collect();
    if parts.len() != 4 {
        return None;
    }
    let item_id = parts[0].parse::<u32>().ok()?;
    let filter_id = parts[1].parse::<u8>().ok()?;
    let icon_id = parts[2].parse::<u32>().ok()?;
    Some(LootItem {
        item_id,
        filter_id,
        icon_id,
        name: parts[3].to_string(),
    })
}

/// Serialize the item list into the `[Filters]` file body.
fn serialize_items(items: &[LootItem]) -> String {
    let mut output = String::from("[Filters]\n");
    for item in items {
        output.push_str(&format!(
            "{}^{}^{}^{}\n",
            item.item_id, item.filter_id, item.icon_id, item.name
        ));
    }
    output
}

/// Reject item fields that would corrupt the caret-delimited format or fall
/// outside the valid filter range.
fn validate_item(item: &LootItem) -> Result<(), String> {
    if item.name.contains('^') || item.name.contains('\n') || item.name.contains('\r') {
        return Err(format!(
            "Item \"{}\" contains an invalid character (^, newline).",
            item.name
        ));
    }
    if item.filter_id < MIN_FILTER_ID || item.filter_id > MAX_FILTER_ID {
        return Err(format!(
            "Item \"{}\" has an invalid filter id {}.",
            item.name, item.filter_id
        ));
    }
    Ok(())
}

#[tauri::command]
fn load_advloot_file(state: State<AppState>, file_path: String) -> Result<Vec<LootItem>, String> {
    load_file_in(&ui_root(&state)?, &file_path)
}

#[tauri::command]
fn save_advloot_file(
    state: State<AppState>,
    file_path: String,
    items: Vec<LootItem>,
) -> Result<(), String> {
    save_file_in(&ui_root(&state)?, &file_path, &items)
}

#[tauri::command]
fn advloot_file_exists(state: State<AppState>, file_path: String) -> Result<bool, String> {
    // Used by "Save As" to warn before overwriting an existing filter.
    file_exists_in(&ui_root(&state)?, &file_path)
}

/// Last-modified time of a filter file, in milliseconds since the Unix epoch, or
/// `None` if the file doesn't exist. Polled by the frontend to detect when the
/// game (or anything else) rewrites the file while it's open. Path-confined like
/// every other file command.
#[tauri::command]
fn advloot_file_mtime(state: State<AppState>, file_path: String) -> Result<Option<u64>, String> {
    let root = ui_root(&state)?;
    let path = resolve_in_root(&root, &file_path, false)?;
    if !path.exists() {
        return Ok(None);
    }
    let modified = fs::metadata(&path)
        .and_then(|m| m.modified())
        .map_err(|e| e.to_string())?;
    let ms = modified
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_millis() as u64;
    Ok(Some(ms))
}

#[tauri::command]
fn load_settings(state: State<AppState>) -> Result<AppSettings, String> {
    if !state.settings_path.exists() {
        return Ok(AppSettings::default());
    }
    let content = fs::read_to_string(&state.settings_path).map_err(|e| e.to_string())?;
    // Fall back to defaults rather than erroring if the file is corrupt.
    Ok(serde_json::from_str(&content).unwrap_or_default())
}

#[tauri::command]
fn save_settings(state: State<AppState>, settings: AppSettings) -> Result<(), String> {
    let json = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(&state.settings_path, json).map_err(|e| e.to_string())
}

/// Keep only the newest `MAX_BACKUPS` `<file>.bak_*` files alongside `path`.
fn prune_backups(path: &Path) {
    let (Some(dir), Some(file_name)) = (
        path.parent(),
        path.file_name().and_then(|n| n.to_str()),
    ) else {
        return;
    };
    let prefix = format!("{file_name}.bak_");

    let mut backups: Vec<PathBuf> = match fs::read_dir(dir) {
        Ok(entries) => entries
            .flatten()
            .map(|e| e.path())
            .filter(|p| {
                p.file_name()
                    .and_then(|n| n.to_str())
                    .map(|n| n.starts_with(&prefix))
                    .unwrap_or(false)
            })
            .collect(),
        Err(_) => return,
    };

    // The timestamp suffix sorts chronologically, so lexical sort is fine.
    backups.sort();
    if backups.len() > MAX_BACKUPS {
        for old in &backups[..backups.len() - MAX_BACKUPS] {
            let _ = fs::remove_file(old);
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
            fs::create_dir_all(&app_data_dir).map_err(|e| e.to_string())?;
            let db_path = app_data_dir.join("items_database.sqlite");

            if !db_path.exists() {
                let resource_path = app
                    .path()
                    .resolve(
                        "items_database.sqlite",
                        tauri::path::BaseDirectory::Resource,
                    )
                    .map_err(|e| e.to_string())?;
                fs::copy(resource_path, &db_path).map_err(|e| e.to_string())?;
            }

            // Opened read-write so custom EQL items (not present in the seeded
            // catalog) can be inserted via `add_custom_items`. The bundled
            // resource itself is never touched — only the per-user copy in
            // app_data_dir.
            let db = Connection::open_with_flags(
                &db_path,
                OpenFlags::SQLITE_OPEN_READ_WRITE,
            )
            .expect("Failed to open SQLite database");
            // Speed up id lookups (classify / unknown-item scans / dedupe on
            // insert). The seeded catalog ships without indexes.
            let _ = db.execute("CREATE INDEX IF NOT EXISTS idx_eq_items_id ON eq_items(id)", []);
            app.manage(AppState {
                db: Mutex::new(db),
                ui_dir: Mutex::new(None),
                settings_path: app_data_dir.join("settings.json"),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            scan_ui_directory,
            create_advloot_file,
            load_advloot_file,
            save_advloot_file,
            advloot_file_exists,
            advloot_file_mtime,
            search_eq_items,
            classify_tradeskill_ids,
            list_tradeskill_items,
            find_unknown_item_ids,
            add_custom_items,
            load_settings,
            save_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    fn item(item_id: u32, filter_id: u8, icon_id: u32, name: &str) -> LootItem {
        LootItem {
            item_id,
            filter_id,
            icon_id,
            name: name.to_string(),
        }
    }

    #[test]
    fn parses_a_valid_line() {
        let parsed = parse_filter_line("1001^2^540^Fine Steel Sword").unwrap();
        assert_eq!(parsed.item_id, 1001);
        assert_eq!(parsed.filter_id, 2);
        assert_eq!(parsed.icon_id, 540);
        assert_eq!(parsed.name, "Fine Steel Sword");
    }

    #[test]
    fn skips_headers_blanks_and_malformed_lines() {
        assert!(parse_filter_line("[Filters]").is_none());
        assert!(parse_filter_line("   ").is_none());
        assert!(parse_filter_line("1001^2^540").is_none()); // too few fields
        assert!(parse_filter_line("abc^2^540^Name").is_none()); // non-numeric id
    }

    #[test]
    fn round_trips_through_serialize_and_parse() {
        let items = vec![item(1, 1, 500, "Alpha"), item(2, 4, 501, "Beta Gamma")];
        let body = serialize_items(&items);
        assert!(body.starts_with("[Filters]\n"));
        let reparsed: Vec<LootItem> = body.lines().filter_map(parse_filter_line).collect();
        assert_eq!(reparsed.len(), 2);
        assert_eq!(reparsed[1].name, "Beta Gamma");
        assert_eq!(reparsed[0].filter_id, 1);
    }

    #[test]
    fn rejects_names_with_delimiter_or_newline() {
        assert!(validate_item(&item(1, 1, 500, "Bad^Name")).is_err());
        assert!(validate_item(&item(1, 1, 500, "Bad\nName")).is_err());
    }

    #[test]
    fn rejects_out_of_range_filter_ids() {
        assert!(validate_item(&item(1, 0, 500, "Zero")).is_err());
        assert!(validate_item(&item(1, 5, 500, "Five")).is_err());
        assert!(validate_item(&item(1, 1, 500, "One")).is_ok());
        assert!(validate_item(&item(1, 4, 500, "Four")).is_ok());
    }

    #[test]
    fn settings_default_is_dark_mode_no_directory() {
        let s = AppSettings::default();
        assert!(s.dark_mode);
        assert!(s.ui_directory.is_none());
    }

    #[test]
    fn extracts_file_name_from_any_separator_style() {
        assert_eq!(
            sanitized_filter_file_name("LF_Zek.ini").unwrap(),
            "LF_Zek.ini"
        );
        assert_eq!(
            sanitized_filter_file_name("C:\\eq\\userdata\\LF_Zek.ini").unwrap(),
            "LF_Zek.ini"
        );
        assert_eq!(
            sanitized_filter_file_name("/home/eq/userdata/LF_Zek.ini").unwrap(),
            "LF_Zek.ini"
        );
        // Windows verbatim root (\\?\) joined with a forward slash — the exact
        // shape that broke "Save As".
        assert_eq!(
            sanitized_filter_file_name("\\\\?\\C:\\eq\\userdata/LF_Barrenn_freeport.ini").unwrap(),
            "LF_Barrenn_freeport.ini"
        );
        // .ini matched case-insensitively.
        assert_eq!(
            sanitized_filter_file_name("LF_Zek.INI").unwrap(),
            "LF_Zek.INI"
        );
        // A leading ../ is discarded because only the last segment is used.
        assert_eq!(
            sanitized_filter_file_name("../LF_evil.ini").unwrap(),
            "LF_evil.ini"
        );
    }

    #[test]
    fn rejects_non_lf_names() {
        assert!(sanitized_filter_file_name("notes.txt").is_err());
        assert!(sanitized_filter_file_name("config.ini").is_err());
        assert!(sanitized_filter_file_name("LF_no_extension").is_err());
        assert!(sanitized_filter_file_name("").is_err());
    }

    // --- Integration tests against a real temp directory ------------------

    fn sample_items() -> Vec<LootItem> {
        vec![
            item(1001, 2, 540, "Fine Steel Sword"),
            item(2002, 4, 555, "Cloth Cap"),
        ]
    }

    fn count_backups(root: &Path, name: &str) -> usize {
        let prefix = format!("{name}.bak_");
        fs::read_dir(root)
            .unwrap()
            .flatten()
            .filter(|e| e.file_name().to_string_lossy().starts_with(&prefix))
            .count()
    }

    #[test]
    fn create_writes_empty_filter_and_rejects_duplicate() {
        let dir = tempdir().unwrap();
        let root = dir.path();

        create_file_in(root, "LF_Test_Server.ini").unwrap();
        let created = root.join("LF_Test_Server.ini");
        assert!(created.exists());
        assert_eq!(fs::read_to_string(&created).unwrap(), "[Filters]\n");

        // Creating the same file again must fail.
        assert!(create_file_in(root, "LF_Test_Server.ini").is_err());
    }

    #[test]
    fn save_then_load_round_trips_items() {
        let dir = tempdir().unwrap();
        let root = dir.path();

        save_file_in(root, "LF_Round_Trip.ini", &sample_items()).unwrap();
        let loaded = load_file_in(root, "LF_Round_Trip.ini").unwrap();

        assert_eq!(loaded.len(), 2);
        assert_eq!(loaded[0].item_id, 1001);
        assert_eq!(loaded[0].filter_id, 2);
        assert_eq!(loaded[0].icon_id, 540);
        assert_eq!(loaded[0].name, "Fine Steel Sword");
        assert_eq!(loaded[1].name, "Cloth Cap");
    }

    #[test]
    fn save_uses_only_the_file_name_from_a_full_path() {
        // Mirrors the frontend passing `<root>/LF_x.ini`; the directory part is
        // ignored and the file lands directly in `root`.
        let dir = tempdir().unwrap();
        let root = dir.path();
        let full = format!("{}/LF_Nested.ini", root.display());

        save_file_in(root, &full, &sample_items()).unwrap();
        assert!(root.join("LF_Nested.ini").exists());
    }

    #[test]
    fn save_backs_up_before_overwriting() {
        let dir = tempdir().unwrap();
        let root = dir.path();

        save_file_in(root, "LF_Backup.ini", &sample_items()).unwrap();
        assert_eq!(count_backups(root, "LF_Backup.ini"), 0);

        // Overwriting should leave exactly one timestamped backup behind.
        save_file_in(root, "LF_Backup.ini", &[item(3, 1, 500, "Only One")]).unwrap();
        assert_eq!(count_backups(root, "LF_Backup.ini"), 1);

        // The live file reflects the most recent save.
        let loaded = load_file_in(root, "LF_Backup.ini").unwrap();
        assert_eq!(loaded.len(), 1);
        assert_eq!(loaded[0].name, "Only One");
    }

    #[test]
    fn load_missing_file_errors() {
        let dir = tempdir().unwrap();
        assert!(load_file_in(dir.path(), "LF_Nope.ini").is_err());
    }

    #[test]
    fn file_exists_reflects_creation() {
        let dir = tempdir().unwrap();
        let root = dir.path();

        assert!(!file_exists_in(root, "LF_Exists.ini").unwrap());
        create_file_in(root, "LF_Exists.ini").unwrap();
        assert!(file_exists_in(root, "LF_Exists.ini").unwrap());
    }

    #[test]
    fn save_rejects_bad_name_and_bad_item_without_writing() {
        let dir = tempdir().unwrap();
        let root = dir.path();

        // Bad file name is rejected outright.
        assert!(save_file_in(root, "notes.txt", &sample_items()).is_err());

        // A caret in a name is rejected, and nothing is written.
        assert!(save_file_in(root, "LF_Bad.ini", &[item(1, 1, 500, "Has^Caret")]).is_err());
        assert!(!root.join("LF_Bad.ini").exists());
    }

    // --- Catalog (tradeskill / custom-item) helpers -----------------------

    /// A tiny in-memory catalog mirroring the real schema's id/icon/tradeskills
    /// TEXT columns, seeded with a couple of tradeskill and non-tradeskill rows.
    fn test_catalog() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute(
            "CREATE TABLE eq_items (id TEXT, name TEXT, icon TEXT, tradeskills TEXT)",
            [],
        )
        .unwrap();
        let seed = [
            ("1007", "Cloth Cord", "572", "1"),
            ("1019", "Small Cloth Cord", "572", "1"),
            ("1001", "Fine Steel Sword", "540", "0"),
            ("2002", "Cloth Cap", "555", "0"),
        ];
        for (id, name, icon, ts) in seed {
            conn.execute(
                "INSERT INTO eq_items (id, name, icon, tradeskills) VALUES (?1, ?2, ?3, ?4)",
                params![id, name, icon, ts],
            )
            .unwrap();
        }
        conn
    }

    #[test]
    fn present_ids_filters_by_tradeskill_flag() {
        let conn = test_catalog();
        let ids = vec![1007, 1001, 9999]; // tradeskill, non-tradeskill, missing

        let mut all = query_present_ids(&conn, &ids, false).unwrap();
        all.sort();
        assert_eq!(all, vec![1001, 1007]);

        let ts = query_present_ids(&conn, &ids, true).unwrap();
        assert_eq!(ts, vec![1007]);
    }

    /// A catalog with the columns the depot filter inspects, seeded so exactly
    /// one row (id 100) satisfies every rule and each other row violates one.
    fn depot_catalog() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute(
            "CREATE TABLE eq_items (id TEXT, name TEXT, icon TEXT, tradeskills TEXT, \
             stacksize TEXT, nodrop TEXT, norent TEXT, attunable TEXT, loregroup TEXT, \
             heirloom TEXT, bagslots TEXT, itemtype TEXT)",
            [],
        )
        .unwrap();
        // (id, name, tradeskills, stacksize, nodrop, norent, attunable, loregroup, heirloom, bagslots, itemtype)
        let rows = [
            ("100", "Good Component", "1", "1000", "1", "1", "0", "0", "0", "0", "11"), // keep
            ("101", "Not Tradeskill", "0", "1000", "1", "1", "0", "0", "0", "0", "11"), // not TS
            ("102", "Non Stackable", "1", "1", "1", "1", "0", "0", "0", "0", "11"),     // stack=1
            ("103", "No Trade", "1", "1000", "0", "1", "0", "0", "0", "0", "11"),       // no-trade
            ("104", "Temporary", "1", "1000", "1", "0", "0", "0", "0", "0", "11"),      // temp
            ("105", "Attunable", "1", "1000", "1", "1", "1", "0", "0", "0", "11"),      // attunable
            ("106", "Lore Item", "1", "1000", "1", "1", "0", "-1", "0", "0", "11"),     // lore
            ("107", "Heirloom", "1", "1000", "1", "1", "0", "0", "1", "0", "11"),       // heirloom
            ("108", "A Bag", "1", "1000", "1", "1", "0", "0", "0", "4", "11"),          // container
            ("109", "A Weapon", "1", "1000", "1", "1", "0", "0", "0", "0", "0"),        // weapon type
            ("110", "A Ring", "1", "1000", "1", "1", "0", "0", "0", "0", "29"),         // jewelry type
        ];
        for r in rows {
            conn.execute(
                "INSERT INTO eq_items (id,name,icon,tradeskills,stacksize,nodrop,norent,\
                 attunable,loregroup,heirloom,bagslots,itemtype) \
                 VALUES (?1,?2,'500',?3,?4,?5,?6,?7,?8,?9,?10,?11)",
                params![r.0, r.1, r.2, r.3, r.4, r.5, r.6, r.7, r.8, r.9, r.10],
            )
            .unwrap();
        }
        conn
    }

    #[test]
    fn depot_filter_keeps_only_storable_components() {
        let conn = depot_catalog();
        let items = query_all_tradeskill_items(&conn).unwrap();
        // Only the one fully-eligible component survives every exclusion.
        assert_eq!(items.len(), 1);
        assert_eq!(items[0].item_id, 100);
        assert_eq!(items[0].name, "Good Component");
    }

    #[test]
    fn insert_enforces_unique_item_ids() {
        let conn = test_catalog();

        // A brand-new id is inserted; an already-present id (1001) is skipped.
        let items = vec![
            item(7777, 1, 999, "Custom Widget"),
            item(1001, 1, 540, "Duplicate Of Existing"),
        ];
        let inserted = insert_custom_items(&conn, &items).unwrap();
        assert_eq!(inserted, 1);

        // Re-inserting the same custom id is a no-op (still unique).
        let again = insert_custom_items(&conn, &[item(7777, 1, 111, "Again")]).unwrap();
        assert_eq!(again, 0);

        // Exactly one row carries id 7777.
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM eq_items WHERE id = '7777'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(count, 1);
        // Inserted as non-tradeskill.
        assert_eq!(query_present_ids(&conn, &[7777], true).unwrap(), Vec::<u32>::new());
    }

    #[test]
    fn insert_rejects_names_that_would_corrupt_the_format() {
        let conn = test_catalog();
        assert!(insert_custom_items(&conn, &[item(8888, 1, 500, "Bad^Name")]).is_err());
        assert!(insert_custom_items(&conn, &[item(8889, 1, 500, "Bad\nName")]).is_err());
        // Nothing was written.
        assert_eq!(query_present_ids(&conn, &[8888, 8889], false).unwrap(), Vec::<u32>::new());
    }
}
