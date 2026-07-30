# EQL Loot — logo & artwork prompts

Written against `DESIGN.md` (north star **"The Quartermaster's Manifest"**) and
`PRODUCT.md`. Tuned for **ChatGPT / DALL·E / GPT-image** and **Gemini** — both
take descriptive prose and both respect named hex values reasonably well.

Two tiers, because they have different jobs:

- **Tier A — the mark.** Goes in `src-tauri/icons/`, the Windows taskbar, and the
  36px tile in the app header. It has to survive being 32 pixels wide.
- **Tier B — the scene.** Your quartermaster idea, at full size: README header,
  GitHub social card, release art, a future splash screen.

---

## The palette, for any prompt

Paste these into whichever prompt you're running. Both models handle hex codes
better when you also name the colour in words.

| Role | Hex | Say it as |
|---|---|---|
| Primary accent | `#6366f1` → `#4f46e5` | deep indigo, violet-leaning |
| Creation | `#10b981` | emerald green |
| Destruction | `#ef4444` | signal red |
| Advisory / lamplight | `#f59e0b` | warm amber |
| Ground (dark) | `#0f172a` | near-black navy |
| Mid-ground | `#1e1b4b` | violet-black |
| Paper / highlight | `#f8fafc` | cold off-white |

Tone words that come straight from the design doc: **engineered, institutional,
logistics, ledger, equipment, supply officer**. It is a *quartermaster's* tool,
not a hero's. The design system's one hard prohibition is drifting into flat
corporate grey — the indigo and the material are the point.

---

# Tier A — the app mark

## Constraints to keep in every Tier A prompt

Thin lines, gradients-within-gradients and small detail all die at 32px. Every
prompt below already bakes these in, but if you write your own, keep them:

- One idea, one silhouette. Two or three colours plus the ground.
- Thick forms, generous negative space, centred with padding around the edge.
- Flat or a single soft gradient — no rendering, no bevels, no drop shadows.
- **No text, no letters, no numbers** (models will add garbage lettering unless
  you say so twice).
- Square canvas, generate at 1024×1024.

---

### A1 — The Four Slots *(recommended)*

The strongest idea on the page, because it *is* the product: four loot actions,
four inks, and a 2×2 inventory grid is the most game-native shape there is. It
also happens to be trivially readable at 32px.

> A minimalist flat app icon: a 2×2 grid of four rounded squares arranged inside
> a larger rounded square, like an RPG inventory pouch with four slots. Each of
> the four inner cells is a different solid colour — deep indigo #6366f1,
> emerald green #10b981, warm amber #f59e0b, and signal red #ef4444 — set on a
> near-black navy #0f172a background. The cells have soft 6px-style rounded
> corners and sit with even generous spacing between them. Completely flat
> vector style, no gradients, no shadows, no outlines, no texture. Centred with
> wide padding. Absolutely no text, no letters, no numbers, no symbols inside
> the cells. Square 1:1 composition, app icon design, clean and geometric.

**Variations to try:** ask for the top-left cell to be a slightly larger indigo
square (hierarchy — indigo is the "commit" colour); or for one cell to be an
empty outline instead of a fill (the unfiled item).

---

### A2 — The Manifest Page

The north star, literally. A ledger page reduced to four ruled lines, one of
them indigo — the entry that's been decided.

> A minimalist flat app icon: a single sheet of ledger paper shown head-on as a
> rounded rectangle in cold off-white #f8fafc, sitting on a near-black navy
> #0f172a background. Across the page are four thick horizontal bars
> representing written lines. Three bars are muted slate grey-blue; the second
> bar is deep indigo #6366f1 and slightly wider, standing out from the others.
> A short vertical margin rule runs down the left side in warm amber #f59e0b.
> Completely flat vector style, bold thick shapes, no thin lines, no gradients,
> no shadows, no texture, no realism. Centred with wide padding. Absolutely no
> real text, no letters, no numbers — the lines are abstract bars only. Square
> 1:1 composition, app icon design.

**Variations:** replace the amber margin rule with a small amber checkmark at
the end of the indigo bar; or tilt the page very slightly for life.

---

### A3 — The Satchel and the Item

Closest to your original instinct — the bag — but stripped to a silhouette that
still reads tiny.

> A minimalist flat app icon: the bold silhouette of an open drawstring pouch or
> adventurer's satchel, filled solid in deep indigo #6366f1, on a near-black
> navy #0f172a background. Above the open mouth of the pouch, a single small
> rounded diamond-shaped item token in warm amber #f59e0b is falling into it.
> The pouch is a simple heavy geometric shape with a wide flat base and a
> gathered top — chunky and readable, not detailed or illustrative. Completely
> flat vector style, solid fills only, no gradients, no shadows, no outlines, no
> stitching detail, no texture. Centred with wide padding. Absolutely no text,
> no letters, no numbers. Square 1:1 composition, app icon design.

**Variations:** three falling tokens in indigo / green / amber instead of one;
or the pouch in off-white on indigo, for the light-theme version.

---

### A4 — The Quill Check

Ledger plus decision in two shapes. The most "verb"-like of the four — it says
*noted, handled*.

> A minimalist flat app icon: a bold geometric quill pen nib pointing down and
> to the left, filled solid in cold off-white #f8fafc, on a near-black navy
> #0f172a background. Sweeping out from the nib's tip is a single thick
> brushstroke that forms a checkmark, in deep indigo #6366f1. The nib is a
> simple heavy wedge shape with one slot cut into it — geometric, not
> illustrative or ornate. Completely flat vector style, solid fills only, no
> gradients, no shadows, no outlines, no feather barbs, no texture. Centred with
> wide padding. Absolutely no text, no letters, no numbers. Square 1:1
> composition, app icon design.

**Variations:** swap the checkmark for a downward sorting arrow that splits into
two paths (loot vs sell); or render the nib in amber for a warmer read.

---

# Tier B — the illustrated scene

Here the brief flips: detail is welcome, the palette should feel lit rather than
flat, and the character can carry the story. The one thing to hold onto is that
**this is logistics, not combat** — the drama is in the sorting, not the fight.

---

### B1 — The Quartermaster at the Table *(closest to the north star)*

> A moody digital illustration of a fantasy quartermaster at work. A hooded
> figure in worn leather and partial armour sits at a heavy wooden camp table,
> quill in hand, writing in a large open ledger. Spread across the table in
> front of them is a spill of adventuring loot being sorted into four distinct
> small piles — weapons, raw crafting materials, gemstones, and junk. An open
> canvas satchel sits at their elbow, half-packed. The scene is lit by a single
> hanging lantern casting warm amber #f59e0b light across the table, while the
> surrounding darkness falls off into near-black navy #0f172a and violet-black
> #1e1b4b. Faint deep indigo #6366f1 rim light catches the figure's shoulders
> and the edge of the ledger. Painterly semi-realistic game-concept-art style,
> rich but controlled colour, strong value contrast, cinematic three-quarter
> view from slightly above. No text, no legible writing, no letters or numbers
> on the ledger page. Landscape 16:9 composition.

---

### B2 — At the Chest

More action, more literally "looting" — good if you want the artwork to say what
the app does at a glance.

> A moody digital illustration of a fantasy adventurer crouched beside a just-
> opened treasure chest in a dark stone chamber. One hand reaches into the chest
> lifting out a glowing item; the other balances a small leather-bound ledger on
> their knee, a quill tucked behind their ear. A bulging satchel hangs open at
> their hip. Warm amber #f59e0b light spills upward out of the chest and lights
> the underside of their face and hands, while the chamber behind falls away
> into near-black navy #0f172a and violet-black #1e1b4b. Cool deep indigo
> #6366f1 rim light edges the figure from behind. Painterly semi-realistic game-
> concept-art style, strong chiaroscuro, cinematic low three-quarter angle.
> Emphasis on the deliberate, methodical act of recording the haul rather than
> on action or combat. No text, no legible writing, no letters or numbers.
> Landscape 16:9 composition.

---

### B3 — The Isometric Workbench

This is the one that matches the app's actual material — glass panels floating
over an indigo gradient. Best fit for a README header or a docs banner.

> A small isometric diorama illustration floating in dark empty space. On a
> compact wooden desk sits an open ledger with a quill resting across it, a
> leather satchel spilling a few small item icons, a stack of coins, and a
> partly open treasure chest. A single hanging lantern above casts warm amber
> #f59e0b light down onto the desk. The whole scene sits on a floating rounded
> platform with softly glowing deep indigo #6366f1 edges, against a background
> gradient running from near-black navy #0f172a through violet-black #1e1b4b.
> Clean stylised low-poly-meets-painterly game art, crisp readable shapes, soft
> ambient occlusion, no harsh outlines. Isometric 3/4 projection, centred,
> generous empty space around the diorama. No text, no letters, no numbers.
> Square 1:1 composition.

---

### B4 — The Manifest Itself

No character at all. The most on-system option — it looks like the app rather
than like a fantasy poster, and it will age better than a character will.

> An elegant illustration of a single sheet of aged parchment floating at a slight
> angle in dark space, seen from above and slightly to the side. Down the left
> margin of the page runs a vertical column of small square fantasy item icons —
> a dagger, an ore chunk, a gemstone, a vial, a coil of silk. Beside each icon
> sits a small coloured mark: deep indigo #6366f1, emerald green #10b981, warm
> amber #f59e0b, signal red #ef4444. A quill rests across the lower right corner
> of the page. The parchment is lit by warm amber #f59e0b light from the upper
> left, and floats above a deep background gradient running from near-black navy
> #0f172a through violet-black #1e1b4b, with a soft indigo glow beneath it.
> Painterly, restrained, elegant game-UI-art style. No text, no legible writing,
> no letters or numbers — the ruled lines and marks are abstract. Landscape 16:9
> composition.

---

## Practical notes

**Generating.** Ask for 1024×1024 for anything in Tier A. Neither model produces
true transparency — the flat `#0f172a` ground in the Tier A prompts is
deliberate, so you can key it out cleanly afterwards. If you'd rather trace to
vector, add *"on a plain white background"* instead and the edges come out far
easier to select.

**Text.** Both models will smuggle lettering into anything resembling a page or
a book. Every prompt above says "no text" twice on purpose. Check the output
before you commit to one.

**Turning a mark into the icon set.** Tauri generates every size and format from
a single 1024×1024 source:

```bash
npx tauri icon path/to/mark-1024.png
```

That writes `32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.ico`,
`icon.icns` and the Windows Store `Square*Logo.png` set into `src-tauri/icons/`,
replacing what's there today. Check the 32px output on a real taskbar before
deciding — that's the size that kills most marks.

**In-app tile.** The header currently draws a 36px indigo-gradient rounded tile
with the letters "EQ" in it (`App.tsx`, around the header bar). Once you pick a
mark, that becomes an `<img>` and the letterform goes away.

**Both themes.** Whatever you pick has to hold up on `#0f172a` *and* on the light
theme's `#e0e7ff` wash. The A1 grid and A3 satchel survive that best; A2's
off-white page will need an inverted variant.

**One open item this closes.** `PRODUCT.md` currently records "whether a distinct
visual mark exists" as explicitly undecided. Once you settle on one, that entry
should be updated — and `DESIGN.md` gains a Brand section describing the mark.
