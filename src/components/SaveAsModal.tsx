import { modalCardStyle, modalOverlayStyle, type GlassTheme } from "../theme";

interface SaveAsModalProps {
  theme: GlassTheme;
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
    <div style={modalOverlayStyle}>
      <div
        style={{
          ...modalCardStyle,
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
            borderRadius: "10px",
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
            onClick={onConfirm}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              background: theme.buttonPrimary,
              color: "#fff",
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
