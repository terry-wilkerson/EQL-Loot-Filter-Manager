// Pure, framework-free helpers. Kept separate so they can be unit-tested
// without React or the Tauri runtime.

import type { LootItem } from "./types";

// Extract just the file name from a path, handling both / and \ separators.
export function baseName(path: string): string {
  return path.split(/[\\/]/).pop() ?? "";
}

// Enforce the LF_{Name}_{Server}.ini naming convention on a user-typed name.
export function formatFilterFileName(raw: string): string {
  let name = raw.trim();
  if (!name) return name;
  if (!name.startsWith("LF_")) name = `LF_${name}`;
  if (!name.toLowerCase().endsWith(".ini")) name = `${name}.ini`;
  return name;
}

// Case-insensitive match against item name, plus a substring match on the id.
export function matchesSearch(
  item: Pick<LootItem, "name" | "item_id">,
  query: string,
): boolean {
  const needle = query.toLowerCase();
  return (
    item.name.toLowerCase().includes(needle) ||
    item.item_id.toString().includes(query)
  );
}

// --- Sorting ------------------------------------------------------------

export type SortKey = "item_id" | "name" | "filter_id";
export type SortDir = "asc" | "desc";
export interface SortState {
  key: SortKey;
  dir: SortDir;
}

type SortableItem = Pick<LootItem, "item_id" | "name" | "filter_id">;

// Returns a new array sorted by the given column/direction. A null sort leaves
// the original order untouched. Stable and non-mutating (display-only concern).
export function sortRows<T extends SortableItem>(
  rows: T[],
  sort: SortState | null,
): T[] {
  if (!sort) return rows;
  const dirMul = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    let cmp: number;
    if (sort.key === "name") {
      cmp = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    } else if (sort.key === "item_id") {
      cmp = a.item_id - b.item_id;
    } else {
      cmp = a.filter_id - b.filter_id;
    }
    return cmp * dirMul;
  });
}

// Header-click cycle: unsorted -> asc -> desc -> unsorted.
export function nextSort(prev: SortState | null, key: SortKey): SortState | null {
  if (!prev || prev.key !== key) return { key, dir: "asc" };
  if (prev.dir === "asc") return { key, dir: "desc" };
  return null;
}
