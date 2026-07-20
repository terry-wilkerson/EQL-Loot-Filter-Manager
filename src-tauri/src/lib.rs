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

#[tauri::command]
fn search_eq_items(state: State<AppState>, query: String) -> Result<Vec<LootItem>, String> {
    let db = state.db.lock().map_err(|_| "Failed to lock database")?;

    let is_numeric = !query.is_empty() && query.chars().all(char::is_numeric);
    let mut stmt = if is_numeric {
        db.prepare("SELECT id, icon, name FROM eq_items WHERE id = ? LIMIT 20")
    } else {
        db.prepare("SELECT id, icon, name FROM eq_items WHERE name LIKE ? ESCAPE '\\' LIMIT 20")
    }
    .map_err(|e| e.to_string())?;

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
        .query_map(params![sql_param], |row| {
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
        })
        .map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for item in item_iter {
        if let Ok(i) = item {
            results.push(i);
        }
    }
    Ok(results)
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

            // The item catalog is never written, so open it read-only.
            let db = Connection::open_with_flags(&db_path, OpenFlags::SQLITE_OPEN_READ_ONLY)
                .expect("Failed to open SQLite database");
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
            search_eq_items,
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
}
