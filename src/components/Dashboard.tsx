import { ON_ACCENT, type AppTheme } from "../theme";
import { IconFile } from "./Icon";
import type { FilterFileInfo } from "../types";

interface DashboardProps {
  theme: AppTheme;
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
        backdropFilter: theme.blur.work,
        borderRadius: theme.radius.workspace,
        border: theme.cardBorder,
        boxShadow: theme.elevation.work,
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
          // Read-only: a dashed border and a transparent fill so it reads as
          // a display of the current selection, not a field to type into.
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: theme.radius.chip,
            border: `1px dashed ${theme.dashedBorder}`,
            background: "transparent",
            color: uiDirectory ? theme.textPrimary : theme.textSecondary,
            fontSize: "14px",
            cursor: "default",
          }}
        />
        <button
          onClick={onSelectDirectory}
          style={{
            padding: "12px 20px",
            borderRadius: theme.radius.chip,
            border: "none",
            background: theme.buttonPrimary,
            color: ON_ACCENT,
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
              borderRadius: theme.radius.action,
              border: "none",
              background: theme.buttonSuccess,
              color: ON_ACCENT,
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
                borderRadius: theme.radius.chip,
                background: theme.inputBg,
                border: theme.cardBorder,
              }}
            >
              <span
                style={{ fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                <IconFile style={{ color: theme.textSecondary }} />
                {file.name}
              </span>
              <button
                onClick={() => onOpenFile(file.path)}
                style={{
                  padding: "8px 16px",
                  borderRadius: theme.radius.field,
                  border: "none",
                  background: theme.buttonPrimary,
                  color: ON_ACCENT,
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
              border: `2px dashed ${theme.dashedBorder}`,
              borderRadius: theme.radius.panel,
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
