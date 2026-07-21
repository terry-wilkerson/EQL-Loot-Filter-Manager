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

export function searchEqItems(
  query: string,
  tradeskillOnly = false,
): Promise<LootItem[]> {
  return invoke<LootItem[]>("search_eq_items", { query, tradeskillOnly });
}

// Given the loaded filter's item ids, return the subset that are tradeskill
// items (per the bundled catalog's `tradeskills` flag).
export function classifyTradeskillIds(ids: number[]): Promise<number[]> {
  return invoke<number[]>("classify_tradeskill_ids", { ids });
}

// Every tradeskill item in the catalog, for the "add all tradeskill items" flow.
export function listTradeskillItems(): Promise<LootItem[]> {
  return invoke<LootItem[]>("list_tradeskill_items");
}

// Item ids present in the loaded filter but missing from the catalog (custom
// EQL items that were never seeded).
export function findUnknownItemIds(ids: number[]): Promise<number[]> {
  return invoke<number[]>("find_unknown_item_ids", { ids });
}

// Insert custom items into the catalog. Item ids are kept unique (already-known
// ids are skipped); resolves with the number of rows actually inserted.
export function addCustomItems(items: LootItem[]): Promise<number> {
  return invoke<number>("add_custom_items", { items });
}

export function advlootFileExists(filePath: string): Promise<boolean> {
  return invoke<boolean>("advloot_file_exists", { filePath });
}

// Last-modified time (ms since epoch) of a filter file, or null if it's gone.
// Polled to detect the game rewriting the file while it's open.
export function advlootFileMtime(filePath: string): Promise<number | null> {
  return invoke<number | null>("advloot_file_mtime", { filePath });
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
