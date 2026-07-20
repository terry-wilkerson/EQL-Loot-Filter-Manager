// Typed wrappers around the Tauri command surface. This is the single place
// that knows the IPC contract, so the rest of the UI stays decoupled from the
// backend command names and argument casing.

import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { AppSettings, LootItem, ScanResult } from "./types";

export function scanUiDirectory(dirPath: string): Promise<ScanResult> {
  return invoke<ScanResult>("scan_ui_directory", { dirPath });
}

export function loadAdvlootFile(filePath: string): Promise<LootItem[]> {
  return invoke<LootItem[]>("load_advloot_file", { filePath });
}

export function createAdvlootFile(filePath: string): Promise<void> {
  return invoke<void>("create_advloot_file", { filePath });
}

export function saveAdvlootFile(
  filePath: string,
  items: LootItem[],
): Promise<void> {
  return invoke<void>("save_advloot_file", { filePath, items });
}

export function searchEqItems(query: string): Promise<LootItem[]> {
  return invoke<LootItem[]>("search_eq_items", { query });
}

// Opens the native folder picker; returns the chosen path or null if cancelled.
export async function selectDirectory(): Promise<string | null> {
  const selected = await open({ directory: true });
  return typeof selected === "string" ? selected : null;
}

export function loadSettings(): Promise<AppSettings> {
  return invoke<AppSettings>("load_settings");
}

export function saveSettings(settings: AppSettings): Promise<void> {
  return invoke<void>("save_settings", { settings });
}
