import { modalCardStyle, modalOverlayStyle, type GlassTheme } from "../theme";

interface ReconcileModalProps {
  theme: GlassTheme;
  fileName: string;
  // Preview counts from a trial 3-way merge.
  added: number;
  conflicts: number;
  onMerge: () => void;
  onDiscard: () => void;
  onKeep: () => void;
}

// Shown when the open filter file changed on disk (e.g. the game wrote to it
// while you were playing) AND you have unsaved edits. Lets you merge the game's
// changes into your edits, discard your edits and reload, or keep editing.
export function ReconcileModal({
  theme,
  fileName,
  added,
  conflicts,
  onMerge,
  onDiscard,
  onKeep,
}: ReconcileModalProps) {
  const btn = (bg: string, color: string): React.CSSProperties => ({
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    background: bg,
    color,
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "left",
  });

  return (
    <div style={{ ...modalOverlayStyle, zIndex: 2500 }}>
      <div
        style={{
          ...modalCardStyle,
          maxWidth: "460px",
          background: theme.cardBg,
          border: theme.cardBorder,
        }}
      >
        <h3 style={{ margin: "0 0 8px 0" }}>File changed while playing</h3>
        <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: theme.textSecondary }}>
          <strong style={{ color: theme.textPrimary }}>{fileName}</strong> was
          updated on disk (likely the game looting items), and you have unsaved
          changes here.
        </p>
        <p style={{ margin: "0 0 18px 0", fontSize: "13px", color: theme.textSecondary }}>
          Merging keeps your edits and pulls in{" "}
          <strong style={{ color: theme.textPrimary }}>{added}</strong> new
          item(s) from the game
          {conflicts > 0 ? (
            <>
              {" "}
              (
              <strong style={{ color: "#f59e0b" }}>{conflicts}</strong> item(s)
              changed in both places — your version is kept)
            </>
          ) : null}
          .
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button type="button" onClick={onMerge} style={btn(theme.buttonPrimary, "#fff")}>
            🔀 Merge game changes into mine {added > 0 ? `(+${added})` : ""}
          </button>
          <button
            type="button"
            onClick={onDiscard}
            style={btn(theme.buttonSecondary, theme.textPrimary)}
          >
            ↩️ Discard my changes &amp; reload from disk
          </button>
          <button
            type="button"
            onClick={onKeep}
            style={btn(theme.buttonSecondary, theme.textPrimary)}
          >
            ✏️ Keep editing (my next save overwrites the game's changes)
          </button>
        </div>
      </div>
    </div>
  );
}
