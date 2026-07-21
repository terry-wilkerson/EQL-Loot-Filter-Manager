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

// --- External-change reconciliation -------------------------------------

// True when two item lists are identical in order and content. Used to decide
// whether the in-app view has unsaved edits relative to a baseline snapshot.
export function sameItems(a: LootItem[], b: LootItem[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].item_id !== b[i].item_id ||
      a[i].filter_id !== b[i].filter_id ||
      a[i].icon_id !== b[i].icon_id ||
      a[i].name !== b[i].name
    ) {
      return false;
    }
  }
  return true;
}

export interface MergeResult {
  merged: LootItem[];
  // Items the game added on disk that weren't in our view (newly looted).
  addedFromDisk: number;
  // Items changed in BOTH places to different values; our version is kept.
  conflicts: number;
}

// Three-way merge of loot filters keyed by item_id: `base` is the version we
// originally loaded, `local` is our (possibly edited) view, `disk` is the
// freshly-read file the game rewrote. Non-conflicting changes from both sides
// are kept; when the same item was changed on both sides, the local version
// wins and is counted as a conflict. New disk items are surfaced first.
//
// NOTE: item_id is treated as unique within a file (the editor dedupes on add);
// duplicate ids would collapse to one entry.
export function mergeFilters(
  base: LootItem[],
  local: LootItem[],
  disk: LootItem[],
): MergeResult {
  const bById = new Map(base.map((i) => [i.item_id, i]));
  const lById = new Map(local.map((i) => [i.item_id, i]));
  const dById = new Map(disk.map((i) => [i.item_id, i]));

  const chosen = new Map<number, LootItem>();
  const newIds = new Set<number>();
  let conflicts = 0;

  const allIds = new Set<number>([
    ...lById.keys(),
    ...dById.keys(),
    ...bById.keys(),
  ]);

  for (const id of allIds) {
    const b = bById.get(id);
    const l = lById.get(id);
    const d = dById.get(id);

    if (l && d) {
      if (l.filter_id === d.filter_id) {
        chosen.set(id, l);
      } else {
        const localChanged = !b || b.filter_id !== l.filter_id;
        const diskChanged = !b || b.filter_id !== d.filter_id;
        if (localChanged && !diskChanged) chosen.set(id, l);
        else if (diskChanged && !localChanged) chosen.set(id, d);
        else {
          chosen.set(id, l); // both changed -> keep ours
          conflicts++;
        }
      }
    } else if (l && !d) {
      if (!b) {
        chosen.set(id, l); // our addition; disk never had it
      } else if (b.filter_id !== l.filter_id) {
        chosen.set(id, l); // we edited it, game deleted it -> keep, flag
        conflicts++;
      }
      // else: game deleted it and we didn't touch it -> drop
    } else if (!l && d) {
      if (!b) {
        chosen.set(id, d); // game looted a new item
        newIds.add(id);
      } else if (b.filter_id !== d.filter_id) {
        chosen.set(id, d); // we deleted it, game edited it -> take disk, flag
        conflicts++;
      }
      // else: we deleted it and game didn't touch it -> drop
    }
  }

  // Order: newly-looted disk items first, then our existing order, then any
  // remaining chosen items (e.g. disk-side conflict keeps) in disk order.
  const emitted = new Set<number>();
  const merged: LootItem[] = [];
  const push = (id: number) => {
    const item = chosen.get(id);
    if (item && !emitted.has(id)) {
      merged.push(item);
      emitted.add(id);
    }
  };
  for (const d of disk) if (newIds.has(d.item_id)) push(d.item_id);
  for (const l of local) push(l.item_id);
  for (const d of disk) push(d.item_id);

  return { merged, addedFromDisk: newIds.size, conflicts };
}
