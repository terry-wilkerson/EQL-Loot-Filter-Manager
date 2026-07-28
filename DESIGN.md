---
name: EQL Loot
description: A quartermaster's stock book — opaque paper ruled with hairlines, stamped ink accents, and a manifest you can scan by colour.
colors:
  paper-ground: "#efece3"
  paper-card: "#fffdf8"
  paper-field: "#faf7ef"
  paper-head: "#f0ebdf"
  paper-raised: "#e8e2d5"
  paper-rule: "#ddd6c7"
  night-ground: "#14130f"
  night-card: "#1c1b17"
  night-field: "#232019"
  night-raised: "#2b2822"
  night-rule: "#35322a"
  ink-primary: "#1c1917"
  ink-secondary: "#57534e"
  ink-primary-night: "#f5f0e6"
  ink-secondary-night: "#a8a29e"
  stamp-blue: "#1d4ed8"
  stamp-blue-night: "#60a5fa"
  stamp-green: "#15803d"
  stamp-red: "#b91c1c"
  stamp-amber: "#a16207"
  stamp-amber-night: "#fbbf24"
  action-store: "#10b981"
  action-loot: "#6366f1"
  action-merge: "#f59e0b"
  action-sell: "#ef4444"
typography:
  display:
    fontFamily: "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "normal"
  headline:
    fontFamily: "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.5px"
  title:
    fontFamily: "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  caption:
    fontFamily: "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  mono:
    fontFamily: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  control: "2px"
  field: "2px"
  action: "3px"
  chip: "3px"
  panel: "4px"
  modal: "6px"
  workspace: "6px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.stamp-blue}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.action}"
    padding: "10px 18px"
  button-create:
    backgroundColor: "{colors.stamp-green}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.action}"
    padding: "10px 18px"
  button-destroy:
    backgroundColor: "{colors.stamp-red}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.action}"
    padding: "10px 18px"
  button-secondary:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.action}"
    padding: "10px 18px"
  button-remove-row:
    backgroundColor: "rgba(185, 28, 28, 0.1)"
    textColor: "{colors.stamp-red}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
  input-text:
    backgroundColor: "{colors.paper-field}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.field}"
    padding: "10px 16px"
  select-action:
    backgroundColor: "rgba(16, 185, 129, 0.12)"
    textColor: "#047857"
    typography: "{typography.label}"
    rounded: "{rounded.field}"
    padding: "8px 12px"
  card-workspace:
    backgroundColor: "{colors.paper-card}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.workspace}"
    padding: "24px"
  card-header:
    backgroundColor: "{colors.paper-card}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.panel}"
    padding: "16px 24px"
  table-head:
    backgroundColor: "{colors.paper-head}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.title}"
    rounded: "0px"
    padding: "14px 20px"
  banner-warning:
    backgroundColor: "rgba(161, 98, 7, 0.1)"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.chip}"
    padding: "12px 16px"
  toast:
    backgroundColor: "{colors.ink-primary}"
    textColor: "{colors.ink-primary-night}"
    rounded: "{rounded.chip}"
    padding: "12px 16px"
---

# Design System: EQL Loot

## Overview

**Creative North Star: "The Quartermaster's Stock Book"**

EQL Loot is a supply officer's ledger, and now it looks like one. The centre of
gravity is a dense sortable table where every row is an item id, a name, and one
of four decisive actions — loot it, store it, merge it, sell it. Everything else
on screen exists to get the quartermaster to that table faster and to keep the
manifest correct while the game rewrites it underneath.

The material is **paper, not glass**. Surfaces are opaque: warm cream stock by
day, ink-dark board by night. Nothing is translucent, nothing is blurred, and
almost nothing is lifted. Ranking is carried by **rule weight and fill**, the way
a printed form ranks — a heading band is a different tint of the same paper, not
a card floating above it. Corners are 2–4px: present enough that the eye reads a
made object rather than a raw box, small enough that no surface reads as soft.

Accents are **stamped**, not lit. A committing control is one flat saturated
fill — a rubber stamp pressed onto the page — with no gradient, no glow and no
shadow. Three stamps exist and each carries a single verb: blue commits, green
creates, red destroys. Amber annotates but never fills a control.

The one place colour is allowed to spread across the page is the **action
channel**: each row's loot action wears a tinted wash so a two-hundred-row
manifest can be scanned by colour instead of read line by line. That channel is
data, not chrome — it means the same thing in every skin, for the same reason the
game's own item art does.

**Key Characteristics:**

- Opaque paper surfaces; no translucency and no `backdrop-filter` anywhere
- Hairline rules as the primary ranking device; one real shadow, on the modal layer
- 2–4px corners across the whole product
- Flat stamped accents — no gradients on any control
- Zebra-banded table rows for horizontal tracking across five columns
- A four-hue action channel that survives a change of skin
- Full day/night parity; neither light level is the afterthought

## The skin system

Ledger is the committed world and what a cold install wears. Three alternates
ship alongside it and are selectable from the header: **Glass** (the previous
translucent indigo world, kept as a reference), **Console** (a cold near-black
instrument readout), and **Solid** (an opaque contemporary desktop app). The
choice persists to `settings.json` beside the light level.

The rules below describe **Ledger**. The *contract* they sit on — role-named
radii, three elevation steps, one action channel, day/night parity — is shared by
all four, and any new skin must satisfy it. Everything visual resolves through
`buildTheme(skin, isDark)` in `src/theme.ts`; a component that hardcodes a
colour, a radius or a shadow has broken the system, because it will be wrong in
three of the four worlds.

## Colors

Warm neutral stock carrying three stamped inks. The paper is warm on purpose — a
true grey ground would read as an enterprise dashboard, which is the thing this
world exists to not be.

### Primary

- **Stamp Blue** (#1d4ed8): The house mark. The flat fill on the primary action
  of any surface — Save Changes, Open Filter, Browse Folder, Review & Add to DB —
  the "EQ" logo tile, and the active Tradeskill Only state. The only colour
  allowed to mean "this is the thing to press". Its lighter step (#60a5fa) is
  used as ink, never as a fill: focus rings and the loading spinner's leading arc
  at night.

### Secondary

- **Stamp Green** (#15803d): Reserved for *creation* specifically, not success in
  general — Add Item and Create New Filter File. A save confirmation is blue; a
  new row is green. The distinction is intentional.

### Tertiary

- **Stamp Red** (#b91c1c): Destruction, at two intensities. The flat fill carries
  bulk removal; a 10% wash of the same hue with red text carries the per-row
  Remove, so a table of two hundred rows never reads as two hundred alarms.
- **Stamp Amber** (#a16207 day / #fbbf24 night): Annotation only. The
  unknown-items banner and the reconcile conflict count. It never fills a
  control.

### Neutral

- **Paper Ground** (#efece3) / **Night Ground** (#14130f): The window behind
  everything.
- **Paper Card** (#fffdf8) / **Night Card** (#1c1b17): Header, workspace,
  dashboard, modal. The sheet you work on.
- **Paper Field** (#faf7ef) / **Night Field** (#232019): Inputs and selects, and
  at night the table's heading band too.
- **Paper Head** (#f0ebdf): The table's sticky heading band by day — a tint of
  the paper, not a floating bar.
- **Paper Raised** (#e8e2d5) / **Night Raised** (#2b2822): Secondary buttons.
- **Paper Rule** (#ddd6c7) / **Night Rule** (#35322a): Every hairline in the
  product — card borders, row separators, the icon tile edge.
- **Ink** (#1c1917 / #57534e by day, #f5f0e6 / #a8a29e by night): Primary and
  secondary text.

### The action channel

Four hues, one per loot action, fixed across every skin:

| Action | Hue | Reasoning |
|---|---|---|
| Always Store | #10b981 green | it enters your holdings |
| Always Loot | #6366f1 indigo | you take it |
| Always Merge | #f59e0b amber | it folds into an existing stack |
| Always Sell | #ef4444 red | it leaves your inventory |

Sell drawing the loudest ink is intentional: it is the misfiling you would most
regret. Each is rendered as a ~12–16% wash with a hairline of the same hue and a
theme-stepped text ink (#047857 / #4338ca / #b45309 / #b91c1c by day, lightened
by night) so 14px labels clear 4.5:1 on both grounds.

### Named Rules

**The One Verb Rule.** Each stamp carries exactly one verb: blue commits, green
creates, red destroys, amber annotates. A new feature does not get to borrow
green because it looks friendly. If a new verb appears, it earns a new stamp or
it reuses the one whose meaning it actually shares.

**The Two-Intensity Rule.** A destructive action at row scale uses the 10% wash
with red text. Only an action that destroys *many* rows at once earns the flat
fill. Repetition of a full-strength danger colour down a table is a defect, not
emphasis.

**The Channel Separation Rule.** Chrome and data never share an intensity. A
control that commits wears a full-strength flat fill; the action channel never
rises above a wash with a hairline. This is what lets the action hues overlap the
stamp hues without either being mistaken for the other.

**The Warm Neutral Rule.** The greys are warm (stone, not slate) in both light
levels. A neutral-grey ground turns this world into a generic admin panel, which
is the specific failure this design replaced.

## Typography

**Display / Body Font:** IBM Plex Sans, self-hosted (variable, 100–700)
**Mono Font:** IBM Plex Mono 400, self-hosted — item ids only

Both faces live in `public/fonts/`, copied out of the `@fontsource`
devDependencies and declared with `@font-face` twice on purpose: in `theme.ts`
for the app, and in `index.html` so the request starts before the JS bundle
parses. **Never a CDN** — the app has no network dependency and must not acquire
one.

**Character:** Plex is the right face for a stock book: a working grotesque with
a technical, slightly institutional fit and a mono cut from the same superfamily,
so the second family is a role rather than a second voice. Hierarchy is built
from weight and size within it. Item ids are a machine value the eye scans for
digits, not a word it reads, so they get the mono cut and tabular figures.

### Hierarchy

- **Display** (700, 22px, 1.3): Section headings inside a workspace card —
  "EverQuest UI Directory". The largest type in the product.
- **Headline** (700, 20px, 1.2, −0.5px): The app title in the header bar. The
  only place negative tracking is used.
- **Title** (700, 16px, 1.4): Sub-headings, modal titles, table column headers.
- **Body** (400, 16px, 1.5): Default text. Item names lift to 600 because the
  name is the row's identity and must win against the id beside it.
- **Label** (600, 14px, 1.2): Every button, select and input. Interactive text is
  always heavier than the prose around it.
- **Caption** (400, 13px): The banner line, the "Editing: …" file name, the
  spinner message.
- **Mono** (400, 13px): Item ids, prefixed `#`, in secondary ink.

### Named Rules

**The Inherit Rule.** Form controls declare `font: inherit` plus an explicit
14px. Without it the webview serves Arial at 13.33px inside an interface set in
Plex, and the mismatch is visible on every button.

**The Tabular Figures Rule.** Anything the eye compares down a column — item ids,
counts — sets `font-variant-numeric: tabular-nums`. Without it the digits jitter
as rows scroll.

**The Weight-Not-Family Rule.** Hierarchy is built from weight and size within
Plex. Do not introduce a third family, a serif, or a condensed cut to signal
importance.

**The Night Tracking Rule.** Light text on a dark ground blooms and closes
counters, so the night level adds `letter-spacing: 0.012em` at the document
level. The day level needs none.

## Layout

A fixed-height application shell, never a scrolling page. The root is
`height: 100vh` with `overflow: hidden` on `html`, `body` and `#root`; only the
table body and the file list scroll, inside their own bordered containers. This
is deliberate — the window sits beside a running game and must never grow a
window-level scrollbar.

The shell is a 24px-padded column: a header bar, 24px of air, then a single
workspace card that takes the remaining height. The Dashboard state centres an
800px-max card instead; the editing state lets the workspace card run full width.
Default window is 1400×600, and the toolbar is `flex-wrap`, so the control row
reflows to two lines rather than clipping when the user drags the window narrow.
Small-window survivability is a product constraint, not a nicety.

Spacing runs on an 8px-ish rhythm — 8 / 12 / 16 / 24 / 32 / 40 for gaps and
container padding. Control padding is currently hand-tuned in 2px steps
(6/12, 8/12, 8/14, 10/14, 10/16, 10/18, 12/16, 12/20, 14/20). Treat the coarse
scale as normative and the fine variance as drift to converge, not a pattern to
extend.

### Named Rules

**The No Outer Scrollbar Rule.** The application shell never scrolls. New
full-height regions get their own `overflow-y: auto` container with a border;
they do not extend the page.

## Elevation & Depth

Ledger ranks by **rule weight and fill**, not by lift. The contract still names
three elevation steps and no fourth, but Ledger spends only the third:

- **Chrome** (`none`): The header bar. It is separated from the ground by its
  paper tint and its hairline, the way a printed form's heading band is.
- **Work** (`none`): The workspace card and the Dashboard card. Same reasoning.
- **Overlay** (`0 24px 48px rgba(0, 0, 0, 0.45)`): Modal cards and the loading
  panel, paired with a plain unblurred scrim. This is the one place physical
  separation is the whole point, so it gets a real shadow with a real offset.

There is no `backdrop-filter` anywhere in this skin.

### Named Rules

**The Three Steps Rule.** There are three elevation steps and no fourth. A new
surface picks the step matching its role — chrome, work, or interruption — and
inherits that exact token. A skin may render a step as `none`; it may not add a
fourth.

**The No Halo Rule.** A shadow carries an offset and a soft blur, or it does not
exist. A zero-offset coloured glow is decoration and has no place here.

## Shapes

Square-ish throughout, with radius scaled to the surface's role rather than fixed
per component type: 2px on row-level controls and fields, 3px on toolbar buttons
and chips, 4px on the header and table container, 6px on modals and the
workspace card. The steps sit close together on purpose — the eye should read
"made object" and then stop thinking about the corners.

Borders are a single hairline in the paper rule colour, identical in both light
levels rather than inverted. The border is the ruling on a form, not a highlight
catching the edge of glass. Stamped fills carry no border at all — the saturation
is the edge.

### Named Rules

**The Radius-Tracks-Role Rule.** Pick a radius from the role token
(`control` / `field` / `action` / `chip` / `panel` / `modal` / `workspace`), not
from a pixel value and not from the component's name. Two nested surfaces never
share a step.

## Components

### Buttons

- **Shape:** 3px at toolbar scale, 2px at row scale. No border on stamped fills;
  hairline border on paper fills.
- **Primary:** Stamp Blue flat fill, white 600-weight label, `10px 18px`. One per
  surface.
- **Create:** Stamp Green flat fill, same geometry. Only for actions that bring a
  new row or file into existence.
- **Secondary:** Paper Raised with the hairline border and primary ink. Carries
  Save As…, Switch File, the light toggle, the skin picker, and the inactive
  Tradeskill Only state.
- **Destructive:** Stamp Red flat fill for bulk operations; the 10% wash with red
  text and a 2px radius for per-row Remove. Clear Entire List is the odd one — a
  secondary fill with red ink, because it is destructive but not immediate.
- **Hover:** `filter: brightness()` — 1.06 by day, 1.12 by night, since a
  brightness lift reads weaker on a dark ground. Active drops to 0.94.
- **Focus:** A 2px Stamp Blue `:focus-visible` ring at `outline-offset: 2px`, so
  on a stamped fill it lands on the paper behind rather than on the colour it is
  marking.

### Cards / Containers

- **Corner Style:** 6px workspace and modal, 4px header and table container.
- **Background:** Opaque Paper Card / Night Card. Never translucent.
- **Shadow Strategy:** One of the three named steps. Never a custom value.
- **Border:** The paper rule hairline.
- **Internal Padding:** 24px workspace, 24px modal, `16px 24px` header.

### Inputs / Fields

- **Style:** Paper Field fill, hairline border, 2px radius, `10px 14–16px`
  padding, primary ink. `box-sizing: border-box` so a full-width field never
  overflows its card.
- **Read-only:** The directory field on the Dashboard uses a transparent fill and
  a *dashed* rule, so it reads as a display of the current selection rather than
  a field to type into.

### Table

The signature component. A sticky heading band on Paper Head; hairline row
separators; 12–14px vertical by 20px horizontal padding. Columns run Icon (60px)
· Item ID (mono, secondary ink) · Item Name (600 weight) · Action · Remove
(right-aligned). Sortable headers show ▲/▼ when active and a 35%-opacity ↕ when
not.

Two devices differentiate rows, and they do different jobs:

- **Zebra banding** (`tableRowStripe`, a ~2.5% neutral overlay on even rows)
  solves *horizontal tracking* — carrying a line across five columns without
  slipping.
- **The action wash** on the select solves *meaning* — which of four things this
  row does.

Row hover (`tableRowHover`) is declared after the band at equal specificity, so a
pointed-at row still reads on a banded row. The label always names the action;
the hue is a second channel, never the only one.

### Toasts

Bottom-right stack, 360px max, 3px radius, near-black ink ground with the paper
ink as text, and a **4px left border** carrying the kind accent — green success,
red error, blue info. Auto-dismiss at 4s, click to dismiss early. The stack
renders above `<App/>` in the React tree and so cannot read the theme by prop; it
reads the `--toast-*` and `--ink-*` custom properties `buildGlobalStyles`
publishes on `:root`. That bridge is the pattern for any future surface outside
the app root.

### Interface Icons

Inline SVG on a 24-unit box, 1.5 stroke, round caps and joins, no fill, rendered
at 16px beside the 14px Label step. Every icon strokes in `currentColor`, so it
inherits the exact ink of the control it sits in and is automatically right in
both light levels and all four skins. The stroke weight sits just under the
600-weight label beside it, so an icon reads as punctuation rather than as a
second voice.

Icons are decorative and marked `aria-hidden`: each one sits beside a text label
that already names the action, and announcing both would only stutter. A control
whose icon is its only label does not exist in this product.

The set lives in `src/components/Icon.tsx`. Adding one means adding it there, in
the house geometry — never an icon font, never a package, never an `<img>`.

**Emoji are not iconography here.** They were the previous world's chrome glyphs
and are gone: a full-colour bitmap drawn from the platform's own palette cannot
follow a skin or a light level, renders as a glossy sticker against warm paper,
and is a different picture on every OS. Where markup is impossible — an
`<option>` label, an input placeholder — the glyph is dropped rather than kept as
the last emoji in the product.

### Item Icon

A 40px sprite-sheet cell — `icon_id` resolved to a column-major offset within a
36-icon sheet — inside a 2px-radius tile with the paper rule hairline and no
shadow. Missing artwork falls back to a red-washed tile showing `?{id}?`. Like
the toast stack, `EQIcon` reads `--icon-tile-*` custom properties rather than
taking the theme as a prop, because it renders once per row across hundreds of
rows in three different surfaces.

Per PRODUCT.md the game's own icon art is an identity commitment: never
substitute generic iconography for these, and never let a skin restyle them
beyond their tile.

## Do's and Don'ts

### Do:

- **Do** read every colour, radius, shadow and blur from the theme object. A
  literal in a component is wrong in three of the four skins.
- **Do** reserve stamped fills for actions that commit something. Blue commits,
  green creates, red destroys, amber annotates.
- **Do** pick a radius from its role token and an elevation from one of the three
  named steps.
- **Do** keep surfaces opaque in this skin. Paper does not transmit light.
- **Do** ship day and night together. Every token in `theme.ts` has both; a
  one-level feature is an unfinished feature.
- **Do** encode meaning twice. The action hue is always accompanied by its label.
- **Do** keep the action channel identical across skins — it is data, not chrome.
- **Do** give any surface that renders outside `<App/>` a `:root` custom property
  bridge rather than threading the theme through props.
- **Do** add new interface icons to `src/components/Icon.tsx` in the house
  geometry — 24-unit box, 1.5 stroke, `currentColor`, `aria-hidden`.

### Don't:

- **Don't** reintroduce translucency, `backdrop-filter`, or a gradient into this
  skin. Those belong to Glass, which still ships and is one dropdown away.
- **Don't** drift toward neutral-grey enterprise chrome. The warmth of the stock
  is what keeps this a stock book rather than an admin panel.
- **Don't** invent a fourth elevation weight or a one-off `box-shadow`.
- **Don't** repeat a full-strength danger fill down a table; that is what the 10%
  wash exists for.
- **Don't** introduce a third type family, a serif, or a condensed cut.
- **Don't** load fonts, icons, or styles from a CDN. The app ships everything it
  renders.
- **Don't** let the application shell scroll. New full-height regions scroll
  inside their own bordered container.
- **Don't** use an emoji as an interface glyph. It cannot follow a skin or a
  light level, and every platform draws a different picture for it.
- **Don't** add a colour whose meaning duplicates one already in the palette.
