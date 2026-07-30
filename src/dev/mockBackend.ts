// Dev-only in-memory stand-in for the Rust backend.
//
// WHY: the frontend talks to Tauri over `invoke()`. Open `npm run dev` in a
// plain browser (no Tauri shell) and there is no IPC bridge, so every command
// throws and the app renders an inert Dashboard. That makes browser-based UI
// iteration — hot reload, devtools, `/impeccable live` — impossible.
//
// This module answers the same command surface from memory instead. It is
// imported dynamically from `api.ts` behind `import.meta.env.DEV`, so Vite
// drops it from production bundles: nothing here ships, and `npm run tauri dev`
// never touches it because the real bridge is present.
//
// It deliberately mirrors the backend's *rules*, not just its shapes — path
// confinement, LF_*.ini naming, caret/newline rejection, the 200-result search
// cap, unique-id custom inserts. A UI change that would break against the real
// backend should break here too.

import type { AppSettings, LootItem, ScanResult } from "../types";
import { matchesSearch } from "../utils";
import {
  buildMockFiles,
  CATALOG,
  MOCK_FILE_PATHS,
  MOCK_UI_DIRECTORY,
  SIMULATED_LOOT,
  type CatalogItem,
} from "./fixtures";

// Mirrors SEARCH_RESULT_LIMIT in lib.rs.
const SEARCH_RESULT_LIMIT = 200;

// --- Mutable session state ----------------------------------------------

const catalog: CatalogItem[] = [...CATALOG];
const catalogIds = new Set(catalog.map((c) => c.item_id));

let files: Record<string, LootItem[]> = buildMockFiles();
const mtimes: Record<string, number> = {};
for (const path of Object.keys(files)) mtimes[path] = Date.now();

// Settings live in memory only. Persisting them would mean localStorage, which
// the real app deliberately does not use (see CLAUDE.md); keeping the fallback
// honest is worth more than surviving a page reload.
let settings: AppSettings = {
  dark_mode: true,
  ui_directory: null,
  skin: null,
};

// Artificial latency so loading overlays and debounced search actually render
// the way they do against a real filesystem and SQLite catalog. Tune live from
// the console: `__eqlMock.latencyMs = 0`.
let latencyMs = 90;

const wait = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), latencyMs));

// --- Backend rule parity -------------------------------------------------

// Mirrors `resolve_in_ui_dir`: every file command must stay inside the scanned
// directory and match LF_*.ini.
function resolveInUiDir(filePath: string): string {
  const normalized = filePath.replace(/\//g, "\\");
  if (!normalized.startsWith(MOCK_UI_DIRECTORY)) {
    throw new Error(`Path escapes the selected directory: ${filePath}`);
  }
  const name = normalized.split("\\").pop() ?? "";
  if (!/^LF_.*\.ini$/i.test(name)) {
    throw new Error(`Not a loot filter file: ${name}`);
  }
  return normalized;
}

// Mirrors `validate_item`: caret and newlines would corrupt the on-disk format.
function validateItem(item: LootItem): void {
  if (/[\^\n\r]/.test(item.name)) {
    throw new Error(
      `Item name contains a forbidden character (^, newline): "${item.name}"`,
    );
  }
  if (item.filter_id < 1 || item.filter_id > 4) {
    throw new Error(`filter_id out of range (1-4): ${item.filter_id}`);
  }
}

function touch(path: string): void {
  mtimes[path] = Date.now();
}

// --- Command surface -----------------------------------------------------

export function scanUiDirectory(dirPath: string): Promise<ScanResult> {
  settings.ui_directory = dirPath;
  return wait({
    active_directory: MOCK_UI_DIRECTORY,
    files: Object.keys(files)
      .sort()
      .map((path) => ({ name: path.split("\\").pop() ?? path, path })),
  });
}

export function loadAdvlootFile(filePath: string): Promise<LootItem[]> {
  const path = resolveInUiDir(filePath);
  const contents = files[path];
  if (!contents) throw new Error(`File not found: ${path}`);
  // Hand back a copy; the caller owns its own rows.
  return wait(contents.map((i) => ({ ...i })));
}

export function createAdvlootFile(filePath: string): Promise<void> {
  const path = resolveInUiDir(filePath);
  if (files[path]) throw new Error(`File already exists: ${path}`);
  files[path] = [];
  touch(path);
  return wait(undefined);
}

export function saveAdvlootFile(
  filePath: string,
  items: LootItem[],
): Promise<void> {
  const path = resolveInUiDir(filePath);
  items.forEach(validateItem);
  files[path] = items.map((i) => ({ ...i }));
  touch(path);
  return wait(undefined);
}

export function searchEqItems(
  query: string,
  tradeskillOnly = false,
): Promise<LootItem[]> {
  const pool = tradeskillOnly ? catalog.filter((c) => c.tradeskill) : catalog;
  const hits = pool
    .filter((c) => matchesSearch(c, query))
    .slice(0, SEARCH_RESULT_LIMIT)
    .map((c) => ({
      item_id: c.item_id,
      // Search results carry no meaningful action; the Add Item modal picks one.
      filter_id: 2,
      icon_id: c.icon_id,
      name: c.name,
    }));
  return wait(hits);
}

export function classifyTradeskillIds(ids: number[]): Promise<number[]> {
  const wanted = new Set(ids);
  return wait(
    catalog.filter((c) => c.tradeskill && wanted.has(c.item_id)).map((c) => c.item_id),
  );
}

export function listTradeskillItems(): Promise<LootItem[]> {
  return wait(
    catalog
      .filter((c) => c.depot)
      .map((c) => ({
        item_id: c.item_id,
        filter_id: 1, // Always Store, matching the bulk action's intent.
        icon_id: c.icon_id,
        name: c.name,
      })),
  );
}

export function findUnknownItemIds(ids: number[]): Promise<number[]> {
  return wait(ids.filter((id) => !catalogIds.has(id)));
}

export function addCustomItems(items: LootItem[]): Promise<number> {
  let inserted = 0;
  for (const item of items) {
    if (catalogIds.has(item.item_id)) continue; // unique ids, already-known skipped
    catalog.push({
      item_id: item.item_id,
      icon_id: item.icon_id,
      name: item.name,
      tradeskill: false,
      depot: false,
    });
    catalogIds.add(item.item_id);
    inserted++;
  }
  return wait(inserted);
}

export function advlootFileExists(filePath: string): Promise<boolean> {
  try {
    return wait(Boolean(files[resolveInUiDir(filePath)]));
  } catch {
    return wait(false);
  }
}

export function advlootFileMtime(filePath: string): Promise<number | null> {
  try {
    const path = resolveInUiDir(filePath);
    return Promise.resolve(files[path] ? mtimes[path] : null);
  } catch {
    return Promise.resolve(null);
  }
}

export function selectDirectory(): Promise<string | null> {
  return wait(MOCK_UI_DIRECTORY);
}

export function loadSettings(): Promise<AppSettings> {
  return wait({ ...settings });
}

export function saveSettings(next: AppSettings): Promise<void> {
  settings = { ...next };
  return wait(undefined);
}

// --- Console controls ----------------------------------------------------

// The interesting states of this app are the ones the game causes. Exposing
// them on `window` means the reconcile flow, the unknown-items flow and the
// slow-backend states can all be reached from devtools without a Tauri build.
export interface MockControls {
  /** Current artificial latency in ms. Set to 0 for instant responses. */
  latencyMs: number;
  /** Known fixture file paths, for convenience when calling the others. */
  paths: typeof MOCK_FILE_PATHS;
  /**
   * Simulate the game looting items and rewriting the file on disk. With no
   * unsaved edits the app auto-reloads; with unsaved edits it opens the
   * reconcile dialog.
   */
  simulateGameWrite(path?: string): void;
  /** Simulate the game deleting the open file. */
  simulateDelete(path?: string): void;
  /** Restore every fixture file to its initial contents. */
  reset(): void;
}

export function installControls(): void {
  const controls: MockControls = {
    get latencyMs() {
      return latencyMs;
    },
    set latencyMs(value: number) {
      latencyMs = Math.max(0, value);
    },
    paths: MOCK_FILE_PATHS,
    simulateGameWrite(path = MOCK_FILE_PATHS.main) {
      const current = files[path];
      if (!current) {
        console.warn(`[eql mock] no such fixture file: ${path}`);
        return;
      }
      const present = new Set(current.map((i) => i.item_id));
      const added = SIMULATED_LOOT.filter((i) => !present.has(i.item_id));
      files[path] = [...current, ...added.map((i) => ({ ...i }))];
      touch(path);
      console.info(
        `[eql mock] game wrote ${added.length} item(s) into ${path.split("\\").pop()}`,
      );
    },
    simulateDelete(path = MOCK_FILE_PATHS.main) {
      delete files[path];
      console.info(`[eql mock] deleted ${path.split("\\").pop()}`);
    },
    reset() {
      files = buildMockFiles();
      for (const path of Object.keys(files)) touch(path);
      console.info("[eql mock] fixture files reset");
    },
  };

  (window as unknown as { __eqlMock: MockControls }).__eqlMock = controls;

  console.info(
    "%c[eql mock]%c Tauri bridge not found — serving fixture data. " +
      "Console controls on window.__eqlMock",
    "color:#818cf8;font-weight:600",
    "color:inherit",
  );
}
