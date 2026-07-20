import React, { useState } from "react";

interface EQIconProps {
  iconId: number;
}

export const EQIcon: React.FC<EQIconProps> = ({ iconId }) => {
  const [loadError, setLoadError] = useState(false);

  if (!iconId || iconId < 1) {
    return (
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "6px",
          backgroundColor: "rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
        title="No Icon"
      />
    );
  }

  // EQ Column-Major & 500 Offset math
  const zeroBasedId = iconId >= 500 ? iconId - 500 : 0;
  const ICONS_PER_SHEET = 36;
  const GRID_ROWS = 6;
  const ICON_SIZE = 40;

  const sheetIndex = Math.floor(zeroBasedId / ICONS_PER_SHEET);
  const sheetNumber = sheetIndex + 1;
  const sheetUrl = `/icons/dragitem${sheetNumber}.png`;

  const positionOnSheet = zeroBasedId % ICONS_PER_SHEET;
  const colIndex = Math.floor(positionOnSheet / GRID_ROWS);
  const rowIndex = positionOnSheet % GRID_ROWS;

  const bgX = -(colIndex * ICON_SIZE);
  const bgY = -(rowIndex * ICON_SIZE);

  if (loadError) {
    return (
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "6px",
          backgroundColor: "rgba(239, 68, 68, 0.15)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          color: "#ef4444",
          fontSize: "10px",
          fontFamily: "monospace",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        title={`Missing Sheet: dragitem${sheetNumber}.png`}
      >
        ?{iconId}?
      </div>
    );
  }

  return (
    <div
      title={`Icon ID: ${iconId}`}
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "6px",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        overflow: "hidden",
        display: "inline-block",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
      }}
    >
      <img
        src={sheetUrl}
        alt=""
        style={{
          width: `${GRID_ROWS * ICON_SIZE}px`,
          height: `${GRID_ROWS * ICON_SIZE}px`,
          objectPosition: `${bgX}px ${bgY}px`,
          objectFit: "none",
          maxWidth: "none",
        }}
        onError={() => setLoadError(true)}
      />
    </div>
  );
};