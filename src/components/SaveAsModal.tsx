import { ON_ACCENT, modalCardStyle, modalOverlayStyle, type AppTheme } from "../theme";

interface SaveAsModalProps {
  theme: AppTheme;
  fileName: string;
  onFileNameChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function SaveAsModal({
  theme,
  fileName,
  onFileNameChange,
  onCancel,
  onConfirm,
}: SaveAsModalProps) {
  return (
    <div style={modalOverlayStyle(theme)}>
      <div
        style={{
          ...modalCardStyle(theme),
          background: theme.cardBg,
          border: theme.cardBorder,
        }}
      >
        <h3 style={{ margin: "0 0 16px 0" }}>Save Filter As</h3>
        <input
          type="text"
          value={fileName}
          onChange={(e) => onFileNameChange(e.target.value)}
          placeholder="LF_Character_Server.ini"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") onConfirm();
          }}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: theme.radius.action,
            border: theme.cardBorder,
            background: theme.inputBg,
            color: theme.textPrimary,
            marginBottom: "20px",
            boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "10px 16px",
              borderRadius: theme.radius.field,
              border: "none",
              background: theme.buttonSecondary,
              color: theme.textPrimary,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "10px 16px",
              borderRadius: theme.radius.field,
              border: "none",
              background: theme.buttonPrimary,
              color: ON_ACCENT,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Save As
          </button>
        </div>
      </div>
    </div>
  );
}
