import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { EQIcon } from "./EQIcon";
import { FILTER_MAP, type LootRow } from "../types";
import { MONO_STACK, actionInk, actionWash, type AppTheme } from "../theme";
import type { SortKey, SortState } from "../utils";

// Below this many rows the table renders in full: windowing costs a scroll
// listener and a measurement pass, which is not worth it for a short filter.
const VIRTUALIZE_ABOVE = 120;
// Rows rendered beyond each edge of the viewport, so a fast scroll or a
// keyboard page-down does not flash empty space before the next frame.
const OVERSCAN = 10;
// Used only for the very first frame, before a real row has been measured.
const ASSUMED_ROW_HEIGHT = 67;

interface ItemTableProps {
  theme: AppTheme;
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
  const isDark = theme.isDark;

  // --- Row windowing ------------------------------------------------------
  // A filter that has had "add all tradeskill items" run against it is ~7,600
  // rows. Rendered in full that is >100k DOM nodes — roughly 30k <option>
  // elements alone — and every theme or skin change has to reconcile all of
  // them. Only the rows actually on screen are mounted; the rest are two
  // spacer rows holding the scrollbar at the right length.
  const scrollRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLTableSectionElement>(null);
  const probeRef = useRef<HTMLTableRowElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(0);
  const [rowHeight, setRowHeight] = useState(ASSUMED_ROW_HEIGHT);
  const [headHeight, setHeadHeight] = useState(0);

  const virtualize = rows.length > VIRTUALIZE_ABOVE;

  // Re-measure whenever the theme changes: skins differ in radius, padding and
  // type, so the row height is not a constant we can hard-code.
  useLayoutEffect(() => {
    const h = probeRef.current?.getBoundingClientRect().height;
    if (h && Math.abs(h - rowHeight) > 0.5) setRowHeight(h);
    const hh = headRef.current?.getBoundingClientRect().height;
    if (hh && Math.abs(hh - headHeight) > 0.5) setHeadHeight(hh);
  });

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el) setScrollTop(el.scrollTop);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setViewportH(el.clientHeight);
    const ro = new ResizeObserver(() => setViewportH(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Rows live below the sticky header in flow, so the first row starts at
  // `headHeight` in scroll coordinates.
  const firstVisible = Math.max(0, (scrollTop - headHeight) / rowHeight);
  const start = virtualize
    ? Math.max(0, Math.floor(firstVisible) - OVERSCAN)
    : 0;
  const end = virtualize
    ? Math.min(rows.length, Math.ceil(firstVisible + viewportH / rowHeight) + OVERSCAN)
    : rows.length;
  const windowed = virtualize ? rows.slice(start, end) : rows;
  const padTop = start * rowHeight;
  const padBottom = Math.max(0, (rows.length - end) * rowHeight);

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
      ref={scrollRef}
      onScroll={onScroll}
      style={{
        flex: 1,
        overflowY: "auto",
        borderRadius: theme.radius.panel,
        border: theme.cardBorder,
      }}
    >
      <table
        // Only the windowed slice is mounted, so the real row count has to be
        // announced rather than counted from the DOM.
        aria-rowcount={rows.length}
        style={{
          width: "100%",
          borderCollapse: "collapse",
          textAlign: "left",
        }}
      >
        <thead ref={headRef} style={{ position: "sticky", top: 0, zIndex: 10 }}>
          <tr
            style={{
              background: theme.tableHeadBg,
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
          {padTop > 0 && (
            <tr aria-hidden="true">
              <td colSpan={5} style={{ height: padTop, padding: 0, border: 0 }} />
            </tr>
          )}
          {rows.length > 0 ? (
            windowed.map((item, i) => (
              <tr
                key={item.uid}
                ref={i === 0 ? probeRef : undefined}
                aria-rowindex={start + i + 1}
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
                    fontFamily: MONO_STACK,
                    color: theme.textSecondary,
                  }}
                >
                  #{item.item_id}
                </td>
                <td style={{ padding: "12px 20px", fontWeight: 600 }}>
                  {item.name}
                </td>
                <td style={{ padding: "12px 20px" }}>
                  {/* The action is the only field on a row that carries
                      meaning, so it wears the colour rather than sitting in a
                      grey box identical to the two hundred boxes above it.
                      The label still names the action — the hue is a second
                      channel, never the only one. */}
                  <select
                    value={item.filter_id}
                    onChange={(e) =>
                      onChangeFilter(item.uid, Number(e.target.value))
                    }
                    style={{
                      padding: "8px 12px",
                      borderRadius: theme.radius.field,
                      border: `1px solid ${actionWash(item.filter_id, isDark ? 0.45 : 0.35)}`,
                      background: actionWash(item.filter_id, isDark ? 0.16 : 0.12),
                      color: actionInk(item.filter_id, isDark),
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {Object.entries(FILTER_MAP).map(([id, label]) => (
                      <option
                        key={id}
                        value={id}
                        // The tint belongs to the closed control. Options
                        // inherit the select's fill by default, which would
                        // drag a translucent wash into an opaque native popup.
                        style={{
                          background: theme.isDark ? "#151a22" : "#ffffff",
                          color: theme.textPrimary,
                        }}
                      >
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
                      borderRadius: theme.radius.control,
                      border: "none",
                      background: theme.isDark
                        ? "rgba(239, 68, 68, 0.15)"
                        : "rgba(185, 28, 28, 0.1)",
                      color: theme.dangerInk,
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
          {padBottom > 0 && (
            <tr aria-hidden="true">
              <td colSpan={5} style={{ height: padBottom, padding: 0, border: 0 }} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
