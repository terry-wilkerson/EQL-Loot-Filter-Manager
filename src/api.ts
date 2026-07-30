// Typed wrappers around the Tauri command surface. This is the single place
// that knows the IPC contract, so the rest of the UI stays decoupled from the
// backend command names and argument casing.
//
// It is also the single place that knows the app might be running WITHOUT a
// Tauri shell. `npm run dev` opened in a plain browser has no IPC bridge, so
// every `invoke` would throw and the UI would render inert. In that situation —
// and only in a dev build — calls route to an in-memory fixture backend
// (`./dev/mockBackend`) instead, which makes browser-based UI iteration and
// hot reload possible. `npm run tauri dev` is unaffected: the bridge exists, so
// the real commands are used. Production builds drop the fallback entirely.

import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { AppSettings, LootItem, ScanResult } from "./types";

type MockBackend = typeof import("./dev/mockBackend");

// Tauri injects this on the webview's window before any app code runs.
const hasTauriBridge = (): boolean =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

let mockBackend: Promise<MockBackend> | null = null;

function loadMock<T>(run: (backend: MockBackend) => Promise<T>): Promise<T> {
  if (!import.meta.env.DEV) {
    // Unreachable in the shipped app (there is always a bridge), and the
    // dynamic import below is dead code Vite strips from the bundle.
    return Promise.reject(
      new Error("Tauri IPC is unavailable and no dev fallback is bundled."),
    );
  }
  if (!mockBackend) {
    mockBackend = import("./dev/mockBackend").then((backend) => {
      backend.installControls();
      return backend;
    });
  }
  return mockBackend.then(run);
}

// Route one command to the real backend, or to the fixture backend when there
// is no bridge. Keeping the fallback here means callers never learn about it.
function ipc<T>(
  command: string,
  args: Record<string, unknown>,
  fallback: (backend: MockBackend) => Promise<T>,
): Promise<T> {
  return hasTauriBridge() ? invoke<T>(command, args) : loadMock(fallback);
}

export function scanUiDirectory(dirPath: string): Promise<ScanResult> {
  return ipc("scan_ui_directory", { dirPath }, (b) => b.scanUiDirectory(dirPath));
}

export function loadAdvlootFile(filePath: string): Promise<LootItem[]> {
  return ipc("load_advloot_file", { filePath }, (b) =>
    b.loadAdvlootFile(filePath),
  );
}

export function createAdvlootFile(filePath: string): Promise<void> {
  return ipc("create_advloot_file", { filePath }, (b) =>
    b.createAdvlootFile(filePath),
  );
}

export function saveAdvlootFile(
  filePath: string,
  items: LootItem[],
): Promise<void> {
  return ipc("save_advloot_file", { filePath, items }, (b) =>
    b.saveAdvlootFile(filePath, items),
  );
}

export function searchEqItems(
  query: string,
  tradeskillOnly = false,
): Promise<LootItem[]> {
  return ipc("search_eq_items", { query, tradeskillOnly }, (b) =>
    b.searchEqItems(query, tradeskillOnly),
  );
}

// Given the loaded filter's item ids, return the subset that are tradeskill
// items (per the bundled catalog's `tradeskills` flag).
export function classifyTradeskillIds(ids: number[]): Promise<number[]> {
  return ipc("classify_tradeskill_ids", { ids }, (b) =>
    b.classifyTradeskillIds(ids),
  );
}

// Every tradeskill item in the catalog, for the "add all tradeskill items" flow.
export function listTradeskillItems(): Promise<LootItem[]> {
  return ipc("list_tradeskill_items", {}, (b) => b.listTradeskillItems());
}

// Item ids present in the loaded filter but missing from the catalog (custom
// EQL items that were never seeded).
export function findUnknownItemIds(ids: number[]): Promise<number[]> {
  return ipc("find_unknown_item_ids", { ids }, (b) => b.findUnknownItemIds(ids));
}

// Insert custom items into the catalog. Item ids are kept unique (already-known
// ids are skipped); resolves with the number of rows actually inserted.
export function addCustomItems(items: LootItem[]): Promise<number> {
  return ipc("add_custom_items", { items }, (b) => b.addCustomItems(items));
}

export function advlootFileExists(filePath: string): Promise<boolean> {
  return ipc("advloot_file_exists", { filePath }, (b) =>
    b.advlootFileExists(filePath),
  );
}

// Last-modified time (ms since epoch) of a filter file, or null if it's gone.
// Polled to detect the game rewriting the file while it's open.
export function advlootFileMtime(filePath: string): Promise<number | null> {
  return ipc("advloot_file_mtime", { filePath }, (b) =>
    b.advlootFileMtime(filePath),
  );
}

// Opens the native folder picker; returns the chosen path or null if cancelled.
// Without a Tauri shell there is no native dialog, so the fixture backend
// answers with its stand-in EverQuest directory.
export async function selectDirectory(): Promise<string | null> {
  if (!hasTauriBridge()) return loadMock((b) => b.selectDirectory());
  const selected = await open({ directory: true });
  return typeof selected === "string" ? selected : null;
}

export function loadSettings(): Promise<AppSettings> {
  return ipc("load_settings", {}, (b) => b.loadSettings());
}

export function saveSettings(settings: AppSettings): Promise<void> {
  return ipc("save_settings", { settings }, (b) => b.saveSettings(settings));
}
