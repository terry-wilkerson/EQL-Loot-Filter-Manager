---
name: EQL Loot
description: A glass workbench for EverQuest Legends loot filters — quartermaster's logistics in Plex, under a lit indigo surface.
colors:
  manifest-indigo: "#6366f1"
  manifest-indigo-deep: "#4f46e5"
  ledger-green: "#10b981"
  ledger-green-deep: "#059669"
  struck-red: "#ef4444"
  struck-red-deep: "#dc2626"
  margin-amber: "#f59e0b"
  on-accent: "#ffffff"
  ink-slate: "#0f172a"
  scroll-gutter-dark: "#131b2f"
  scroll-gutter-light: "#e7eaf6"
  overlay-03: "rgba(255, 255, 255, 0.03)"
  overlay-10: "rgba(255, 255, 255, 0.1)"
  overlay-20: "rgba(255, 255, 255, 0.2)"
  overlay-30: "rgba(255, 255, 255, 0.3)"
  vellum-indigo: "#1e1b4b"
  shadow-slate: "#090d16"
  surface-slate: "#1e293b"
  raised-slate: "#334155"
  faded-slate: "#94a3b8"
  faded-slate-deep: "#64748b"
  slate-paper: "#f8fafc"
  wash-indigo: "#e0e7ff"
  wash-violet: "#f3e8ff"
  wash-slate: "#f1f5f9"
typography:
  display:
    fontFamily: "IBM Plex Sans, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "normal"
  headline:
    fontFamily: "IBM Plex Sans, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.5px"
  title:
    fontFamily: "IBM Plex Sans, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "IBM Plex Sans, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  caption:
    fontFamily: "IBM Plex Sans, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  micro:
    fontFamily: "IBM Plex Sans, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  label:
    fontFamily: "IBM Plex Sans, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  mono:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  2xl: "16px"
  3xl: "20px"
  4xl: "24px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.manifest-indigo}"
    textColor: "{colors.on-accent}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "10px 18px"
  button-success:
    backgroundColor: "{colors.ledger-green}"
    textColor: "{colors.on-accent}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "10px 18px"
  button-secondary:
    backgroundColor: "{colors.raised-slate}"
    textColor: "{colors.slate-paper}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "10px 18px"
  button-danger-soft:
    backgroundColor: "rgba(239, 68, 68, 0.15)"
    textColor: "{colors.struck-red}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  input-text:
    backgroundColor: "{colors.surface-slate}"
    textColor: "{colors.slate-paper}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  select-action:
    backgroundColor: "{colors.surface-slate}"
    textColor: "{colors.slate-paper}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  card-workspace:
    backgroundColor: "{colors.ink-slate}"
    textColor: "{colors.slate-paper}"
    rounded: "{rounded.4xl}"
    padding: "24px"
  card-header:
    backgroundColor: "{colors.ink-slate}"
    textColor: "{colors.slate-paper}"
    rounded: "{rounded.2xl}"
    padding: "16px 24px"
  banner-warning:
    backgroundColor: "rgba(245, 158, 11, 0.12)"
    textColor: "{colors.slate-paper}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
  toast:
    backgroundColor: "rgba(15, 23, 42, 0.92)"
    textColor: "{colors.slate-paper}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
---

# Design System: EQL Loot

## Overview

**Creative North Star: "The Quartermaster's Manifest"**

EQL Loot is a supply officer's ledger, not a dashboard. Its centre of gravity is
a dense sortable table where every row is an item id, a name, and one of four
decisive actions — loot it, store it, merge it, sell it. Everything else on
screen exists to get the quartermaster to that table faster and to keep the
manifest correct while the game rewrites it underneath. The glass, the gradient
and the blur are the room the ledger sits in; they are packaging, and packaging
never outranks the rows.

The material is a translucent indigo night. Surfaces are `rgba` slate at 65%
opacity over a three-stop gradient that runs deep navy → violet-black → near
black, with every card carrying a `backdrop-filter` blur. That atmosphere is
constant and unranked. The elevation *scale* on top of it is not: three shadow
weights separate the header, the workspace and the modal layer, and that
ordering is a hierarchy future work must respect. The material is atmospheric;
the elevation scale is structural. Both are true at once, and that tension is
the system's defining rule.

Controls are tactile and game-adjacent. Anything that commits an action wears a
saturated 135° gradient — indigo to add or save, green to create, red to
destroy. Anything that merely navigates stays a quiet translucent slate. Radii
are generous and scale with the surface they wrap, so the whole interface reads
soft-cornered rather than engineered. The emoji glyphs on toolbar buttons
(🔨 💾 🗑️ ⚡) are deliberate: this tool lives beside a fantasy MMO and is allowed
to sound like it. What it must never become is enterprise-dashboard grey.

**Key Characteristics:**

- Translucent slate surfaces at 65% opacity over an indigo→violet→black gradient
- A constant `backdrop-filter` blur (8–20px) as ambient material
- Three structural elevation steps: header, workspace, modal
- Saturated 135° gradients reserved strictly for committing actions
- Radii that scale with surface size (6px control → 24px workspace)
- Full dark/light parity; neither theme is the afterthought
- Emoji glyphs as functional iconography, not decoration
- A dark-grounded nib-and-check mark that never sits on a light or saturated fill

## Colors

Tailwind's slate spine carrying four saturated inks, each one bound to a single
meaning: indigo commits, green creates, red destroys, amber warns.

### Primary

- **Manifest Indigo** (#6366f1 → #4f46e5): The house colour. Appears as a 135°
  gradient on the primary action of any surface — Save Changes, Open Filter,
  Browse Folder, Review & Add to DB — as the checkmark in the app mark, and as
  the loading spinner's leading arc. Also the active state of the Tradeskill
  Only toggle. It is the only colour allowed to mean "this is the thing to
  press".

### Secondary

- **Ledger Green** (#10b981 → #059669): Reserved for *creation* specifically,
  not success in general — Add Item and Create New Filter File. A save
  confirmation is indigo; a new row is green. The distinction is intentional and
  worth preserving.

### Tertiary

- **Struck Red** (#ef4444 → #dc2626): Destruction, at two intensities. The full
  gradient carries bulk removal; a 15% wash of the same hue with red text
  carries the per-row Remove, so a table of two hundred rows never reads as two
  hundred alarms.
- **Margin Amber** (#f59e0b): Exactly one job — the unknown-items banner, as a
  12% fill inside a 40% border. Advisory, never blocking.

### Neutral

- **Ink Slate** (#0f172a): The dark theme's ground and the light theme's primary
  text. The system's darkest structural value.
- **Vellum Indigo** (#1e1b4b): The midpoint of the dark background gradient —
  the violet cast that keeps the app from reading as flat navy.
- **Shadow Slate** (#090d16): The dark gradient's terminal stop, darker than the
  ground so the corner falls away.
- **Surface Slate** (#1e293b at 80%): Input and table-header fills.
- **Raised Slate** (#334155 at 60%): Secondary button fills.
- **Faded Slate** (#94a3b8) / **Faded Slate Deep** (#64748b): Secondary text,
  dark and light theme respectively. Also the item-id column.
- **Slate Paper** (#f8fafc): Dark-theme primary text and every label on a
  saturated fill.
- **Wash Indigo / Wash Violet / Wash Slate** (#e0e7ff, #f3e8ff, #f1f5f9): The
  light theme's three-stop ground, mirroring the dark gradient's hue path.
- **On Accent** (#ffffff): The label colour on any saturated fill. Pure white
  rather than Slate Paper — on a gradient the two are indistinguishable, and one
  token beats two near-identical whites drifting apart.
- **Scroll Gutter** (#131b2f dark / #e7eaf6 light): The 4px inset ring that
  gives the scrollbar thumb its track. Chrome, not surface.

### Neutral Overlays

Chrome that is not content does not take a palette colour. Row hover, hairline
borders and scrollbar thumbs are alpha overlays — white over dark glass, black
over light — at four steps: **0.03** (row hover), **0.10** (hairlines, search
row hover), **0.20** (scrollbar thumb), **0.30** (thumb hover). The frontmatter
records the dark-mode value; `overlay()` in `theme.ts` inverts it for light.

### Named Rules

**The Neutral Overlay Rule.** Chrome tints are alpha overlays, never palette
colours. Reach for `overlay(isDarkMode, alpha)` and one of the four steps rather
than introducing a slate that only works in one theme.


**The One Meaning Rule.** Each saturated ink carries exactly one verb: indigo
commits, green creates, red destroys, amber warns. A new feature does not get to
borrow green because it looks friendly. If a new verb appears, it earns a new
ink or it reuses the one whose meaning it actually shares.

**The Two-Intensity Rule.** A destructive action at row scale uses the 15% wash
(`rgba(239, 68, 68, 0.15)` fill, `#ef4444` text). Only an action that destroys
*many* rows at once earns the full gradient. Repetition of a full-strength
danger colour down a table is a defect, not emphasis.

## Typography

**Display / Body Font:** IBM Plex Sans (falling back to `system-ui`,
`-apple-system`, `Segoe UI`, `sans-serif`)
**Mono Font:** IBM Plex Mono — item ids and the missing-icon badge only

**Character:** Engineered rather than neutral. Plex was drawn for a technology
company's documentation and interfaces, and it reads as *equipment*: squared
terminals, a flat-topped `a`, a distinctive `g`, generous apertures that hold up
at 13px down a long column. It suits a quartermaster's manifest in a way a
default UI grotesque does not — present enough to have a voice, disciplined
enough to disappear behind two hundred item names.

The mono is the same superfamily, which is the point: the second family is a
*role*, not a second voice. An item id is a machine value the eye scans for
digits, and Plex Mono's unmistakable `0`, `1` and `l` matter when a user is
checking an id against a wiki mid-session.

Both faces ship with the app: `public/fonts/plex-sans-variable-latin.woff2`
(variable, 100–700, 45KB) and `public/fonts/plex-mono-400-latin.woff2` (14KB).
Only the latin subset and the weights actually used are shipped. Both are
declared via `@font-face` in `theme.ts` *and* in the static block in
`index.html`, so the request starts before the JS bundle parses. Never a CDN —
the app has no network dependency and must not acquire one. The
`@fontsource-variable/ibm-plex-sans` and `@fontsource/ibm-plex-mono` packages
are devDependencies kept only as the provenance of those two files.

### Hierarchy

- **Display** (700, 22px, 1.3): Section headings inside a workspace card —
  "EverQuest UI Directory". The largest type in the product.
- **Headline** (700, 20px, 1.2, −0.5px): The app title in the header bar. The
  only place negative tracking is used.
- **Title** (700, 16px, 1.4): Sub-headings, modal titles, and table column
  headers.
- **Body** (400, 16px, 1.5): Default text. Item names lift to 600 because the
  name is the row's identity and must win against the id beside it.
- **Label** (600, 14px, 1.2): Every button, select and input. Interactive text is
  always heavier than the prose around it.
- **Caption** (400, 13px, 1.4): Advisory text that sits beside the work — the
  unknown-items banner, the bulk-add explainer.
- **Micro** (400, 12px, 1.4): Metadata lines that name state without competing
  with it — "Editing: LF_Terrilyn_Vox.ini", inline hints.
- **Mono** (400, 13px): Item ids, prefixed `#`, in Faded Slate. Never used for
  anything a human reads as language.

One size sits off this ramp on purpose: **11px** is the glyph-only step, used
for the sort indicator (▲ ▼ ↕) and the missing-icon fallback badge. It is never
used for text a user reads as a sentence.

### Named Rules

**The Inherit Rule.** Form controls must declare `font: inherit` and an explicit
`font-size: 14px`. Without the first the webview serves Arial at 13.33px inside
a 16px interface; without the second they inherit body's 16px and read oversized
in a 1400×600 window. Both live in `buildGlobalStyles`.

**The Tabular Figures Rule.** Anything that puts numbers in a column — the item
table, the search results — sets `font-variant-numeric: tabular-nums`. Digits
that change width as rows scroll are a defect, not a detail.

**The Dark-Bloom Rule.** Light type on dark glass blooms and closes its
counters, so dark mode carries `letter-spacing: 0.012em` at the document root
and light mode carries none. Compensation belongs to the theme, not to
individual components.

**The Weight-Not-Family Rule.** Hierarchy is built from weight and size within a
single family. Do not introduce a second display face, a serif, or a condensed
cut to signal importance.

## Layout

A fixed-height application shell, never a scrolling page. The root is
`height: 100vh` with `overflow: hidden` on `html`, `body` and `#root`; only the
table body and the file list scroll, inside their own rounded containers. This
is deliberate — the window sits beside a running game and must never grow a
window-level scrollbar.

The shell is a 24px-padded column: a header bar, 24px of air, then a single
workspace card that takes the remaining height. The Dashboard state centres a
800px-max card instead; the editing state lets the workspace card run full
width. Default window is 1400×600, and the toolbar is `flex-wrap`, so the
control row reflows to two lines rather than clipping when the user drags the
window narrow. Small-window survivability is a product constraint, not a nicety.

Spacing runs on an 8px-ish rhythm — 8 / 12 / 16 / 24 / 32 / 40 for gaps and
container padding — but control padding is currently hand-tuned in 2px steps
(6/12, 8/12, 8/14, 10/14, 10/16, 10/18, 12/16, 12/20, 14/20). Treat the coarse
scale as normative and the fine variance as drift to converge, not a pattern to
extend.

### Named Rules

**The No Outer Scrollbar Rule.** The application shell never scrolls. New
full-height regions get their own `overflow-y: auto` container with a radius and
a border; they do not extend the page.

## Elevation & Depth

This system is both atmospheric and structural, and separating the two is the
whole discipline. Every card carries a `backdrop-filter` blur over a
semi-transparent fill — that is ambient material, applied uniformly, and carries
no meaning. On top of it sit exactly three shadow weights, and those *do* rank:
the header floats least, the workspace sits above it, and modals and the loading
overlay sit above everything behind a dimmed, blurred scrim. Depth is how the
user knows what is currently in charge.

### Shadow Vocabulary

- **Ambient header** (`box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2)`): The header
  bar. Lightest step; present so the bar detaches from the gradient.
- **Workspace** (`box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25)`): The main content
  card and the Dashboard card. The working surface.
- **Overlay** (`box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4)`): Modal cards and the
  loading panel, always paired with the `rgba(0, 0, 0, 0.6)` + `blur(8px)` scrim.

Blur strengths track the same order: 8px on the modal scrim, 12px on toasts,
16px on the header, 20px on workspace and loading cards.

### Named Rules

**The Three Steps Rule.** There are three elevation steps and no fourth. A new
surface picks the step matching its role — chrome, work, or interruption — and
inherits that exact shadow value. Inventing an intermediate weight flattens the
ranking for everything else.

**The Glass-Needs-Ground Rule.** Every translucent surface sits on the app
gradient, never on another translucent surface. Stacked glass turns the blur to
mud and the border contrast to nothing.

## Shapes

Soft-cornered throughout, with radius scaled to surface size rather than fixed
per component type: 6px on a row-level Remove button, 8px on inputs and selects,
10px on toolbar buttons and the logo tile, 12px on toasts, banners and file
rows, 16px on the header bar and the table container, 20px on modal and loading
cards, 24px on the main workspace card. The effect is that the eye reads scale
from the corner before it reads it from the box.

Borders are a single hairline, and in dark mode they are *light*:
`1px solid rgba(255, 255, 255, 0.1)` against dark glass, inverting to
`rgba(255, 255, 255, 0.8)` in light mode. The border is a highlight catching the
top of the glass, not an outline containing a box. Gradient fills carry no
border at all — the saturation is the edge.

### Named Rules

**The Radius-Tracks-Size Rule.** Pick a radius from the surface's footprint, not
its component name. A 40px-tall control takes 8–10px; a full-height card takes
24px. Two nested surfaces never share a radius.

## Components

### Buttons

- **Shape:** Softly rounded, 10px on toolbar scale, 6px at row scale. No border
  on gradient fills; hairline border on translucent fills.
- **Primary:** Manifest Indigo 135° gradient, white 600-weight label,
  `10px 18px`. One per surface.
- **Create:** Ledger Green 135° gradient, same geometry. Only for actions that
  bring a new row or file into existence.
- **Secondary:** Raised Slate at 60% with the theme's hairline border and primary
  text colour. Carries Save As…, Switch File, theme toggle, and the inactive
  Tradeskill Only state.
- **Destructive:** Full Struck Red gradient for bulk operations; the 15% wash
  with red text and 6px radius for per-row Remove. Clear Entire List is the odd
  one — a secondary fill with red text, because it is destructive but not
  immediate.
- **Hover:** `filter: brightness(1.08)` over 0.15s; `0.94` on `:active`. Filter
  rather than a background swap, so one rule serves gradient and translucent
  fills alike and nothing shifts position in a dense table.
- **Focus:** A 2px Manifest Indigo ring at `outline-offset: 2px`. The offset is
  the point — the ring lands on the card behind the control, so it never sits
  indigo-on-indigo against a primary button.
- **Disabled:** 45% opacity and `cursor: not-allowed`, applied globally to
  buttons, selects and inputs.

### Cards / Containers

- **Corner Style:** 24px workspace, 20px modal, 16px header and table container.
- **Background:** `rgba(15, 23, 42, 0.65)` dark, `rgba(255, 255, 255, 0.65)`
  light, always with `backdrop-filter: blur(16–20px)`.
- **Shadow Strategy:** One of the three steps in Elevation & Depth. Never a
  custom value.
- **Border:** The inverted hairline described in Shapes.
- **Internal Padding:** 24px workspace, 24px modal, `16px 24px` header.

### Inputs / Fields

- **Style:** Surface Slate fill at 80%, theme hairline border, 8–10px radius,
  `10px 16px` padding, primary text colour. `box-sizing: border-box` so a
  full-width field never overflows its card.
- **Focus:** The shared 2px Manifest Indigo ring, offset 2px.
- **Read-only:** A dashed hairline in Faded Slate over a transparent fill, with
  `cursor: default`. A read-only field must never wear the same solid fill as an
  editable one — the Dashboard's directory display is the reference.

### Table

The signature component. A sticky header row on Surface Slate; hairline row
separators; 12–14px vertical padding by 20px horizontal. Columns run Icon (60px)
· Item ID (mono, Faded Slate) · Item Name (600 weight) · Action (a select) ·
Remove (right-aligned). Sortable headers show ▲/▼ when active and a 35%-opacity
↕ when not — a good, quiet affordance worth keeping.

Rows tint on hover with the 0.03 neutral overlay over 0.2s — row tracking that
matters once a filter runs to hundreds of items.

### Toasts

Bottom-right stack, 360px max, 12px radius, near-opaque Ink Slate at 92% with a
12px blur and a **4px left border** carrying the kind accent — Ledger Green for
success, Struck Red for error, Manifest Indigo for info. Auto-dismiss at 4s,
click to dismiss early. The left-border-as-status-stripe is a signature move and
should be reused rather than replaced by icons.

The toast stack renders outside the app's root `<div>`, which is why the type
stack is declared on `html, body, #root` rather than on that div. Anything
mounted as a sibling of the app inherits the interface font by construction.

### Item Icon

A 40px sprite-sheet cell — `icon_id` resolved to a column-major offset within a
36-icon sheet — inside a 6px-radius tile with a hairline border and a soft drop
shadow. Missing artwork falls back to a red-tinted tile showing `?{id}?`. Per
PRODUCT.md the game's own icon art is an identity commitment: never substitute
generic iconography for these.

### App Mark

A fountain-pen nib in Slate Paper with a single Manifest Indigo checkmark
sweeping out from its tip — *recorded, and decided*. It is the north star
compressed into two shapes: the nib is the manifest, the check is the loot
action. No lettering, no enclosure beyond the tile it sits in.

- **Ground:** a soft radial from Vellum Indigo at the centre out to Ink Slate,
  the same hue path as the app's own dark background. The mark is always
  dark-grounded, in both themes and on every OS surface.
- **Ink:** the check carries the 135° Manifest Indigo gradient
  (`#6366f1` → `#4f46e5`) — the identical gradient every committing control
  wears, so the mark is built from the system rather than merely matching it.
- **Fill:** the artwork occupies 80% of its square with even padding. Below
  that it reads as a small thing lost in a dark tile at 32px.
- **In the header:** rendered at 36px with a 10px radius and the theme hairline
  border, decorative (`alt=""`) because the product name sits beside it.
- **Sources:** `brand/icon-source-2048.png` is the master that
  `npx tauri icon` consumes; `brand/icon-mark-transparent-2048.png` is the knocked-out
  variant for light surfaces; `src/assets/mark-144.png` is what the header imports.
  `tools/build-icon.py` regenerates all three from the original artwork.

**The Dark-Ground Rule.** The mark never sits directly on a light surface or on
a saturated fill. Its indigo check would vanish against the indigo button
gradient, and its paper nib would vanish against the light theme's wash. It
brings its own ground everywhere it appears.

## Do's and Don'ts

### Do:

- **Do** reserve saturated gradients for actions that commit something. Indigo
  commits, Ledger Green creates, Struck Red destroys, Margin Amber warns.
- **Do** pick a shadow from the three named steps and inherit its exact value.
- **Do** scale the corner radius to the surface footprint (6px control → 24px
  workspace card), and never give nested surfaces the same radius.
- **Do** keep every new surface translucent over the app gradient, with a
  `backdrop-filter` blur and the inverted hairline border.
- **Do** ship dark and light together. Every value in this file has a light-mode
  counterpart in `buildGlassTheme`; a one-theme feature is an unfinished feature.
- **Do** put anything inline styles cannot express — `@font-face`, the type
  reset, `:focus-visible`, `:hover`, `:disabled`, scrollbars — in
  `buildGlobalStyles`. It is theme-aware; a static stylesheet is not.
- **Do** keep `button, input, select, textarea { font: inherit; font-size: 14px; }`
  in place. It is the only thing stopping the webview serving Arial at 13.33px.
- **Do** give every new control the shared focus ring by using a real `<button>`,
  `<input>` or `<select>`. The global rule covers them; a clickable `<div>` gets
  nothing.
- **Do** treat emoji glyphs as part of the voice — 🔨 for tradeskill, 💾 for save,
  ⚡ for bulk. They are load-bearing, not filler.

### Don't:

- **Don't** drift toward enterprise-dashboard grey: flat corporate chrome,
  hairline-boxed panels, and no atmosphere. The glass and the colour are the
  point of this product's surface.
- **Don't** stack a translucent surface on another translucent surface.
- **Don't** invent a fourth elevation weight or a one-off `box-shadow`.
- **Don't** repeat a full-strength danger gradient down a table; that is what the
  15% wash exists for.
- **Don't** introduce a second type family, a serif, or a condensed cut. Weight
  and size carry the hierarchy.
- **Don't** load fonts, icons, or styles from a CDN. The app ships everything it
  renders.
- **Don't** let the application shell scroll. New full-height regions scroll
  inside their own bordered container.
- **Don't** add a colour whose meaning duplicates one already in the palette.
- **Don't** place the app mark on a light or saturated ground, and don't
  recolour it — it carries the palette already.
