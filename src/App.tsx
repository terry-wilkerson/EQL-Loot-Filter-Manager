import { useState, useEffect, useMemo, useRef } from "react";
import {
  addCustomItems,
  advlootFileExists,
  classifyTradeskillIds,
  createAdvlootFile,
  findUnknownItemIds,
  listTradeskillItems,
  loadAdvlootFile,
  loadSettings,
  saveAdvlootFile,
  saveSettings,
  scanUiDirectory,
  selectDirectory,
} from "./api";
import {
  FILTER_MAP,
  newUid,
  type LootItem,
  type LootRow,
} from "./types";
import {
  baseName,
  formatFilterFileName,
  matchesSearch,
  nextSort,
  sortRows,
  type SortKey,
  type SortState,
} from "./utils";
import { buildGlassTheme, buildGlobalStyles, SUCCESS_GRADIENT } from "./theme";
import { useToast } from "./components/Toast";
import { Dashboard } from "./components/Dashboard";
import { ItemTable } from "./components/ItemTable";
import { ConfirmModal } from "./components/ConfirmModal";
import { NewFileModal } from "./components/NewFileModal";
import { SaveAsModal } from "./components/SaveAsModal";
import { AddItemModal } from "./components/AddItemModal";
import { UnknownItemsModal } from "./components/UnknownItemsModal";
import { LoadingOverlay } from "./components/LoadingOverlay";
import type { FilterFileInfo } from "./types";

// Yield to the browser so a just-set "busy" overlay actually paints before we
// run a heavy, main-thread-blocking update.
const nextPaint = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  action: () => void;
}

const CONFIRM_CLOSED: ConfirmState = {
  isOpen: false,
  title: "",
  message: "",
  action: () => {},
};

export default function App() {
  const { showToast } = useToast();

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [uiDirectory, setUiDirectory] = useState("");
  const [detectedFiles, setDetectedFiles] = useState<FilterFileInfo[]>([]);
  const [activeFilePath, setActiveFilePath] = useState("");
  const [items, setItems] = useState<LootRow[]>([]);
  const [search, setSearch] = useState("");

  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState("LF_CharacterName_ServerName.ini");
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [saveAsName, setSaveAsName] = useState("");
  const [confirmModal, setConfirmModal] = useState<ConfirmState>(CONFIRM_CLOSED);
  const [sort, setSort] = useState<SortState | null>(null);

  // Which loaded item ids are tradeskill items (per the catalog), plus the
  // toggle that restricts the table to them. Item ids not in the catalog are
  // tracked separately so we can offer to add them (feature 3).
  const [tradeskillIds, setTradeskillIds] = useState<Set<number>>(new Set());
  const [unknownIds, setUnknownIds] = useState<number[]>([]);
  const [showTradeskillOnly, setShowTradeskillOnly] = useState(false);
  const [showUnknownModal, setShowUnknownModal] = useState(false);
  // Bumped after inserting custom items so the classify/unknown scan re-runs.
  const [dbVersion, setDbVersion] = useState(0);
  // Non-null while a long operation is running; drives the blocking overlay.
  const [busyMessage, setBusyMessage] = useState<string | null>(null);

  const theme = useMemo(() => buildGlassTheme(isDarkMode), [isDarkMode]);
  const globalStyles = useMemo(() => buildGlobalStyles(isDarkMode), [isDarkMode]);

  // Guards the persistence effect so we don't overwrite settings.json with
  // default state before the saved settings have loaded.
  const hydrated = useRef(false);

  const closeConfirm = () => setConfirmModal(CONFIRM_CLOSED);

  // On load: pull persisted settings from the backend (settings.json in the app
  // data dir), apply them, and rescan the last-used directory.
  useEffect(() => {
    (async () => {
      try {
        const settings = await loadSettings();
        setIsDarkMode(settings.dark_mode);

        let dir = settings.ui_directory;
        // One-time migration from the old localStorage key.
        if (!dir) {
          const legacy = localStorage.getItem("eq_ui_directory");
          if (legacy) {
            dir = legacy;
            localStorage.removeItem("eq_ui_directory");
          }
        }
        if (dir) {
          setUiDirectory(dir);
          await scanDirectory(dir);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        hydrated.current = true;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist settings whenever the user changes theme or directory.
  useEffect(() => {
    if (!hydrated.current) return;
    saveSettings({
      dark_mode: isDarkMode,
      ui_directory: uiDirectory || null,
    }).catch((err) => console.error("Failed to save settings:", err));
  }, [isDarkMode, uiDirectory]);

  const scanDirectory = async (dirPath: string) => {
    try {
      const result = await scanUiDirectory(dirPath);
      setDetectedFiles(result.files);
      // Update the UI directory in case Rust auto-routed us to /userdata.
      setUiDirectory(result.active_directory);
    } catch (err) {
      console.error("Failed to scan directory:", err);
      showToast(`Failed to scan directory: ${err}`, "error");
    }
  };

  const handleSelectDirectory = async () => {
    const selected = await selectDirectory();
    if (selected) {
      setUiDirectory(selected);
      scanDirectory(selected);
    }
  };

  const handleOpenFile = async (path: string) => {
    try {
      const loadedItems = await loadAdvlootFile(path);
      setItems(loadedItems.map((i) => ({ ...i, uid: newUid() })));
      setActiveFilePath(path);
    } catch (err) {
      showToast(`Failed to load file: ${err}`, "error");
    }
  };

  const handleCreateNewFile = async () => {
    const formattedName = formatFilterFileName(newFileName);
    if (!formattedName) return;

    const fullPath = `${uiDirectory}/${formattedName}`;
    try {
      await createAdvlootFile(fullPath);
      setShowNewFileModal(false);
      setNewFileName("LF_CharacterName_ServerName.ini");
      await scanDirectory(uiDirectory);
      await handleOpenFile(fullPath);
    } catch (err) {
      showToast(`Failed to create file: ${err}`, "error");
    }
  };

  const handleSaveFile = async () => {
    if (!activeFilePath) return;
    try {
      // Strip the client-only `uid` before sending to the backend.
      const payload: LootItem[] = items.map(({ uid: _uid, ...rest }) => rest);
      await saveAdvlootFile(activeFilePath, payload);
      showToast("Loot filter saved successfully!", "success");
    } catch (err) {
      showToast(`Save failed: ${err}`, "error");
    }
  };

  const openSaveAs = () => {
    setSaveAsName(baseName(activeFilePath));
    setShowSaveAsModal(true);
  };

  // Write the current items to `newPath`, switch the editor to it, and refresh.
  const performSaveAs = async (newPath: string) => {
    try {
      const payload: LootItem[] = items.map(({ uid: _uid, ...rest }) => rest);
      await saveAdvlootFile(newPath, payload);
      setShowSaveAsModal(false);
      await scanDirectory(uiDirectory);
      setActiveFilePath(newPath);
      showToast("Saved as new file!", "success");
    } catch (err) {
      showToast(`Save As failed: ${err}`, "error");
    }
  };

  const handleSaveAsConfirm = async () => {
    const formatted = formatFilterFileName(saveAsName);
    if (!formatted) return;
    const newPath = `${uiDirectory}/${formatted}`;

    // Saving under the current name is just a normal overwrite of this file, so
    // skip the overwrite prompt. Compare exactly: on case-sensitive filesystems
    // (Linux) LF_Zek.ini and LF_zek.ini really are different files.
    if (formatted === baseName(activeFilePath)) {
      await performSaveAs(newPath);
      return;
    }

    try {
      const exists = await advlootFileExists(newPath);
      if (exists) {
        setConfirmModal({
          isOpen: true,
          title: "Overwrite File?",
          message: `A filter named "${formatted}" already exists. Overwrite it? (a timestamped backup is kept.)`,
          action: () => {
            closeConfirm();
            performSaveAs(newPath);
          },
        });
      } else {
        await performSaveAs(newPath);
      }
    } catch (err) {
      showToast(`Save As failed: ${err}`, "error");
    }
  };

  const handleAddItem = (item: LootItem) => {
    // Dedupe: if this item_id is already in the list, update it in place
    // instead of creating a second row with the same id.
    const existing = items.find((i) => i.item_id === item.item_id);
    if (existing) {
      setItems((prev) =>
        prev.map((i) =>
          i.uid === existing.uid
            ? { ...i, filter_id: item.filter_id, name: item.name }
            : i,
        ),
      );
    } else {
      setItems((prev) => [{ ...item, uid: newUid() }, ...prev]);
    }
    setShowAddItemModal(false);
  };

  // Merge many items into the list at once (used by "add all tradeskill
  // items"). Existing rows are updated in place; new ids are prepended. Keyed
  // on item_id so the list never grows a duplicate id. O(n+m): incoming is
  // indexed by id so we avoid a per-row linear scan.
  const handleAddMany = (incoming: LootItem[]) => {
    if (incoming.length === 0) return;
    setItems((prev) => {
      const incomingById = new Map(incoming.map((i) => [i.item_id, i]));
      const existingIds = new Set(prev.map((row) => row.item_id));
      const merged = prev.map((row) => {
        const update = incomingById.get(row.item_id);
        return update
          ? { ...row, filter_id: update.filter_id, name: update.name }
          : row;
      });
      const additions = incoming
        .filter((i) => !existingIds.has(i.item_id))
        .map((i) => ({ ...i, uid: newUid() }));
      return [...additions, ...merged];
    });
  };

  const handleAddAllTradeskill = (filterId: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Add All Tradeskill Items",
      message: `This adds every depot-storable tradeskill item (stackable trade goods, excluding no-trade, temporary, attunable, lore, heirloom, containers, weapons, armor and jewelry) to this filter with the action "${FILTER_MAP[filterId]}". Items already in the list are updated. Continue?`,
      action: async () => {
        closeConfirm();
        setShowAddItemModal(false);
        setBusyMessage("Adding all tradeskill items…");
        await nextPaint(); // let the overlay show before the heavy work
        try {
          const list = await listTradeskillItems();
          handleAddMany(list.map((i) => ({ ...i, filter_id: filterId })));
          // Keep the overlay up until the big list has committed to the DOM.
          await nextPaint();
          showToast(`Added ${list.length} tradeskill items.`, "success");
        } catch (err) {
          showToast(`Failed to add tradeskill items: ${err}`, "error");
        } finally {
          setBusyMessage(null);
        }
      },
    });
  };

  // Add the loaded filter's unknown (custom) items to the catalog.
  const handleAddUnknownToDb = async () => {
    const unknownSet = new Set(unknownIds);
    // One row per unknown id (the first occurrence), stripped of uid.
    const seen = new Set<number>();
    const payload: LootItem[] = [];
    for (const row of items) {
      if (unknownSet.has(row.item_id) && !seen.has(row.item_id)) {
        seen.add(row.item_id);
        const { uid: _uid, ...rest } = row;
        payload.push(rest);
      }
    }
    setShowUnknownModal(false);
    setBusyMessage("Adding items to the database…");
    await nextPaint();
    try {
      const added = await addCustomItems(payload);
      setDbVersion((v) => v + 1); // trigger a re-scan
      showToast(`Added ${added} item(s) to the database.`, "success");
    } catch (err) {
      showToast(`Failed to add items to database: ${err}`, "error");
    } finally {
      setBusyMessage(null);
    }
  };

  const handleRemoveSingleItem = (uid: string) => {
    setItems((prev) => prev.filter((i) => i.uid !== uid));
  };

  const handleChangeFilter = (uid: string, filterId: number) => {
    setItems((prev) =>
      prev.map((i) => (i.uid === uid ? { ...i, filter_id: filterId } : i)),
    );
  };

  // A stable key over just the distinct item ids, so the catalog scan below
  // only re-runs when the id set changes (not on every filter-action edit).
  const itemIdKey = useMemo(
    () =>
      Array.from(new Set(items.map((i) => i.item_id)))
        .sort((a, b) => a - b)
        .join(","),
    [items],
  );

  // Whenever the loaded id set (or the catalog) changes, ask the backend which
  // ids are tradeskill items and which are unknown (custom EQL items).
  useEffect(() => {
    const ids = itemIdKey === "" ? [] : itemIdKey.split(",").map(Number);
    if (ids.length === 0) {
      setTradeskillIds(new Set());
      setUnknownIds([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [ts, unknown] = await Promise.all([
          classifyTradeskillIds(ids),
          findUnknownItemIds(ids),
        ]);
        if (!cancelled) {
          setTradeskillIds(new Set(ts));
          setUnknownIds(unknown);
        }
      } catch (err) {
        console.error("Catalog scan failed:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemIdKey, dbVersion]);

  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) =>
          matchesSearch(item, search) &&
          (!showTradeskillOnly || tradeskillIds.has(item.item_id)),
      ),
    [items, search, showTradeskillOnly, tradeskillIds],
  );

  // Sorting is a display-only concern; the saved order stays as-is.
  const displayedItems = useMemo(
    () => sortRows(filteredItems, sort),
    [filteredItems, sort],
  );

  const handleSort = (key: SortKey) => setSort((prev) => nextSort(prev, key));

  // Toggling the tradeskill filter re-renders the whole table, which can stall
  // for a moment on large lists. Show the busy overlay across the switch so the
  // UI doesn't look frozen; skip it for small lists where it's instant.
  const TRADESKILL_FILTER_BUSY_THRESHOLD = 400;
  const handleToggleTradeskillOnly = async () => {
    if (items.length < TRADESKILL_FILTER_BUSY_THRESHOLD) {
      setShowTradeskillOnly((v) => !v);
      return;
    }
    setBusyMessage("Filtering tradeskill items…");
    await nextPaint(); // paint the overlay before the heavy re-render
    setShowTradeskillOnly((v) => !v);
    await nextPaint(); // hold it until the new list has committed
    setBusyMessage(null);
  };

  const requestBulkUpdate = (newFilterId: number) => {
    if (!newFilterId || filteredItems.length === 0) return;
    const filterName = FILTER_MAP[newFilterId];
    setConfirmModal({
      isOpen: true,
      title: "Confirm Bulk Update",
      message: `Are you sure you want to set ${filteredItems.length} matching item(s) to "${filterName}"?`,
      action: () => {
        const matchedUids = new Set(filteredItems.map((i) => i.uid));
        setItems((prev) =>
          prev.map((item) =>
            matchedUids.has(item.uid)
              ? { ...item, filter_id: newFilterId }
              : item,
          ),
        );
        closeConfirm();
      },
    });
  };

  const handleBulkRemoveMatched = () => {
    if (filteredItems.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: "Bulk Remove Items",
      message: `Are you sure you want to remove all ${filteredItems.length} item(s) matching your current search filter?`,
      action: () => {
        const matchedUids = new Set(filteredItems.map((i) => i.uid));
        setItems((prev) => prev.filter((item) => !matchedUids.has(item.uid)));
        closeConfirm();
      },
    });
  };

  const handleClearAll = () => {
    setConfirmModal({
      isOpen: true,
      title: "Wipe Entire Filter",
      message: "Are you sure you want to clear ALL items from this filter list?",
      action: () => {
        setItems([]);
        closeConfirm();
      },
    });
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: theme.bg,
        color: theme.textPrimary,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        padding: "24px",
        boxSizing: "border-box",
        transition: "all 0.3s ease",
      }}
    >
      <style>{globalStyles}</style>

      {/* HEADER BAR */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          background: theme.cardBg,
          backdropFilter: "blur(16px)",
          borderRadius: "16px",
          border: theme.cardBorder,
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
          marginBottom: "24px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: theme.buttonPrimary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              color: "#fff",
              fontSize: "18px",
            }}
          >
            EQ
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 700,
                letterSpacing: "-0.5px",
              }}
            >
              EverQuest Legends Loot Manager
            </h1>
            {activeFilePath && (
              <span style={{ fontSize: "12px", color: theme.textSecondary }}>
                Editing: {activeFilePath.split("/").pop()?.split("\\").pop()}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              padding: "8px 14px",
              borderRadius: "10px",
              border: theme.cardBorder,
              background: theme.buttonSecondary,
              color: theme.textPrimary,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>

          {activeFilePath && (
            <button
              onClick={() => setActiveFilePath("")}
              style={{
                padding: "8px 14px",
                borderRadius: "10px",
                border: theme.cardBorder,
                background: theme.buttonSecondary,
                color: theme.textPrimary,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              📁 Switch File
            </button>
          )}
        </div>
      </header>

      {!activeFilePath ? (
        <Dashboard
          theme={theme}
          uiDirectory={uiDirectory}
          detectedFiles={detectedFiles}
          onSelectDirectory={handleSelectDirectory}
          onCreateNewFile={() => setShowNewFileModal(true)}
          onOpenFile={handleOpenFile}
        />
      ) : (
        <main
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "24px",
            background: theme.cardBg,
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            border: theme.cardBorder,
            boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
            overflow: "hidden",
          }}
        >
          {/* TOOLBAR */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              justifyContent: "space-between",
              marginBottom: "20px",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", flex: 1 }}>
              <input
                type="text"
                placeholder="🔍 Search item name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: theme.cardBorder,
                  background: theme.inputBg,
                  color: theme.textPrimary,
                  minWidth: "240px",
                }}
              />

              <select
                onChange={(e) => {
                  requestBulkUpdate(Number(e.target.value));
                  e.target.value = "";
                }}
                defaultValue=""
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: theme.cardBorder,
                  background: theme.inputBg,
                  color: theme.textPrimary,
                }}
              >
                <option value="" disabled>
                  ⚡ Bulk Set Matched To...
                </option>
                {Object.entries(FILTER_MAP).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>

              <button
                onClick={handleToggleTradeskillOnly}
                title="Show only items that are tradeskill items"
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: showTradeskillOnly ? "none" : theme.cardBorder,
                  background: showTradeskillOnly
                    ? theme.buttonPrimary
                    : theme.buttonSecondary,
                  color: showTradeskillOnly ? "#fff" : theme.textPrimary,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                🔨 Tradeskill Only{showTradeskillOnly ? ` (${filteredItems.length})` : ""}
              </button>

              {search && filteredItems.length > 0 && (
                <button
                  onClick={handleBulkRemoveMatched}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "10px",
                    border: "none",
                    background: theme.buttonDanger,
                    color: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  🗑️ Bulk Remove Matched ({filteredItems.length})
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setShowAddItemModal(true)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "none",
                  background: SUCCESS_GRADIENT,
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                + Add Item
              </button>
              <button
                onClick={handleSaveFile}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "none",
                  background: theme.buttonPrimary,
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                💾 Save Changes
              </button>
              <button
                onClick={openSaveAs}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: theme.cardBorder,
                  background: theme.buttonSecondary,
                  color: theme.textPrimary,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Save As…
              </button>
              <button
                onClick={handleClearAll}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: theme.cardBorder,
                  background: theme.buttonSecondary,
                  color: "#ef4444",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Clear Entire List
              </button>
            </div>
          </div>

          {unknownIds.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                padding: "12px 16px",
                marginBottom: "16px",
                borderRadius: "12px",
                background: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "13px", color: theme.textPrimary }}>
                ⚠️ {unknownIds.length} item(s) in this filter aren't in the item
                database.
              </span>
              <button
                onClick={() => setShowUnknownModal(true)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "none",
                  background: theme.buttonPrimary,
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Review &amp; Add to DB
              </button>
            </div>
          )}

          <ItemTable
            theme={theme}
            rows={displayedItems}
            sort={sort}
            onSort={handleSort}
            onChangeFilter={handleChangeFilter}
            onRemove={handleRemoveSingleItem}
          />
        </main>
      )}

      {showNewFileModal && (
        <NewFileModal
          theme={theme}
          fileName={newFileName}
          onFileNameChange={setNewFileName}
          onCancel={() => setShowNewFileModal(false)}
          onCreate={handleCreateNewFile}
        />
      )}

      {showSaveAsModal && (
        <SaveAsModal
          theme={theme}
          fileName={saveAsName}
          onFileNameChange={setSaveAsName}
          onCancel={() => setShowSaveAsModal(false)}
          onConfirm={handleSaveAsConfirm}
        />
      )}

      {showAddItemModal && (
        <AddItemModal
          theme={theme}
          onCancel={() => setShowAddItemModal(false)}
          onAdd={handleAddItem}
          onAddAllTradeskill={handleAddAllTradeskill}
        />
      )}

      {showUnknownModal && (
        <UnknownItemsModal
          theme={theme}
          items={items.filter(
            (row, idx, arr) =>
              unknownIds.includes(row.item_id) &&
              arr.findIndex((r) => r.item_id === row.item_id) === idx,
          )}
          onCancel={() => setShowUnknownModal(false)}
          onAddAll={handleAddUnknownToDb}
        />
      )}

      {confirmModal.isOpen && (
        <ConfirmModal
          theme={theme}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.action}
          onCancel={closeConfirm}
        />
      )}

      {busyMessage && <LoadingOverlay theme={theme} message={busyMessage} />}
    </div>
  );
}
