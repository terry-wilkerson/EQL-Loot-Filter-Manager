import { modalCardStyle, modalOverlayStyle, type GlassTheme } from "../theme";

interface ConfirmModalProps {
  theme: GlassTheme;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  theme,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div style={modalOverlayStyle}>
      <div
        style={{
          ...modalCardStyle,
          background: theme.cardBg,
          border: theme.cardBorder,
        }}
      >
        <h3 style={{ margin: "0 0 8px 0", color: "#ef4444" }}>{title}</h3>
        <p style={{ color: theme.textSecondary, marginBottom: "20px" }}>
          {message}
        </p>
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
              background: theme.buttonDanger,
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
