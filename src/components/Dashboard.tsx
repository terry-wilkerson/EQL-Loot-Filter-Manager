import { SUCCESS_GRADIENT, type GlassTheme } from "../theme";
import type { FilterFileInfo } from "../types";

interface DashboardProps {
  theme: GlassTheme;
  uiDirectory: string;
  detectedFiles: FilterFileInfo[];
  onSelectDirectory: () => void;
  onCreateNewFile: () => void;
  onOpenFile: (path: string) => void;
}

export function Dashboard({
  theme,
  uiDirectory,
  detectedFiles,
  onSelectDirectory,
  onCreateNewFile,
  onOpenFile,
}: DashboardProps) {
  return (
    <main
      style={{
        maxWidth: "800px",
        width: "100%",
        margin: "0 auto",
        padding: "32px",
        background: theme.cardBg,
        backdropFilter: "blur(20px)",
        borderRadius: "24px",
        border: theme.cardBorder,
        boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <h2 style={{ margin: "0 0 8px 0", fontSize: "22px" }}>
        EverQuest UI Directory
      </h2>
      <p
        style={{
          color: theme.textSecondary,
          marginBottom: "24px",
          fontSize: "14px",
        }}
      >
        Select your EverQuest folder to auto-detect character loot files or
        create a new filter.
      </p>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "32px",
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          readOnly
          value={uiDirectory || "No directory selected..."}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: "12px",
            border: theme.cardBorder,
            background: theme.inputBg,
            color: theme.textPrimary,
            fontSize: "14px",
          }}
        />
        <button
          onClick={onSelectDirectory}
          style={{
            padding: "12px 20px",
            borderRadius: "12px",
            border: "none",
            background: theme.buttonPrimary,
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Browse Folder
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          flexShrink: 0,
        }}
      >
        <h3 style={{ margin: 0, fontSize: "16px" }}>
          Detected Filter Files ({detectedFiles.length})
        </h3>
        {uiDirectory && (
          <button
            onClick={onCreateNewFile}
            style={{
              padding: "8px 16px",
              borderRadius: "10px",
              border: "none",
              background: SUCCESS_GRADIENT,
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Create New Filter File
          </button>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          overflowY: "auto",
          paddingRight: "8px",
        }}
      >
        {detectedFiles.length > 0 ? (
          detectedFiles.map((file) => (
            <div
              key={file.path}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 20px",
                borderRadius: "12px",
                background: theme.inputBg,
                border: theme.cardBorder,
              }}
            >
              <span style={{ fontWeight: 600 }}>📄 {file.name}</span>
              <button
                onClick={() => onOpenFile(file.path)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: theme.buttonPrimary,
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Open Filter
              </button>
            </div>
          ))
        ) : (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: theme.textSecondary,
              border: "2px dashed rgba(255,255,255,0.1)",
              borderRadius: "16px",
            }}
          >
            {uiDirectory
              ? "No loot filter files (.ini) found in this directory."
              : "Please select a directory above."}
          </div>
        )}
      </div>
    </main>
  );
}
