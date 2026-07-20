import { EQIcon } from "./EQIcon";
import { FILTER_MAP, type LootRow } from "../types";
import type { GlassTheme } from "../theme";
import type { SortKey, SortState } from "../utils";

interface ItemTableProps {
  theme: GlassTheme;
  rows: LootRow[];
  sort: SortState | null;
  onSort: (key: SortKey) => void;
  onChangeFilter: (uid: string, filterId: number) => void;
  onRemove: (uid: string) => void;
}

export function ItemTable({
  theme,
  rows,
  sort,
  onSort,
  onChangeFilter,
  onRemove,
}: ItemTableProps) {
  // A clickable, sortable header cell. Shows ▲/▼ for the active column, and a
  // dimmed ↕ hint on the others.
  const SortableTh = ({
    label,
    sortKey,
    align = "left",
  }: {
    label: string;
    sortKey: SortKey;
    align?: "left" | "right";
  }) => {
    const active = sort?.key === sortKey;
    const arrow = active ? (sort!.dir === "asc" ? "▲" : "▼") : "↕";
    return (
      <th
        onClick={() => onSort(sortKey)}
        title={`Sort by ${label}`}
        style={{
          padding: "14px 20px",
          textAlign: align,
          cursor: "pointer",
          userSelect: "none",
          whiteSpace: "nowrap",
        }}
      >
        {label}{" "}
        <span
          style={{
            fontSize: "11px",
            opacity: active ? 1 : 0.35,
            color: active ? theme.textPrimary : theme.textSecondary,
          }}
        >
          {arrow}
        </span>
      </th>
    );
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        borderRadius: "16px",
        border: theme.cardBorder,
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          textAlign: "left",
        }}
      >
        <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
          <tr
            style={{
              background: theme.inputBg,
              borderBottom: theme.cardBorder,
            }}
          >
            <th style={{ padding: "14px 20px" }}>Icon</th>
            <SortableTh label="Item ID" sortKey="item_id" />
            <SortableTh label="Item Name" sortKey="name" />
            <SortableTh label="Current Action Filter" sortKey="filter_id" />
            <th style={{ padding: "14px 20px", textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((item) => (
              <tr
                key={item.uid}
                style={{
                  borderBottom: theme.cardBorder,
                  transition: "background 0.2s",
                }}
              >
                <td style={{ padding: "12px 20px", width: "60px" }}>
                  <EQIcon iconId={item.icon_id} />
                </td>
                <td
                  style={{
                    padding: "12px 20px",
                    fontFamily: "monospace",
                    color: theme.textSecondary,
                  }}
                >
                  #{item.item_id}
                </td>
                <td style={{ padding: "12px 20px", fontWeight: 600 }}>
                  {item.name}
                </td>
                <td style={{ padding: "12px 20px" }}>
                  <select
                    value={item.filter_id}
                    onChange={(e) =>
                      onChangeFilter(item.uid, Number(e.target.value))
                    }
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: theme.cardBorder,
                      background: theme.inputBg,
                      color: theme.textPrimary,
                      fontWeight: 500,
                    }}
                  >
                    {Object.entries(FILTER_MAP).map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: "12px 20px", textAlign: "right" }}>
                  <button
                    onClick={() => onRemove(item.uid)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "none",
                      background: "rgba(239, 68, 68, 0.15)",
                      color: "#ef4444",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={5}
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: theme.textSecondary,
                }}
              >
                No loot items found in this filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
