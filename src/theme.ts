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

// The three saturated inks, each bound to one verb (see "The One Meaning Rule"
// in DESIGN.md). Exported raw for the places that need a flat colour — toast
// status stripes, the spinner arc — and composed into the 135° gradients that
// every committing control wears.
export const SUCCESS_ACCENT = "#10b981";
export const DANGER_ACCENT = "#ef4444";
// Row-scale destruction: the same hue at 15%, so a table of two hundred rows
// never reads as two hundred alarms. See "The Two-Intensity Rule" in DESIGN.md.
export const DANGER_WASH = "rgba(239, 68, 68, 0.15)";

export const SUCCESS_GRADIENT = `linear-gradient(135deg, ${SUCCESS_ACCENT} 0%, #059669 100%)`;

// "Manifest Indigo" (see DESIGN.md) — the single accent that means "commit".
// Used raw for focus rings and the loading spinner's leading arc; the button
// gradients below are built from it.
export const ACCENT_INDIGO = "#6366f1";

// Label colour on any saturated fill. Pure white rather than Slate Paper
// (#f8fafc): on a gradient the two are indistinguishable, and one token beats
// two near-identical whites drifting apart.
export const ON_ACCENT = "#ffffff";

// The interface font stack. IBM Plex Sans is self-hosted (see FONT_FACE below)
// with the platform UI font behind it, Segoe UI named explicitly because
// Windows is where the game runs.
export const FONT_STACK =
  "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif";

// Item ids and any other machine value the eye scans for digits rather than
// reads as language. Plex Mono is the same superfamily as the interface face,
// so the second family is a role, not a second voice.
export const MONO_STACK =
  "'IBM Plex Mono', ui-monospace, SFMono-Regular, Consolas, monospace";

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

// Chrome that is not content — hairlines, row hover, scrollbar thumbs — is a
// neutral alpha overlay rather than a palette colour: white over dark glass,
// black over light. See "The Neutral Overlay Rule" in DESIGN.md.
export function overlay(isDarkMode: boolean, alpha: number): string {
  return isDarkMode
    ? `rgba(255, 255, 255, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
}

// The self-hosted type system: latin-subset IBM Plex Sans (variable, 100-700)
// and IBM Plex Mono 400, copied out of the @fontsource devDependencies into
// `public/fonts/`. Never a CDN — the app has no network dependency and must not
// acquire one. Only the weights and subset actually used are shipped.
const FONT_FACE = `
    @font-face {
      font-family: 'IBM Plex Sans';
      font-style: normal;
      font-weight: 100 700;
      font-display: swap;
      src: url('/fonts/plex-sans-variable-latin.woff2') format('woff2-variations');
    }
    @font-face {
      font-family: 'IBM Plex Mono';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: url('/fonts/plex-mono-400-latin.woff2') format('woff2');
    }
`;

// Everything inline styles cannot express: the font face, the document-level
// type reset, focus/hover/disabled states, and the themed scrollbars. Injected
// via a <style> tag so it can react to the active theme.
export function buildGlobalStyles(theme: GlassTheme, isDarkMode: boolean): string {
  return `
    ${FONT_FACE}

    html, body, #root {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden; /* Kills the outer window scrollbar permanently */
      background-color: ${isDarkMode ? "#0f172a" : "#e0e7ff"};

      /* The type stack lives here, not on the app's root <div>, so surfaces
         rendered outside that div — the toast stack — inherit it too. */
      font-family: ${FONT_STACK};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;

      /* Plex has a modest x-height and tight default fit. Light text on dark
         glass also blooms, closing counters further, so dark mode gets a touch
         of tracking back. Light mode needs none. */
      letter-spacing: ${isDarkMode ? "0.012em" : "normal"};
      line-height: 1.5;

      /* Makes native <select> popups, caret and form chrome follow the theme. */
      color-scheme: ${isDarkMode ? "dark" : "light"};
    }

    /* Item ids, counts and any other figure the eye compares down a column.
       Plex ships proper tabular figures; without this the digits jitter as
       rows scroll. */
    table, .eql-search-row {
      font-variant-numeric: tabular-nums;
    }

    /* Form controls do not inherit type by default: without this the webview
       serves Arial at 13.33px inside a 16px interface, on every button. The
       explicit size lands them on the Label step (14px) rather than inheriting
       body's 16px, which reads oversized in a 1400x600 window. */
    button, input, select, textarea {
      font: inherit;
      font-size: 14px;
    }

    /* The ring sits 2px outside the control, so on a gradient-filled button it
       lands on the card behind rather than on the same colour it is marking. */
    :focus-visible {
      outline: 2px solid ${ACCENT_INDIGO};
      outline-offset: 2px;
    }

    button:not(:disabled), select:not(:disabled) {
      transition: filter 0.15s ease, background 0.2s ease, opacity 0.15s ease;
    }
    button:not(:disabled):hover {
      filter: brightness(1.08);
    }
    button:not(:disabled):active {
      filter: brightness(0.94);
    }
    button:disabled, select:disabled, input:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    /* Row tracking across a filter that can run to hundreds of items. */
    tbody tr {
      transition: background 0.2s ease;
    }
    tbody tr:hover {
      background: ${theme.tableRowHover};
    }

    /* Item search results in the Add Item dialog. */
    .eql-search-row {
      transition: background 0.2s ease;
    }
    .eql-search-row:hover {
      background: ${overlay(isDarkMode, 0.1)};
    }

    ::-webkit-scrollbar {
      width: 14px;
      height: 14px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: ${overlay(isDarkMode, 0.2)};
      border-radius: 10px;
      border: 4px solid ${isDarkMode ? "#131b2f" : "#e7eaf6"};
    }
    ::-webkit-scrollbar-thumb:hover {
      background: ${overlay(isDarkMode, 0.3)};
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
