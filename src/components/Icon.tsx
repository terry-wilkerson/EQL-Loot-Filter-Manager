// The interface icon set.
//
// These replace the emoji glyphs the chrome used to carry. Emoji are full-colour
// bitmaps the platform draws with its own palette: on warm paper they render as
// glossy, saturated stickers that fight the ink around them, they cannot follow
// a skin or a light level, and every OS draws a different picture for the same
// codepoint. A stock book is stamped in one ink.
//
// So every icon here is inline SVG stroked in `currentColor`, which means it
// inherits the exact ink of whatever control it sits in — automatically correct
// in day and night, and in all four skins, with nothing to keep in sync.
//
// House geometry: 24-unit box, 1.5 stroke, round caps and joins, no fill. That
// weight sits just under the 600-weight label beside it, so the icon reads as
// punctuation rather than as a second voice.

import type { CSSProperties } from "react";

interface IconProps {
  /** Rendered box in px. 16 pairs with the 14px Label step. */
  size?: number;
  style?: CSSProperties;
}

function Svg({
  size = 16,
  style,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      // Decorative: every icon in this app sits beside a text label that already
      // names the action, so exposing it to a screen reader would only stutter.
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0, display: "block", ...style }}
    >
      {children}
    </svg>
  );
}

export function IconSun(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
      <path d="m4.93 4.93 1.41 1.41M17.66 17.66l1.41 1.41M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </Svg>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </Svg>
  );
}

/** Switch File. Two opposed arrows: the swap reads at 16px where a folder
 *  crowded with an arrow turns to mush. The label carries "File". */
export function IconSwap(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 3 4 7l4 4" />
      <path d="M4 7h16" />
      <path d="m16 21 4-4-4-4" />
      <path d="M20 17H4" />
    </Svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4.35-4.35" />
    </Svg>
  );
}

export function IconHammer(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m14 12-8.4 8.4a1.9 1.9 0 1 1-2.7-2.7L11.3 9.3" />
      <path d="m17.5 14.5 3-3" />
      <path d="M21.5 11.5 19.6 9.6A2 2 0 0 1 19 8.2V7l-2.3-2.3a6 6 0 0 0-4.2-1.7L9 3l.9.8A6.2 6.2 0 0 1 12 8.4V10l2 2h1.2a2 2 0 0 1 1.4.6l1.9 1.9" />
    </Svg>
  );
}

export function IconSave(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
      <path d="M7 3v4a1 1 0 0 0 1 1h6" />
    </Svg>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6M14 11v6" />
    </Svg>
  );
}

export function IconFile(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M8 13h8M8 17h6" />
    </Svg>
  );
}

export function IconWarning(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12h14M12 5v14" />
    </Svg>
  );
}

/** Reconcile: the game's changes flowing into the open manifest. */
export function IconMerge(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 3v6a6 6 0 0 0 6 6h4" />
      <path d="m14 12 3 3-3 3" />
      <path d="M4 21h4" />
    </Svg>
  );
}

/** Reconcile: throw away my edits and take the file on disk. */
export function IconRevert(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 7v6h6" />
      <path d="M3.5 13a9 9 0 1 0 2.1-9.4L3 7" />
    </Svg>
  );
}

/** Reconcile: keep editing; my next save wins. */
export function IconPencil(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </Svg>
  );
}
