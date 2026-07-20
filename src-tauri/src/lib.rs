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

/// Validate that `file_path` refers to a `LF_*.ini` file living directly inside
/// the currently selected UI directory, and return the resolved path.
///
/// This is the security boundary: without it, the webview could ask the backend
/// to read or overwrite arbitrary files anywhere on disk. `require_existing`
/// distinguishes reads/overwrites (file must already exist) from creation.
fn resolve_in_ui_dir(
    state: &AppState,
    file_path: &str,
    require_existing: bool,
) -> Result<PathBuf, String> {
    let root = state
        .ui_dir
        .lock()
        .map_err(|_| "Failed to lock UI directory state".to_string())?
        .clone()
        .ok_or_else(|| "No UI directory selected".to_string())?;
    let root = root
        .canonicalize()
        .map_err(|e| format!("Invalid UI directory: {e}"))?;

    let candidate = PathBuf::from(file_path);

    let file_name = candidate
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| "Invalid file path".to_string())?
        .to_string();
    if !(file_name.starts_with("LF_") && file_name.to_lowercase().ends_with(".ini")) {
        return Err("File name must match LF_*.ini".to_string());
    }

    // Resolve the parent directory (which must already exist) and confirm it is
    // exactly the selected UI directory. Canonicalizing both sides defeats
    // "..", symlinks, and mixed separators.
    let parent = candidate
        .parent()
        .filter(|p| !p.as_os_str().is_empty())
        .ok_or_else(|| "Path must include a directory".to_string())?
        .canonicalize()
        .map_err(|e| format!("Invalid target directory: {e}"))?;
    if parent != root {
        return Err("Path is outside the selected directory".to_string());
    }

    let resolved = parent.join(&file_name);
    if require_existing && !resolved.exists() {
        return Err("File does not exist".to_string());
    }
    Ok(resolved)
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
    let path = resolve_in_ui_dir(&state, &file_path, false)?;
    if path.exists() {
        return Err("File already exists".into());
    }
    fs::write(path, "[Filters]\n").map_err(|e| e.to_string())
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
    let path = resolve_in_ui_dir(&state, &file_path, true)?;
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    Ok(content.lines().filter_map(parse_filter_line).collect())
}

#[tauri::command]
fn save_advloot_file(
    state: State<AppState>,
    file_path: String,
    items: Vec<LootItem>,
) -> Result<(), String> {
    let path = resolve_in_ui_dir(&state, &file_path, false)?;

    // Validate every record before writing anything, so a bad item can't leave a
    // half-written file. The '^' delimiter and newlines would corrupt the format.
    for item in &items {
        validate_item(item)?;
    }

    // Back up the existing file before overwriting, then prune old backups.
    if path.exists() {
        let timestamp = Local::now().format("%Y%m%d_%H%M%S");
        let backup = format!("{}.bak_{}", path.to_string_lossy(), timestamp);
        let _ = fs::copy(&path, &backup);
        prune_backups(&path);
    }

    fs::write(&path, serialize_items(&items)).map_err(|e| e.to_string())
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
}
