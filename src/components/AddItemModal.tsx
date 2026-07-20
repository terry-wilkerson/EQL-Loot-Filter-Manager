import { useRef, useState } from "react";
import { EQIcon } from "./EQIcon";
import { searchEqItems } from "../api";
import { FILTER_MAP, type LootItem } from "../types";
import { inputStyle, modalCardStyle, modalOverlayStyle, type GlassTheme } from "../theme";

interface SelectedItem {
  item_id: number;
  icon_id: number;
  name: string;
}

interface AddItemModalProps {
  theme: GlassTheme;
  onCancel: () => void;
  onAdd: (item: LootItem) => void;
}

const SEARCH_DEBOUNCE_MS = 300;

export function AddItemModal({ theme, onCancel, onAdd }: AddItemModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<LootItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const [filterId, setFilterId] = useState(1);
  const searchTimeout = useRef<number | null>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (query.trim() === "") {
      setIsDropdownOpen(false);
      setResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const found = await searchEqItems(query.trim());
        setResults(found);
        setIsDropdownOpen(true);
      } catch (err) {
        console.error("Search failed:", err);
        setResults([]);
      }
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    onAdd({
      item_id: selected.item_id,
      icon_id: selected.icon_id,
      name: selected.name,
      filter_id: filterId,
    });
  };

  return (
    <div style={modalOverlayStyle}>
      <div
        style={{
          ...modalCardStyle,
          background: theme.cardBg,
          border: theme.cardBorder,
          overflow: "visible",
        }}
      >
        <h3 style={{ margin: "0 0 16px 0" }}>Add New Item to Filter</h3>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="🔍 Search by Item Name or ID..."
              value={
                selected ? `${selected.name} (#${selected.item_id})` : searchQuery
              }
              onChange={(e) => {
                // If they type after selecting, drop the selection and search again.
                if (selected) setSelected(null);
                handleSearch(e.target.value);
              }}
              style={inputStyle(theme)}
            />

            {isDropdownOpen && results.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  marginTop: "4px",
                  background: theme.cardBg,
                  backdropFilter: "blur(20px)",
                  border: theme.cardBorder,
                  borderRadius: "8px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                  maxHeight: "200px",
                  overflowY: "auto",
                  zIndex: 2000,
                }}
              >
                {results.map((result) => (
                  <div
                    key={result.item_id}
                    onClick={() => {
                      setSelected({
                        item_id: result.item_id,
                        icon_id: result.icon_id,
                        name: result.name,
                      });
                      setIsDropdownOpen(false);
                      setSearchQuery("");
                    }}
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <div
                      style={{
                        transform: "scale(0.6)",
                        transformOrigin: "left center",
                        width: "24px",
                      }}
                    >
                      <EQIcon iconId={result.icon_id} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 600, fontSize: "14px" }}>
                        {result.name}
                      </span>
                      <span
                        style={{ fontSize: "12px", color: theme.textSecondary }}
                      >
                        ID: #{result.item_id}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <select
            value={filterId}
            onChange={(e) => setFilterId(Number(e.target.value))}
            style={inputStyle(theme)}
            disabled={!selected}
          >
            {Object.entries(FILTER_MAP).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>

          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end",
              marginTop: "12px",
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                border: "none",
                background: theme.buttonSecondary,
                color: theme.textPrimary,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selected}
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                border: "none",
                background: selected
                  ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                  : theme.buttonSecondary,
                color: selected ? "#fff" : theme.textSecondary,
                cursor: selected ? "pointer" : "not-allowed",
                fontWeight: 600,
              }}
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
