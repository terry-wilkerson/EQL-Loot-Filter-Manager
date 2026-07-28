// The app's visual system.
//
// Everything that makes the interface *look* like something — grounds, ink,
// control fills, corner radii, elevation, blur — resolves through one object,
// `AppTheme`, built by `buildTheme(skin, isDark)`. Components read tokens; they
// never hardcode a colour, a radius or a shadow. That is what makes the whole
// surface reskinnable from a single dropdown.
//
// Two independent axes:
//   • **skin**  — the material world (Glass / Ledger / Console / Solid)
//   • **isDark** — the light level, first-class in every skin
//
// A skin that only works in one of the two light levels is an unfinished skin.

import type { CSSProperties } from "react";

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export type SkinId = "glass" | "ledger" | "console" | "solid";

export interface SkinMeta {
  id: SkinId;
  /** Name shown in the picker. */
  label: string;
  /** The one-sentence world this skin commits to. */
  note: string;
}

// Ordered as presented in the picker; the committed world leads.
export const SKIN_LIST: SkinMeta[] = [
  {
    id: "ledger",
    label: "Ledger",
    note: "A quartermaster's stock book: opaque paper, hairline rules, square corners.",
  },
  {
    id: "glass",
    label: "Glass",
    note: "Translucent indigo night; blurred panels over a violet gradient.",
  },
  {
    id: "console",
    label: "Console",
    note: "An instrument readout: cold near-black panels and a phosphor accent.",
  },
  {
    id: "solid",
    label: "Solid",
    note: "A contemporary desktop app: opaque cards, generous radii, real shadows.",
  },
];

// Ledger is the product's committed visual world (see DESIGN.md). The other
// three remain shipped and selectable, but this is what a cold install wears.
export const DEFAULT_SKIN: SkinId = "ledger";

export function isSkinId(value: unknown): value is SkinId {
  return SKIN_LIST.some((s) => s.id === value);
}

/**
 * Corner radii are named by the **role** of the surface they wrap, not by
 * t-shirt size, so picking one is a decision about what the thing is rather
 * than about how big the number should be. See "The Radius-Tracks-Size Rule"
 * in DESIGN.md — nested surfaces must never land on the same step.
 */
export interface RadiusScale {
  /** Row-scale buttons, the icon tile. */
  control: string;
  /** Text inputs and selects. */
  field: string;
  /** Toolbar buttons, the logo tile. */
  action: string;
  /** Toasts, banners, file rows. */
  chip: string;
  /** Header bar, the table container. */
  panel: string;
  /** Modal cards and the loading card. */
  modal: string;
  /** The main workspace card and the dashboard card. */
  workspace: string;
}

/**
 * Three elevation steps and no fourth: chrome floats least, work sits above it,
 * an interruption sits above everything. A skin may express a step as `none`
 * (Ledger ranks by rule weight instead of by shadow) but may not add a step.
 */
export interface ElevationScale {
  chrome: string;
  work: string;
  overlay: string;
}

/** `backdrop-filter` values. Non-glass skins are opaque and set these to `none`. */
export interface BlurScale {
  chrome: string;
  work: string;
  overlay: string;
  toast: string;
  scrim: string;
}

export interface AppTheme {
  skin: SkinId;
  isDark: boolean;

  // Grounds
  bg: string;
  /** Flat colour behind the gradient, for the document background. */
  bgSolid: string;
  cardBg: string;
  cardBorder: string;
  inputBg: string;

  // Ink
  textPrimary: string;
  textSecondary: string;

  // Control fills. Every one of these carries `ON_ACCENT` (white) as its label,
  // so each must clear 4.5:1 against white in both light levels.
  buttonPrimary: string;
  buttonSuccess: string;
  buttonDanger: string;
  buttonSecondary: string;

  // Status inks, used as text and as stripes rather than as fills.
  accent: string;
  successInk: string;
  dangerInk: string;
  warnInk: string;

  // Table
  tableHeadBg: string;
  tableRowHover: string;
  tableRowStripe: string;

  // Structure
  radius: RadiusScale;
  elevation: ElevationScale;
  blur: BlurScale;

  // Interruption layer
  scrim: string;
  toastBg: string;
  toastBorder: string;
  toastText: string;

  // Odds and ends that would otherwise be literals in a component
  iconTileBorder: string;
  iconTileShadow: string;
  dashedBorder: string;
  warnBg: string;
  warnBorder: string;
  scrollThumb: string;
  scrollThumbHover: string;
  scrollTrackEdge: string;
}

// Kept as an alias so the name used across the components still resolves. The
// interface is no longer glass-specific; `AppTheme` is the name to use in new
// code.
export type GlassTheme = AppTheme;

// ---------------------------------------------------------------------------
// Constants that survive every skin
// ---------------------------------------------------------------------------

// Label colour on any saturated fill. Pure white rather than a near-white:
// on a saturated ground the two are indistinguishable, and one token beats two
// near-identical whites drifting apart. Every skin's control fills are chosen
// dark enough to carry it at 4.5:1.
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

// ---------------------------------------------------------------------------
// The action channel
// ---------------------------------------------------------------------------
//
// A manifest's rows are near-identical by construction — icon, id, name, a
// dropdown, a Remove. The one field that carries meaning is the loot action,
// and it was buried in an identical grey <select> on every row. This binds each
// of the four actions to a fixed hue so a filter can be scanned by colour
// instead of read row by row.
//
// It is deliberately **skin-independent**: the action of a row is data, not
// chrome, and it must mean the same thing whichever material the app is wearing
// — the same reason the game's own icon art never changes with the skin.
//
// It is separated from the control fills by intensity, not by colour. A control
// that commits wears a full-strength fill; the action channel never rises above
// a ~16% wash with a hairline and tinted text. Same logic as "The
// Two-Intensity Rule" in DESIGN.md — full strength commits, a wash annotates.
//
// The mapping: green it enters your holdings, indigo you take it, amber it
// folds into an existing stack, red it leaves your inventory. Sell drawing the
// loudest ink is intentional — it is the misfiling you would most regret.
const ACTION_RGB: Record<number, string> = {
  1: "16, 185, 129", // Always Store  → green
  2: "99, 102, 241", // Always Loot   → indigo
  3: "245, 158, 11", // Always Merge  → amber
  4: "239, 68, 68", //  Always Sell   → red
};

// For a filter_id outside 1-4, which a hand-edited file can carry.
const ACTION_RGB_FALLBACK = "148, 163, 184";

// Text-weight ink. The mid-tone hues above are decorative-only: at 14px they
// clear 4.5:1 on neither ground, so each light level gets the step of the same
// hue that does — darker over a light wash, lighter over a dark one.
const ACTION_TEXT_DARK: Record<number, string> = {
  1: "#34d399",
  2: "#a5b4fc",
  3: "#fbbf24",
  4: "#fca5a5",
};
const ACTION_TEXT_LIGHT: Record<number, string> = {
  1: "#047857",
  2: "#4338ca",
  3: "#b45309",
  4: "#b91c1c",
};

export function actionInk(filterId: number, isDark: boolean): string {
  const map = isDark ? ACTION_TEXT_DARK : ACTION_TEXT_LIGHT;
  return map[filterId] ?? (isDark ? "#cbd5e1" : "#475569");
}

export function actionWash(filterId: number, alpha: number): string {
  return `rgba(${ACTION_RGB[filterId] ?? ACTION_RGB_FALLBACK}, ${alpha})`;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

// Chrome that is not content — hairlines, row hover, scrollbar thumbs — is a
// neutral alpha overlay rather than a palette colour: white over a dark ground,
// black over a light one.
export function overlay(isDark: boolean, alpha: number): string {
  return isDark ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
}

const pick = <T,>(isDark: boolean, dark: T, light: T): T =>
  isDark ? dark : light;

// ---------------------------------------------------------------------------
// Skins
// ---------------------------------------------------------------------------

/**
 * **Glass** — the incumbent. Translucent slate at 65% over a three-stop
 * indigo → violet → black gradient, every surface carrying a backdrop blur.
 * Atmosphere is constant and unranked; the three shadow steps on top of it are
 * what rank.
 */
function glassSkin(isDark: boolean): AppTheme {
  return {
    skin: "glass",
    isDark,
    bg: pick(
      isDark,
      "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #090d16 100%)",
      "linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 50%, #f1f5f9 100%)",
    ),
    bgSolid: pick(isDark, "#0f172a", "#e0e7ff"),
    cardBg: pick(isDark, "rgba(15, 23, 42, 0.65)", "rgba(255, 255, 255, 0.65)"),
    cardBorder: pick(
      isDark,
      "1px solid rgba(255, 255, 255, 0.1)",
      "1px solid rgba(255, 255, 255, 0.8)",
    ),
    inputBg: pick(isDark, "rgba(30, 41, 59, 0.8)", "rgba(255, 255, 255, 0.9)"),
    textPrimary: pick(isDark, "#f8fafc", "#0f172a"),
    textSecondary: pick(isDark, "#94a3b8", "#64748b"),

    buttonPrimary: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    buttonSuccess: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    buttonDanger: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    buttonSecondary: pick(
      isDark,
      "rgba(51, 65, 85, 0.6)",
      "rgba(226, 232, 240, 0.8)",
    ),

    accent: pick(isDark, "#818cf8", "#4f46e5"),
    successInk: pick(isDark, "#34d399", "#047857"),
    dangerInk: pick(isDark, "#f87171", "#b91c1c"),
    warnInk: pick(isDark, "#fbbf24", "#b45309"),

    tableHeadBg: pick(isDark, "rgba(30, 41, 59, 0.8)", "rgba(255, 255, 255, 0.9)"),
    tableRowHover: overlay(isDark, isDark ? 0.07 : 0.045),
    tableRowStripe: overlay(isDark, isDark ? 0.028 : 0.022),

    radius: {
      control: "6px",
      field: "8px",
      action: "10px",
      chip: "12px",
      panel: "16px",
      modal: "20px",
      workspace: "24px",
    },
    elevation: {
      chrome: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
      work: "0 12px 40px rgba(0, 0, 0, 0.25)",
      overlay: "0 20px 50px rgba(0, 0, 0, 0.4)",
    },
    blur: {
      chrome: "blur(16px)",
      work: "blur(20px)",
      overlay: "blur(20px)",
      toast: "blur(12px)",
      scrim: "blur(8px)",
    },

    scrim: "rgba(0, 0, 0, 0.6)",
    toastBg: "rgba(15, 23, 42, 0.92)",
    toastBorder: "1px solid rgba(255, 255, 255, 0.12)",
    toastText: "#f8fafc",

    iconTileBorder: "1px solid rgba(255, 255, 255, 0.15)",
    iconTileShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
    dashedBorder: pick(isDark, "rgba(255,255,255,0.18)", "rgba(15,23,42,0.18)"),
    warnBg: "rgba(245, 158, 11, 0.12)",
    warnBorder: "1px solid rgba(245, 158, 11, 0.4)",
    scrollThumb: overlay(isDark, 0.2),
    scrollThumbHover: overlay(isDark, 0.3),
    scrollTrackEdge: pick(isDark, "#131b2f", "#e7eaf6"),
  };
}

/**
 * **Ledger** — a quartermaster's physical stock book. Opaque warm paper (or
 * ink, at night), hairline rules instead of shadows, corners that are barely
 * corners, and flat stamped accents. Nothing is translucent and nothing is
 * blurred; the ranking is carried by rule weight and by the one real shadow the
 * interruption layer is allowed.
 */
function ledgerSkin(isDark: boolean): AppTheme {
  const rule = pick(isDark, "#35322a", "#ddd6c7");
  return {
    skin: "ledger",
    isDark,
    bg: pick(isDark, "#14130f", "#efece3"),
    bgSolid: pick(isDark, "#14130f", "#efece3"),
    cardBg: pick(isDark, "#1c1b17", "#fffdf8"),
    cardBorder: `1px solid ${rule}`,
    inputBg: pick(isDark, "#232019", "#faf7ef"),
    textPrimary: pick(isDark, "#f5f0e6", "#1c1917"),
    textSecondary: pick(isDark, "#a8a29e", "#57534e"),

    // Stamped ink does not change with the paper, so the fills hold across both
    // light levels; only the surfaces around them move.
    buttonPrimary: "#1d4ed8",
    buttonSuccess: "#15803d",
    buttonDanger: "#b91c1c",
    buttonSecondary: pick(isDark, "#2b2822", "#e8e2d5"),

    accent: pick(isDark, "#60a5fa", "#1d4ed8"),
    successInk: pick(isDark, "#4ade80", "#15803d"),
    dangerInk: pick(isDark, "#f87171", "#b91c1c"),
    warnInk: pick(isDark, "#fbbf24", "#a16207"),

    tableHeadBg: pick(isDark, "#232019", "#f0ebdf"),
    tableRowHover: pick(isDark, "rgba(255, 246, 224, 0.06)", "rgba(28, 25, 23, 0.05)"),
    tableRowStripe: pick(isDark, "rgba(255, 246, 224, 0.025)", "rgba(28, 25, 23, 0.022)"),

    radius: {
      control: "2px",
      field: "2px",
      action: "3px",
      chip: "3px",
      panel: "4px",
      modal: "6px",
      workspace: "6px",
    },
    // Ledger ranks by rule weight, not by lift. Only the interruption layer —
    // where physical separation is the whole point — gets a real shadow.
    elevation: {
      chrome: "none",
      work: "none",
      overlay: "0 24px 48px rgba(0, 0, 0, 0.45)",
    },
    blur: {
      chrome: "none",
      work: "none",
      overlay: "none",
      toast: "none",
      scrim: "none",
    },

    scrim: pick(isDark, "rgba(10, 9, 7, 0.72)", "rgba(28, 25, 23, 0.42)"),
    toastBg: pick(isDark, "#232019", "#1c1917"),
    toastBorder: `1px solid ${pick(isDark, "#3d3830", "#3d3830")}`,
    toastText: "#f5f0e6",

    iconTileBorder: `1px solid ${rule}`,
    iconTileShadow: "none",
    dashedBorder: pick(isDark, "#4a453b", "#c9c0ad"),
    warnBg: pick(isDark, "rgba(161, 98, 7, 0.18)", "rgba(161, 98, 7, 0.1)"),
    warnBorder: `1px solid ${pick(isDark, "rgba(251, 191, 36, 0.4)", "rgba(161, 98, 7, 0.35)")}`,
    scrollThumb: pick(isDark, "#3d3830", "#c9c0ad"),
    scrollThumbHover: pick(isDark, "#4f483d", "#b3a891"),
    scrollTrackEdge: pick(isDark, "#1c1b17", "#efece3"),
  };
}

/**
 * **Console** — an instrument readout sitting beside the game. Cold, opaque,
 * near-black panels with a bright phosphor accent, tight 4px corners and
 * borders that read as machined edges rather than as highlights. The light
 * level flips it to a bright lab panel rather than softening it.
 */
function consoleSkin(isDark: boolean): AppTheme {
  const edge = pick(isDark, "#1e2b3d", "#b6c2d1");
  return {
    skin: "console",
    isDark,
    bg: pick(isDark, "#080b10", "#dfe4ea"),
    bgSolid: pick(isDark, "#080b10", "#dfe4ea"),
    cardBg: pick(isDark, "#0d131c", "#f2f5f8"),
    cardBorder: `1px solid ${edge}`,
    inputBg: pick(isDark, "#070c13", "#ffffff"),
    textPrimary: pick(isDark, "#dbeafe", "#0b1220"),
    textSecondary: pick(isDark, "#7d92ad", "#4a5a70"),

    buttonPrimary: "#0e7490",
    buttonSuccess: "#15803d",
    buttonDanger: "#b91c1c",
    buttonSecondary: pick(isDark, "#16202e", "#dce3ec"),

    accent: pick(isDark, "#22d3ee", "#0e7490"),
    successInk: pick(isDark, "#4ade80", "#15803d"),
    dangerInk: pick(isDark, "#fb7185", "#be123c"),
    warnInk: pick(isDark, "#fbbf24", "#b45309"),

    tableHeadBg: pick(isDark, "#111a26", "#e6ebf1"),
    tableRowHover: pick(isDark, "rgba(34, 211, 238, 0.08)", "rgba(14, 116, 144, 0.08)"),
    tableRowStripe: pick(isDark, "rgba(148, 190, 220, 0.035)", "rgba(11, 18, 32, 0.028)"),

    radius: {
      control: "3px",
      field: "4px",
      action: "4px",
      chip: "4px",
      panel: "6px",
      modal: "8px",
      workspace: "8px",
    },
    elevation: {
      chrome: "none",
      work: "0 2px 12px rgba(0, 0, 0, 0.35)",
      overlay: "0 18px 44px rgba(0, 0, 0, 0.6)",
    },
    blur: {
      chrome: "none",
      work: "none",
      overlay: "none",
      toast: "none",
      scrim: "none",
    },

    scrim: pick(isDark, "rgba(2, 6, 12, 0.78)", "rgba(11, 18, 32, 0.45)"),
    toastBg: pick(isDark, "#0d131c", "#0b1220"),
    toastBorder: `1px solid ${pick(isDark, "#22405c", "#2c3d54")}`,
    toastText: "#dbeafe",

    iconTileBorder: `1px solid ${edge}`,
    iconTileShadow: "none",
    dashedBorder: pick(isDark, "#2a3b52", "#9dabbd"),
    warnBg: pick(isDark, "rgba(245, 158, 11, 0.14)", "rgba(180, 83, 9, 0.1)"),
    warnBorder: `1px solid ${pick(isDark, "rgba(251, 191, 36, 0.45)", "rgba(180, 83, 9, 0.35)")}`,
    scrollThumb: pick(isDark, "#22405c", "#a9b6c6"),
    scrollThumbHover: pick(isDark, "#2f5679", "#8d9db1"),
    scrollTrackEdge: pick(isDark, "#0d131c", "#dfe4ea"),
  };
}

/**
 * **Solid** — a contemporary desktop product. Opaque neutral cards, generous
 * radii, and real soft shadows that carry an offset rather than a halo. The
 * quietest of the four; it lets the item art and the action colours do all the
 * talking.
 */
function solidSkin(isDark: boolean): AppTheme {
  return {
    skin: "solid",
    isDark,
    bg: pick(isDark, "#0b0d12", "#f6f7f9"),
    bgSolid: pick(isDark, "#0b0d12", "#f6f7f9"),
    cardBg: pick(isDark, "#14171f", "#ffffff"),
    cardBorder: `1px solid ${pick(isDark, "#232733", "#e4e7ec")}`,
    inputBg: pick(isDark, "#1a1e28", "#ffffff"),
    textPrimary: pick(isDark, "#eef1f7", "#111827"),
    textSecondary: pick(isDark, "#98a1b3", "#6b7280"),

    buttonPrimary: "#4f46e5",
    buttonSuccess: "#047857",
    buttonDanger: "#dc2626",
    buttonSecondary: pick(isDark, "#232733", "#eef0f4"),

    accent: pick(isDark, "#818cf8", "#4f46e5"),
    successInk: pick(isDark, "#34d399", "#047857"),
    dangerInk: pick(isDark, "#f87171", "#b91c1c"),
    warnInk: pick(isDark, "#fbbf24", "#b45309"),

    tableHeadBg: pick(isDark, "#1a1e28", "#f9fafb"),
    tableRowHover: overlay(isDark, isDark ? 0.055 : 0.035),
    tableRowStripe: overlay(isDark, isDark ? 0.022 : 0.018),

    radius: {
      control: "6px",
      field: "8px",
      action: "10px",
      chip: "12px",
      panel: "14px",
      modal: "18px",
      workspace: "18px",
    },
    elevation: {
      chrome: pick(
        isDark,
        "0 1px 3px rgba(0, 0, 0, 0.4)",
        "0 1px 2px rgba(16, 24, 40, 0.06)",
      ),
      work: pick(
        isDark,
        "0 4px 16px rgba(0, 0, 0, 0.45)",
        "0 4px 16px rgba(16, 24, 40, 0.08)",
      ),
      overlay: pick(
        isDark,
        "0 16px 48px rgba(0, 0, 0, 0.6)",
        "0 16px 48px rgba(16, 24, 40, 0.18)",
      ),
    },
    blur: {
      chrome: "none",
      work: "none",
      overlay: "none",
      toast: "none",
      scrim: "none",
    },

    scrim: pick(isDark, "rgba(3, 5, 9, 0.7)", "rgba(17, 24, 39, 0.4)"),
    toastBg: pick(isDark, "#1a1e28", "#111827"),
    toastBorder: `1px solid ${pick(isDark, "#2c3140", "#2c3140")}`,
    toastText: "#f9fafb",

    iconTileBorder: `1px solid ${pick(isDark, "#2c3140", "#e4e7ec")}`,
    iconTileShadow: pick(
      isDark,
      "0 1px 3px rgba(0, 0, 0, 0.5)",
      "0 1px 3px rgba(16, 24, 40, 0.1)",
    ),
    dashedBorder: pick(isDark, "#333846", "#d0d5dd"),
    warnBg: pick(isDark, "rgba(245, 158, 11, 0.12)", "rgba(180, 83, 9, 0.08)"),
    warnBorder: `1px solid ${pick(isDark, "rgba(251, 191, 36, 0.35)", "rgba(180, 83, 9, 0.3)")}`,
    scrollThumb: overlay(isDark, isDark ? 0.16 : 0.16),
    scrollThumbHover: overlay(isDark, isDark ? 0.26 : 0.26),
    scrollTrackEdge: pick(isDark, "#14171f", "#f6f7f9"),
  };
}

const SKIN_BUILDERS: Record<SkinId, (isDark: boolean) => AppTheme> = {
  glass: glassSkin,
  ledger: ledgerSkin,
  console: consoleSkin,
  solid: solidSkin,
};

export function buildTheme(skin: SkinId, isDark: boolean): AppTheme {
  return (SKIN_BUILDERS[skin] ?? SKIN_BUILDERS[DEFAULT_SKIN])(isDark);
}

/** Coerce a persisted (or corrupt, or absent) skin value to a real skin id. */
export function resolveSkin(value: unknown): SkinId {
  return isSkinId(value) ? value : DEFAULT_SKIN;
}

// ---------------------------------------------------------------------------
// Global stylesheet
// ---------------------------------------------------------------------------

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
// via a <style> tag so it can react to the active skin and light level.
export function buildGlobalStyles(theme: AppTheme): string {
  const { isDark } = theme;
  return `
    ${FONT_FACE}

    /* The toast stack renders above <App/> in the tree, so it cannot read the
       theme object by prop. These custom properties are the bridge: the same
       tokens, published where any surface outside the app root can reach them,
       and re-emitted whenever the skin or light level changes. */
    :root {
      --toast-bg: ${theme.toastBg};
      --toast-border: ${theme.toastBorder};
      --toast-text: ${theme.toastText};
      --toast-radius: ${theme.radius.chip};
      --toast-blur: ${theme.blur.toast};
      --toast-shadow: ${theme.elevation.overlay};
      --ink-accent: ${theme.accent};
      --ink-success: ${theme.successInk};
      --ink-danger: ${theme.dangerInk};

      /* The item tile. Published rather than passed because EQIcon renders once
         per row across hundreds of rows and in three different surfaces; a prop
         would be threaded through every one of them to say the same thing. */
      --icon-tile-radius: ${theme.radius.control};
      --icon-tile-border: ${theme.iconTileBorder};
      --icon-tile-shadow: ${theme.iconTileShadow};
      --icon-tile-empty: ${overlay(isDark, 0.06)};
    }

    html, body, #root {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden; /* Kills the outer window scrollbar permanently */
      background-color: ${theme.bgSolid};

      /* The type stack lives here, not on the app's root <div>, so surfaces
         rendered outside that div — the toast stack — inherit it too. */
      font-family: ${FONT_STACK};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;

      /* Plex has a modest x-height and tight default fit. Light text on a dark
         ground also blooms, closing counters further, so the dark level gets a
         touch of tracking back. The light level needs none. */
      letter-spacing: ${isDark ? "0.012em" : "normal"};
      line-height: 1.5;

      /* Makes native <select> popups, caret and form chrome follow the theme. */
      color-scheme: ${isDark ? "dark" : "light"};
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

    /* The ring sits 2px outside the control, so on a filled button it lands on
       the card behind rather than on the same colour it is marking. */
    :focus-visible {
      outline: 2px solid ${theme.accent};
      outline-offset: 2px;
    }

    button:not(:disabled), select:not(:disabled) {
      transition: filter 0.15s ease, background 0.2s ease, opacity 0.15s ease;
    }
    button:not(:disabled):hover {
      filter: brightness(${isDark ? 1.12 : 1.06});
    }
    button:not(:disabled):active {
      filter: brightness(0.94);
    }
    button:disabled, select:disabled, input:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    /* Row tracking across a filter that can run to hundreds of items. The band
       is what lets the eye carry a line from the icon to the Remove button
       without slipping; the hover is declared after it, at equal specificity,
       so a pointed-at row still reads on a banded row. */
    tbody tr {
      transition: background 0.2s ease;
    }
    tbody tr:nth-child(even) {
      background: ${theme.tableRowStripe};
    }
    tbody tr:hover {
      background: ${theme.tableRowHover};
    }

    /* Item search results in the Add Item dialog. */
    .eql-search-row {
      transition: background 0.2s ease;
    }
    .eql-search-row:hover {
      background: ${theme.tableRowHover};
    }

    ::-webkit-scrollbar {
      width: 14px;
      height: 14px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: ${theme.scrollThumb};
      border-radius: 10px;
      border: 4px solid ${theme.scrollTrackEdge};
    }
    ::-webkit-scrollbar-thumb:hover {
      background: ${theme.scrollThumbHover};
    }
    ::-webkit-scrollbar-corner {
      background: transparent;
    }

    @keyframes eql-spin {
      to { transform: rotate(360deg); }
    }
  `;
}

// ---------------------------------------------------------------------------
// Shared style objects
// ---------------------------------------------------------------------------

export function modalOverlayStyle(theme: AppTheme): CSSProperties {
  return {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.scrim,
    backdropFilter: theme.blur.scrim,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };
}

export function modalCardStyle(theme: AppTheme): CSSProperties {
  return {
    width: "100%",
    maxWidth: "420px",
    padding: "24px",
    borderRadius: theme.radius.modal,
    background: theme.cardBg,
    border: theme.cardBorder,
    backdropFilter: theme.blur.overlay,
    boxShadow: theme.elevation.overlay,
  };
}

export function inputStyle(theme: AppTheme): CSSProperties {
  return {
    width: "100%",
    padding: "10px 14px",
    borderRadius: theme.radius.field,
    border: theme.cardBorder,
    background: theme.inputBg,
    color: theme.textPrimary,
    boxSizing: "border-box",
  };
}
