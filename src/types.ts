// Shared domain types and constants for the loot filter manager.

// Custom filter definitions for EverQuest Legends. The numeric ids match the
// caret-delimited on-disk format and the backend's validation range (1-4).
export const FILTER_MAP: Record<number, string> = {
  1: "Always Loot",
  2: "Always Store",
  3: "Always Merge",
  4: "Always Sell",
};

// The wire shape shared with the Rust backend (see the LootItem struct).
export interface LootItem {
  item_id: number;
  filter_id: number;
  icon_id: number;
  name: string;
}

// A LootItem plus a stable client-side id. The same item_id can legitimately
// appear more than once, so we key React rows and all edit/remove operations on
// `uid` rather than item_id (which is not guaranteed unique in a file).
export interface LootRow extends LootItem {
  uid: string;
}

export interface FilterFileInfo {
  name: string;
  path: string;
}

export interface ScanResult {
  active_directory: string;
  files: FilterFileInfo[];
}

// Persisted user preferences (mirrors the Rust AppSettings struct).
export interface AppSettings {
  dark_mode: boolean;
  ui_directory: string | null;
}

// Stable per-row id generator with a fallback for older webviews.
export const newUid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
