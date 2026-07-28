import { modalOverlayStyle, type AppTheme } from "../theme";

interface LoadingOverlayProps {
  theme: AppTheme;
  message: string;
}

// A blocking, full-screen spinner shown during long operations (e.g. bulk
// adding the tradeskill catalog) so the app doesn't look frozen.
export function LoadingOverlay({ theme, message }: LoadingOverlayProps) {
  return (
    <div style={{ ...modalOverlayStyle(theme), zIndex: 3000 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "18px",
          padding: "32px 40px",
          borderRadius: theme.radius.modal,
          background: theme.cardBg,
          border: theme.cardBorder,
          boxShadow: theme.elevation.overlay,
          backdropFilter: theme.blur.overlay,
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            border: `4px solid ${theme.isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.1)"}`,
            borderTopColor: theme.accent,
            animation: "eql-spin 0.8s linear infinite",
          }}
        />
        <span style={{ fontSize: "14px", fontWeight: 600, color: theme.textPrimary }}>
          {message}
        </span>
      </div>
    </div>
  );
}
