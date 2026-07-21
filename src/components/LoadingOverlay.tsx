import { modalOverlayStyle, type GlassTheme } from "../theme";

interface LoadingOverlayProps {
  theme: GlassTheme;
  message: string;
}

// A blocking, full-screen spinner shown during long operations (e.g. bulk
// adding the tradeskill catalog) so the app doesn't look frozen.
export function LoadingOverlay({ theme, message }: LoadingOverlayProps) {
  return (
    <div style={{ ...modalOverlayStyle, zIndex: 3000 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "18px",
          padding: "32px 40px",
          borderRadius: "20px",
          background: theme.cardBg,
          border: theme.cardBorder,
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            border: "4px solid rgba(148, 163, 184, 0.25)",
            borderTopColor: "#6366f1",
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
