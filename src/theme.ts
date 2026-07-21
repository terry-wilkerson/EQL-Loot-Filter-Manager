// Glassmorphic theme values and shared style helpers.

import type { CSSProperties } from "react";

export interface GlassTheme {
  bg: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  inputBg: string;
  buttonPrimary: string;
  buttonDanger: string;
  buttonSecondary: string;
  tableRowHover: string;
}

export const SUCCESS_GRADIENT = "linear-gradient(135deg, #10b981 0%, #059669 100%)";

export function buildGlassTheme(isDarkMode: boolean): GlassTheme {
  return {
    bg: isDarkMode
      ? "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #090d16 100%)"
      : "linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 50%, #f1f5f9 100%)",
    cardBg: isDarkMode ? "rgba(15, 23, 42, 0.65)" : "rgba(255, 255, 255, 0.65)",
    cardBorder: isDarkMode
      ? "1px solid rgba(255, 255, 255, 0.1)"
      : "1px solid rgba(255, 255, 255, 0.8)",
    textPrimary: isDarkMode ? "#f8fafc" : "#0f172a",
    textSecondary: isDarkMode ? "#94a3b8" : "#64748b",
    inputBg: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(255, 255, 255, 0.9)",
    buttonPrimary: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    buttonDanger: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    buttonSecondary: isDarkMode
      ? "rgba(51, 65, 85, 0.6)"
      : "rgba(226, 232, 240, 0.8)",
    tableRowHover: isDarkMode
      ? "rgba(255, 255, 255, 0.03)"
      : "rgba(0, 0, 0, 0.02)",
  };
}

// Body reset + themed scrollbars, injected via a <style> tag.
export function buildGlobalStyles(isDarkMode: boolean): string {
  return `
    html, body, #root {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden; /* Kills the outer window scrollbar permanently */
      background-color: ${isDarkMode ? "#0f172a" : "#e0e7ff"};
    }

    ::-webkit-scrollbar {
      width: 14px;
      height: 14px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: ${isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"};
      border-radius: 10px;
      border: 4px solid ${isDarkMode ? "#131b2f" : "#e7eaf6"};
    }
    ::-webkit-scrollbar-thumb:hover {
      background: ${isDarkMode ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"};
    }
    ::-webkit-scrollbar-corner {
      background: transparent;
    }

    @keyframes eql-spin {
      to { transform: rotate(360deg); }
    }
  `;
}

export const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  backdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

export const modalCardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "420px",
  padding: "24px",
  borderRadius: "20px",
  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
};

export function inputStyle(theme: GlassTheme): CSSProperties {
  return {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: theme.cardBorder,
    background: theme.inputBg,
    color: theme.textPrimary,
    boxSizing: "border-box",
  };
}
