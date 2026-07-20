import { useState, useEffect, useMemo, useRef } from "react";
import {
  createAdvlootFile,
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
import { AddItemModal } from "./components/AddItemModal";
import type { FilterFileInfo } from "./types";

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
  const [confirmModal, setConfirmModal] = useState<ConfirmState>(CONFIRM_CLOSED);
  const [sort, setSort] = useState<SortState | null>(null);

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

  const handleRemoveSingleItem = (uid: string) => {
    setItems((prev) => prev.filter((i) => i.uid !== uid));
  };

  const handleChangeFilter = (uid: string, filterId: number) => {
    setItems((prev) =>
      prev.map((i) => (i.uid === uid ? { ...i, filter_id: filterId } : i)),
    );
  };

  const filteredItems = useMemo(
    () => items.filter((item) => matchesSearch(item, search)),
    [items, search],
  );

  // Sorting is a display-only concern; the saved order stays as-is.
  const displayedItems = useMemo(
    () => sortRows(filteredItems, sort),
    [filteredItems, sort],
  );

  const handleSort = (key: SortKey) => setSort((prev) => nextSort(prev, key));

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

      {showAddItemModal && (
        <AddItemModal
          theme={theme}
          onCancel={() => setShowAddItemModal(false)}
          onAdd={handleAddItem}
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
    </div>
  );
}
