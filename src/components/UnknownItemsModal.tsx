import { EQIcon } from "./EQIcon";
import type { LootRow } from "../types";
import { modalCardStyle, modalOverlayStyle, type GlassTheme } from "../theme";

interface UnknownItemsModalProps {
  theme: GlassTheme;
  // The loaded rows whose item ids are not in the catalog.
  items: LootRow[];
  onCancel: () => void;
  onAddAll: () => void;
}

// Lists custom EQL items found in the loaded filter that don't exist in the
// bundled catalog, and offers to add them (as non-tradeskill items).
export function UnknownItemsModal({
  theme,
  items,
  onCancel,
  onAddAll,
}: UnknownItemsModalProps) {
  return (
    <div style={modalOverlayStyle}>
      <div
        style={{
          ...modalCardStyle,
          maxWidth: "480px",
          background: theme.cardBg,
          border: theme.cardBorder,
          display: "flex",
          flexDirection: "column",
          maxHeight: "80vh",
        }}
      >
        <h3 style={{ margin: "0 0 6px 0" }}>
          Unknown Items ({items.length})
        </h3>
        <p style={{ margin: "0 0 14px 0", fontSize: "13px", color: theme.textSecondary }}>
          These items are in this filter but not in the item database. Add them
          so they show up in search and future scans. They'll be added as
          non-tradeskill items with unique ids.
        </p>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            border: theme.cardBorder,
            borderRadius: "10px",
            padding: "6px",
            marginBottom: "16px",
          }}
        >
          {items.map((item) => (
            <div
              key={item.uid}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "6px 8px",
              }}
            >
              <div
                style={{
                  transform: "scale(0.6)",
                  transformOrigin: "left center",
                  width: "24px",
                }}
              >
                <EQIcon iconId={item.icon_id} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600, fontSize: "14px" }}>
                  {item.name}
                </span>
                <span style={{ fontSize: "12px", color: theme.textSecondary }}>
                  ID: #{item.item_id}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
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
            type="button"
            onClick={onAddAll}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              background: theme.buttonPrimary,
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Add {items.length} to Database
          </button>
        </div>
      </div>
    </div>
  );
}
