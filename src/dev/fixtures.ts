// Fixture data for the dev-only browser fallback (see ./mockBackend.ts).
//
// This module is imported dynamically and only under `import.meta.env.DEV`, so
// it is dropped entirely from production bundles. Nothing here ships.
//
// Icon ids must land in a range the sprite sheets actually cover: EQIcon maps
// icon_id -> `/icons/dragitem{n}.png` with a 500 offset and 36 icons per sheet,
// and `public/icons/` holds sheets 1..379. So valid ids are 500..14143. Every
// id below stays well inside that, which means the browser fallback renders
// real artwork rather than the red "missing sheet" placeholder.

import type { LootItem } from "../types";

export interface CatalogItem {
  item_id: number;
  icon_id: number;
  name: string;
  // Broad definition: the catalog's `tradeskills = '1'` flag. Drives the
  // main-page "Tradeskill Only" toggle and the Add Item search filter.
  tradeskill: boolean;
  // Strict definition: mirrors DEPOT_TRADESKILL_WHERE in lib.rs (stackable
  // trade goods only). Drives "Add ALL Tradeskill Items". Always implies
  // `tradeskill`.
  depot: boolean;
}

const gear = (
  item_id: number,
  icon_id: number,
  name: string,
): CatalogItem => ({ item_id, icon_id, name, tradeskill: false, depot: false });

// A tradeskill item that is NOT depot-storable (non-stackable, no-trade, or an
// otherwise excluded type). Exercises the gap between the broad and strict
// definitions, which is a real source of confusion in the shipped app.
const craftOnly = (
  item_id: number,
  icon_id: number,
  name: string,
): CatalogItem => ({ item_id, icon_id, name, tradeskill: true, depot: false });

const depot = (
  item_id: number,
  icon_id: number,
  name: string,
): CatalogItem => ({ item_id, icon_id, name, tradeskill: true, depot: true });

// --- Curated catalog ----------------------------------------------------

// Weapons, armour and wearables. Deliberately includes several long names so
// the item table is exercised against realistic column pressure rather than
// tidy short strings.
const EQUIPMENT: CatalogItem[] = [
  // The example from README.md, kept verbatim so docs and fixtures agree.
  gear(1042, 540, "Fine Steel Dagger"),
  gear(1001, 501, "Rusty Long Sword"),
  gear(1002, 512, "Bronze Two Handed Sword"),
  gear(1003, 523, "Tarnished Bronze Mace"),
  gear(1004, 566, "Sarnak Battle Shield"),
  gear(1005, 588, "Shiny Brass Idol"),
  gear(1006, 604, "Cloak of Flames"),
  gear(1007, 631, "Golden Efreeti Boots"),
  gear(1008, 655, "Runed Mithril Bracer"),
  gear(1009, 672, "Gauntlets of Dragon Slaying"),
  gear(1010, 690, "Crown of Narandi"),
  gear(1011, 714, "Robe of the Whistling Fists"),
  gear(1012, 733, "Journeyman's Walking Stick"),
  gear(1013, 758, "Ivory-Handled Executioner's Axe"),
  gear(1014, 771, "Blackened Iron Chain Coif"),
  gear(1015, 802, "Wurmslayer"),
  gear(1016, 819, "Ring of the Ancients"),
  gear(1017, 844, "Earring of Woven Bloodvine"),
  gear(1018, 866, "Belt of Iniquity"),
  gear(1019, 881, "Mask of Deception"),
  gear(1020, 905, "Shissar Focus Staff"),
  gear(1021, 927, "Gatorscale Sleeves"),
  gear(1022, 949, "Testament of Vanear"),
  gear(1023, 964, "Idol of the Thorned"),
  gear(1024, 988, "Boots of the Storm"),
];

// Containers, consumables and quest pieces — not tradeskill items, but the sort
// of thing that legitimately ends up in a filter.
const SUNDRIES: CatalogItem[] = [
  gear(2001, 1002, "Bag of the Tinkerers"),
  gear(2002, 1015, "Large Sewing Kit"),
  gear(2003, 1028, "Potion of Lesser Healing"),
  gear(2004, 1044, "Scroll: Gate"),
  gear(2005, 1061, "Tattered Note"),
  gear(2006, 1077, "Bottle of Kalish"),
  gear(2007, 1090, "Journeyman's Boots"),
  gear(2008, 1103, "Gnomish Heat Source"),
  gear(2009, 1119, "Wolf Fang Charm"),
  gear(2010, 1136, "Sealed Orders"),
];

// Tradeskill items that fail the strict depot filter.
const CRAFT_ONLY: CatalogItem[] = [
  craftOnly(3001, 1201, "Enchanted Platinum Bar"), // no-trade
  craftOnly(3002, 1214, "Mounted Wurm Trophy"), // not stackable
  craftOnly(3003, 1229, "Collapsible Fishing Pole"), // has bagslots
  craftOnly(3004, 1243, "Velium Smithy Hammer"), // weapon type
  craftOnly(3005, 1256, "Ambersheen Sewing Needle"), // heirloom
  craftOnly(3006, 1270, "Tempered Steel Cuirass Mold"), // attunable
];

// Depot-storable stackable trade goods, hand-picked for recognisability.
const DEPOT_STAPLES: CatalogItem[] = [
  depot(4001, 1301, "Bone Chips"),
  depot(4002, 1312, "Spider Silk"),
  depot(4003, 1323, "Water Flask"),
  depot(4004, 1334, "Rat Ears"),
  depot(4005, 1345, "Fire Beetle Eye"),
  depot(4006, 1356, "Snake Scales"),
  depot(4007, 1367, "Wolf Meat"),
  depot(4008, 1378, "Bear Skin"),
  depot(4009, 1389, "Iron Ore"),
  depot(4010, 1400, "Coal"),
  depot(4011, 1411, "Water Flask (Enchanted)"),
  depot(4012, 1422, "Silk Thread"),
  depot(4013, 1433, "Cured Silk"),
  depot(4014, 1444, "Ruined Wolf Pelt"),
  depot(4015, 1455, "High Quality Bear Skin"),
  depot(4016, 1466, "Block of Magic Clay"),
  depot(4017, 1477, "Celestial Essence"),
  depot(4018, 1488, "Planar Fragment"),
  depot(4019, 1499, "Sacred Water"),
  depot(4020, 1510, "Vial of Velium Vapors"),
];

// --- Procedural depot goods ---------------------------------------------

// The real catalog carries roughly 7,500 depot-eligible items, so a fixture of
// twenty would make the bulk "Add ALL Tradeskill Items" action feel instant in
// a way the shipped app never does. These combinations push the fixture into
// four figures, which is close enough to surface the real render pressure on
// the item table and the loading overlay.

const MATERIALS = [
  "Silk", "Linen", "Velium", "Mithril", "Steel", "Bronze", "Copper",
  "Electrum", "Platinum", "Ivory", "Obsidian", "Jade", "Amber", "Coral",
  "Granite", "Oakwood", "Ashwood", "Bloodstone", "Moonstone", "Sandstone",
  "Rawhide", "Wyrmhide", "Chitin", "Bixie Wax", "Frost Crystal",
];

const FORMS = [
  "Bolt", "Swatch", "Ingot", "Chunk", "Shard", "Powder", "Filament",
  "Bracket", "Rivet", "Sheet", "Rod", "Flask",
];

const GRADES = ["", "Fine ", "Superb ", "Flawless "];

function buildProceduralDepot(): CatalogItem[] {
  const out: CatalogItem[] = [];
  let nextId = 20000;
  let nextIcon = 2000;

  for (const grade of GRADES) {
    for (const material of MATERIALS) {
      for (const form of FORMS) {
        out.push({
          item_id: nextId++,
          // Keep icons cycling through a range the sheets definitely cover.
          icon_id: 500 + (nextIcon++ % 9000),
          name: `${grade}${material} ${form}`,
          tradeskill: true,
          depot: true,
        });
      }
    }
  }
  return out;
}

export const CATALOG: CatalogItem[] = [
  ...EQUIPMENT,
  ...SUNDRIES,
  ...CRAFT_ONLY,
  ...DEPOT_STAPLES,
  ...buildProceduralDepot(),
];

// --- Filter files -------------------------------------------------------

export const MOCK_UI_DIRECTORY =
  "C:\\Users\\You\\Documents\\EverQuest\\userdata";

const p = (name: string) => `${MOCK_UI_DIRECTORY}\\${name}`;

export const MOCK_FILE_PATHS = {
  main: p("LF_Terrilyn_Vox.ini"),
  bank: p("LF_Bankalt_Vox.ini"),
  empty: p("LF_Freshstart_Vox.ini"),
};

const row = (item_id: number, filter_id: number): LootItem => {
  const entry = CATALOG.find((c) => c.item_id === item_id);
  return {
    item_id,
    filter_id,
    icon_id: entry?.icon_id ?? 0,
    name: entry?.name ?? `Unknown Item ${item_id}`,
  };
};

// Item ids that deliberately do NOT exist in the fixture catalog, so the
// "unknown / custom EQL item" detection path is reachable in the browser.
// Names mimic what the game writes into the file for an item the catalog
// never seeded.
const CUSTOM_ROWS: LootItem[] = [
  { item_id: 990001, filter_id: 2, icon_id: 1622, name: "Legends Token" },
  { item_id: 990002, filter_id: 1, icon_id: 1633, name: "Ethereal Parchment" },
  { item_id: 990003, filter_id: 4, icon_id: 1644, name: "Emblem of the Vale" },
];

export function buildMockFiles(): Record<string, LootItem[]> {
  return {
    [MOCK_FILE_PATHS.main]: [
      row(1042, 2),
      row(1006, 2),
      row(1015, 2),
      row(1020, 2),
      row(1001, 4),
      row(1002, 4),
      row(1003, 4),
      row(2003, 2),
      row(2005, 3),
      row(4001, 1),
      row(4002, 1),
      row(4005, 1),
      row(4009, 1),
      row(4017, 1),
      row(3001, 3),
      ...CUSTOM_ROWS,
    ],
    [MOCK_FILE_PATHS.bank]: [
      row(4003, 1),
      row(4004, 1),
      row(4006, 1),
      row(4007, 1),
      row(4008, 1),
      row(4010, 1),
      row(4012, 1),
      row(4013, 1),
      row(2001, 2),
      row(2002, 2),
    ],
    // Intentionally empty: the empty-state of the item table is a real design
    // surface and needs to be reachable without creating a file first.
    [MOCK_FILE_PATHS.empty]: [],
  };
}

// Items the simulated game "loots" when an external write is triggered from the
// console. Kept out of the initial file contents so the reconcile diff is
// meaningful.
export const SIMULATED_LOOT: LootItem[] = [
  row(1010, 2),
  row(1017, 2),
  row(4020, 1),
];
