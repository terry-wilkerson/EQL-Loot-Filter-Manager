import { describe, expect, it } from "vitest";
import {
  baseName,
  formatFilterFileName,
  matchesSearch,
  nextSort,
  sortRows,
} from "./utils";

describe("baseName", () => {
  it("extracts the file name from a Windows path", () => {
    expect(baseName("C:\\eq\\userdata\\LF_Zek.ini")).toBe("LF_Zek.ini");
  });

  it("extracts the file name from a POSIX path", () => {
    expect(baseName("/home/eq/userdata/LF_Zek.ini")).toBe("LF_Zek.ini");
  });

  it("returns the input when there is no separator", () => {
    expect(baseName("LF_Zek.ini")).toBe("LF_Zek.ini");
  });
});

describe("formatFilterFileName", () => {
  it("adds the LF_ prefix and .ini suffix", () => {
    expect(formatFilterFileName("Zek_Blue")).toBe("LF_Zek_Blue.ini");
  });

  it("leaves an already-conforming name unchanged", () => {
    expect(formatFilterFileName("LF_Zek_Blue.ini")).toBe("LF_Zek_Blue.ini");
  });

  it("treats the .ini suffix case-insensitively", () => {
    expect(formatFilterFileName("LF_Zek_Blue.INI")).toBe("LF_Zek_Blue.INI");
  });

  it("trims surrounding whitespace", () => {
    expect(formatFilterFileName("  Hero  ")).toBe("LF_Hero.ini");
  });

  it("returns an empty string for blank input", () => {
    expect(formatFilterFileName("   ")).toBe("");
  });
});

describe("matchesSearch", () => {
  const item = { name: "Fine Steel Dagger", item_id: 1042 };

  it("matches a case-insensitive name substring", () => {
    expect(matchesSearch(item, "steel")).toBe(true);
  });

  it("matches on a partial item id", () => {
    expect(matchesSearch(item, "104")).toBe(true);
  });

  it("returns false when nothing matches", () => {
    expect(matchesSearch(item, "orc")).toBe(false);
  });

  it("matches everything on an empty query", () => {
    expect(matchesSearch(item, "")).toBe(true);
  });
});

describe("sortRows", () => {
  const rows = [
    { item_id: 30, name: "banana", filter_id: 2 },
    { item_id: 10, name: "Apple", filter_id: 4 },
    { item_id: 20, name: "cherry", filter_id: 1 },
  ];

  it("returns the original array reference when sort is null", () => {
    expect(sortRows(rows, null)).toBe(rows);
  });

  it("sorts by item_id ascending and descending", () => {
    expect(sortRows(rows, { key: "item_id", dir: "asc" }).map((r) => r.item_id)).toEqual([10, 20, 30]);
    expect(sortRows(rows, { key: "item_id", dir: "desc" }).map((r) => r.item_id)).toEqual([30, 20, 10]);
  });

  it("sorts by name case-insensitively", () => {
    expect(sortRows(rows, { key: "name", dir: "asc" }).map((r) => r.name)).toEqual(["Apple", "banana", "cherry"]);
  });

  it("sorts by filter_id", () => {
    expect(sortRows(rows, { key: "filter_id", dir: "asc" }).map((r) => r.filter_id)).toEqual([1, 2, 4]);
  });

  it("does not mutate the input", () => {
    const before = rows.map((r) => r.item_id);
    sortRows(rows, { key: "item_id", dir: "desc" });
    expect(rows.map((r) => r.item_id)).toEqual(before);
  });
});

describe("nextSort", () => {
  it("goes unsorted -> asc -> desc -> unsorted for the same key", () => {
    const a = nextSort(null, "name");
    expect(a).toEqual({ key: "name", dir: "asc" });
    const b = nextSort(a, "name");
    expect(b).toEqual({ key: "name", dir: "desc" });
    expect(nextSort(b, "name")).toBeNull();
  });

  it("switches to asc when a different key is clicked", () => {
    expect(nextSort({ key: "name", dir: "desc" }, "item_id")).toEqual({ key: "item_id", dir: "asc" });
  });
});
