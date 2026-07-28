# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

EverQuest Legends players who use the game's advanced loot filter system. The
app is distributed publicly through GitHub releases, so the assumed user is a
stranger installing it cold — no Discord thread, no walkthrough, no prior
context from the author.

Two confirmed usage scenes, both first-class:

- **Alt-tabbed mid-session.** EverQuest Legends is running behind the app and
  actively rewriting the same `LF_*.ini` file. The user drops in to adjust a
  rule, then goes straight back to playing.
- **Prep between sessions.** Game closed. The user is deliberately building or
  overhauling a filter — bulk adds, reviewing hundreds of rows, restructuring.

Neither scene may be optimized at the other's expense.

## Product Purpose

Create and edit EverQuest Legends advanced loot filter files (`LF_*.ini`)
without hand-editing a caret-delimited text format or looking up numeric item
ids. The user points the app at their EverQuest UI folder, opens or creates a
filter file, adds items by name, and assigns each one a loot action (Always
Store, Always Loot, Always Merge, Always Sell — ids 1–4, with the on-disk
numbers as the source of truth).

Success is a correct filter file the game accepts, produced faster and more
safely than editing the `.ini` by hand.

## Positioning

Four mechanisms, all confirmed as core, that neither hand-editing the `.ini`
nor the in-game loot UI can offer:

- **Catalog search with the game's real icons.** A bundled SQLite item catalog
  with name/id autocomplete and the game's own sprite-sheet artwork, so an item
  is recognized visually and never looked up by id.
- **Bulk tradeskill / depot adds.** One action adds every depot-storable
  tradeskill item — a scale that is not reachable by hand.
- **Safe, correct file handling.** Path confinement, caret- and newline-safety
  validation on item names, and live reconciliation when the game rewrites the
  file underneath an open session. The app cannot corrupt a filter.
- **Custom EQL item support.** Item ids present in a user's filter but absent
  from the seeded catalog are detected and can be folded into the catalog
  permanently.

## Operating Context

- The user's EverQuest UI directory is the working root; the app auto-routes
  into `userdata/` and only ever touches files matching `LF_*.ini`.
- **The game is a concurrent writer.** While a filter is open the app polls the
  file's modification time every 3 seconds. An external change auto-reloads when
  the in-app state is clean, and opens a three-way reconcile when there are
  unsaved edits. Sole ownership of the file can never be assumed.
- Filter files use a caret-delimited body under a `[Filters]` header:
  `item_id ^ filter_id ^ icon_id ^ name`.
- User preferences (theme, last-used UI directory) persist to `settings.json`
  in the OS app-data directory — not webview `localStorage`.

## Capabilities and Constraints

Confirmed product constraints:

- **Dark and light themes are both first-class.** Both are user-facing and
  persisted; neither may become a second-class afterthought.
- **Must survive a small window.** The app has to stay usable non-maximized
  beside the running game, not only at full screen.

Implementation facts observed in the repository (technical truth, not stated
user preference):

- Tauri 2 desktop shell, Rust backend (`src-tauri/src/lib.rs`), React 19 +
  TypeScript + Vite frontend. Default window is 1400×600.
- CSP is `default-src 'self'; img-src 'self' asset:` and every asset — item
  catalog and icon sheets — ships in the bundle. No network dependency exists in
  the current implementation.
- Release CI builds Windows, macOS (Intel + Apple Silicon), and Linux
  (x64 + Arm64) installers. No platform has been declared primary.
- Item ids are **not** unique within a filter file; rows carry a client-only
  `uid` that all edit, remove, and bulk operations key on.

Explicitly undecided:

- Whether a distinct visual mark exists for the product, or whether the bundled
  icon set is still a placeholder.
- No primary OS has been declared, despite Windows being the game's platform.

## Brand Commitments

- **Product name: "EQL Loot".** The repository is currently out of sync with
  this — the README and package name say "EQL Loot Filter Manager", the browser
  title says "EverQuest Legends Loot Manager", and the Tauri window title is the
  raw slug `eql-loot-filter-manager`. All three should be corrected to the
  canonical name.
- **The game's own item icon art is an identity commitment,** not a convenience.
  Item recognition through the sprite-sheet artwork is part of what the product
  is, and must not be traded away for generic iconography.

Nothing else is committed: no confirmed voice, no confirmed mark, and no
required affiliation disclaimer.

## Evidence on Hand

Real assets present in the repository:

- Bundled SQLite item catalog (`src-tauri/items_database.sqlite`, Git LFS),
  roughly 13,000 items, of which about 7,504 satisfy the strict depot-eligible
  tradeskill filter.
- 379 item icon sprite sheets in `public/icons/` (Git LFS). `EQIcon` derives
  sheet offsets from `icon_id` (500 offset, column-major, 36 icons per sheet).
- `README.md`, `CONTRIBUTING.md`, `CLAUDE.md`, and CI/release GitHub Actions
  workflows.

Absent — future work must not fabricate these: no screenshots or product
imagery, no testimonials, no user or download counts, no press or reviews, no
benchmarks, no pricing or licensing claims beyond the repository's LICENSE.

## Product Principles

1. **The file on disk is the truth, and it is shared.** The game writes it too.
   Never present in-app state as authoritative without accounting for an
   external writer.
2. **A user's filter must never be corrupted.** Validation, path confinement,
   and reconciliation are load-bearing product promises, not defensive plumbing.
3. **Items are recognized, not looked up.** Name and the game's own icon art
   carry identity; numeric ids are implementation detail the user should rarely
   need to see.
4. **Serve the 20-second visit and the 20-minute session equally.** The
   alt-tabbed glance and the deliberate bulk overhaul are both primary.
5. **A cold install must succeed unaided.** A stranger with no context must get
   from "point at your UI folder" to a working filter without outside help.

## Accessibility & Inclusion

No product-specific accessibility requirement has been established. No formal
standard is committed; general craft standards still apply.
