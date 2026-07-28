# CLAUDE.md

Guidance for AI agents working in this repo. Read this before making changes.

## What this is

A Tauri 2 desktop app for editing EverQuest Legends loot filter files
(`LF_*.ini`). Rust backend in `src-tauri/src/lib.rs`; React 19 + TypeScript
frontend in `src/`. See `README.md` for the full layout and file format.

## Architecture conventions

- **All IPC goes through `src/api.ts`.** Never call `invoke(...)` directly from a
  component. Add a typed wrapper in `api.ts` and import it.
- **`api.ts` also owns the no-Tauri fallback.** When there is no IPC bridge
  (`npm run dev` opened in a plain browser) and the build is a dev build, every
  wrapper routes to the in-memory fixture backend in `src/dev/` instead. Adding
  a command means adding *both* the `invoke` call and its `mockBackend.ts`
  counterpart — a command with no fallback silently breaks browser-only UI work.
  See "Browser-only UI development" below.
- **Shared types live in `src/types.ts`** and mirror the Rust structs. If you
  change a Rust `#[derive(Serialize)]` struct that crosses the boundary, update
  the matching TS interface (field names are snake_case on both sides).
- **`App.tsx` is orchestration only** — state, handlers, and composition.
  Presentational pieces are components under `src/components/`.
- **Pure logic goes in `src/utils.ts`** (frontend) or free functions in
  `lib.rs` (backend) so it can be unit-tested. Prefer extracting over inlining.
- **Styling is inline style objects, with one exception.** Anything a style
  object cannot express — `@font-face`, the document type reset,
  `:focus-visible`, `:hover`, `:disabled`, zebra rows, scrollbars, keyframes —
  belongs in `buildGlobalStyles(theme)` in `src/theme.ts`, which is injected as
  a `<style>` tag and re-runs per theme. Do not add a static `.css` file; it
  could not react to the theme.
- **The whole visual system is `buildTheme(skin, isDark)` in `theme.ts`.** Two
  axes: the *skin* (`ledger` — the committed world — plus `glass`, `console`,
  `solid`) and the light level. Both persist to `settings.json`. Every colour,
  radius, shadow and blur a component renders must come off the returned
  `AppTheme`: `theme.cardBg`, `theme.radius.<role>`, `theme.elevation.<step>`,
  `theme.blur.<step>`, `theme.dangerInk`, `overlay(isDark, alpha)` for chrome
  tints. **A hardcoded colour or radius in a component is a bug** — it will be
  wrong in three of the four skins. `DESIGN.md` is the authority on meaning.
- **Radii are named by role, not size**: `control` · `field` · `action` · `chip`
  · `panel` · `modal` · `workspace`. Pick the role, never a pixel value.
- **Surfaces that render outside `<App/>` read `:root` custom properties**, not
  props. `buildGlobalStyles` publishes `--toast-*`, `--ink-*` and `--icon-tile-*`
  for exactly this. `Toast` (mounted above `<App/>`) and `EQIcon` (once per row,
  in three surfaces) both use that bridge; follow it rather than threading the
  theme down.
- **Interface icons are inline SVG in `src/components/Icon.tsx`**, stroked in
  `currentColor` on a 24-unit box at 1.5 weight and marked `aria-hidden`
  (every one sits beside a text label). No emoji in the chrome, no icon font,
  no icon package, no `<img>`.
- **The action channel is skin-independent.** `actionInk`/`actionWash` in
  `theme.ts` bind the four loot actions to fixed hues, because a row's action is
  data, not chrome. Do not make them vary by skin.

## Invariants — don't regress these

- **Path confinement:** `resolve_in_ui_dir` in `lib.rs` is the security boundary.
  Every file command must validate that the path canonicalizes to inside the
  directory recorded by `scan_ui_directory` and matches `LF_*.ini`. Do not add a
  file command that takes a raw path and touches the filesystem without this.
- **Item-name safety:** names containing `^`, `\n`, or `\r` are rejected on save
  (`validate_item`) — they would corrupt the caret-delimited format.
- **Row identity:** loot rows carry a client-only `uid` (`LootRow`). React keys
  and all edit/remove/bulk operations key on `uid`, NOT `item_id` (item ids are
  not unique within a file). Strip `uid` before sending to the backend.
- **Settings:** persist via `save_settings`/`load_settings` (writes
  `settings.json` in `app_data_dir`). Do not reintroduce `localStorage` for
  persistence.

## Branching & commits

This repo follows **GitHub Flow** (see `CONTRIBUTING.md`). `main` is protected
and always releasable. Do work on a short-lived branch (`feature/`, `fix/`,
`refactor/`, `docs/`, `chore/`), use Conventional Commit messages
(`feat:`, `fix:`, …), and land changes via a PR that passes the `ci` workflow.
Releases are cut by tagging `main` with `app-v*`.

## Verifying changes

- Frontend: `npm run build` (runs `tsc`) and `npm test` (Vitest).
- Backend: `cd src-tauri && cargo check` and `cargo test`.
- There is no automated end-to-end test; manual `npm run tauri dev` covers the
  UI flows (select dir → open/create file → add/edit items → save).

## Browser-only UI development

`npm run dev` alone (no Tauri shell) now serves a working app at
`localhost:1420` against fixture data, so UI work can happen in a normal browser
with hot reload and devtools. `npm run tauri dev` is unaffected — the real
bridge is present, so the real commands run.

- `src/dev/fixtures.ts` — the fake catalog (~1,200 depot items plus curated
  gear), three `LF_*.ini` files, and three deliberately-unknown item ids so the
  custom-item flow is reachable.
- `src/dev/mockBackend.ts` — the in-memory command surface. It mirrors backend
  *rules*, not just shapes: path confinement, `LF_*.ini` naming, caret/newline
  rejection, the 200-result search cap, unique-id custom inserts. Keep it that
  way, so a UI change that would break against Rust breaks here too.
- Console controls on `window.__eqlMock`: `simulateGameWrite()` (exercises the
  file watcher and reconcile flow), `simulateDelete()`, `reset()`, and
  `latencyMs` (defaults to 90ms so loading states actually render).
- Both modules are behind `import.meta.env.DEV` and a dynamic import, so
  production builds drop them entirely. Verify with
  `npm run build && grep -r "__eqlMock" dist/` — it must find nothing.

Fixture settings are in memory only and reset on reload. That is deliberate:
persisting them would mean `localStorage`, which the real app does not use.

## Gotchas

- `main.rs` is a thin entry that calls `eql_loot_filter_manager_lib::run()`; all
  real code is in `lib.rs`. Don't re-add logic to `main.rs`.
- The SQLite item catalog is shipped as a bundled resource and copied into
  `app_data_dir` on first launch. It is opened **read-write** so `add_custom_items`
  can insert custom EQL items that aren't in the seeded catalog (the bundled
  resource is never modified — only the per-user copy). An `idx_eq_items_id`
  index is created on startup. Inserts enforce **unique item ids** (an id already
  present is skipped); icons may be shared across items.
- **Shipping a new catalog:** replace `src-tauri/items_database.sqlite` AND bump
  `BUNDLED_CATALOG_VERSION` in `lib.rs`. On launch the per-user copy is stamped
  with that version (SQLite `user_version`); a copy with a lower version is
  refreshed from the new bundle. User-added items live in a separate `custom_items`
  table (written alongside `eq_items` by `insert_custom_items`) and are **preserved
  and replayed** into the refreshed catalog, so updates never wipe custom items.
  A pre-versioning copy (`user_version = 0`) is adopted as current without a
  reseed. NOTE: custom items added before the `custom_items` table existed aren't
  tracked and won't survive the first real catalog bump.
- Catalog columns are **TEXT**, and several flags are **inverted** vs their
  names: `nodrop='0'` = No-Trade, `norent='0'` = Temporary, lore = `loregroup <> '0'`.
  Because `itemtype` is TEXT, `IN` lists must use string literals (`'0'`, not `0`)
  or matches silently fail. The bulk "add all tradeskill items" action uses the
  strict depot filter (`DEPOT_TRADESKILL_WHERE`); the main-page toggle and item
  search use the broad `tradeskills='1'` definition.
- `EQIcon` computes sprite-sheet offsets from `icon_id` (500 offset,
  column-major, 36 icons/sheet). Sheets live in the frontend `public/icons/`.
- **The type system is self-hosted IBM Plex.** `public/fonts/` holds
  `plex-sans-variable-latin.woff2` (variable 100–700) and
  `plex-mono-400-latin.woff2`, copied out of the
  `@fontsource-variable/ibm-plex-sans` and `@fontsource/ibm-plex-mono`
  devDependencies — those packages are provenance only and are never imported at
  runtime. To update, bump the devDependency and re-copy
  `files/ibm-plex-sans-latin-wght-normal.woff2` and
  `files/ibm-plex-mono-latin-400-normal.woff2`. Both `@font-face` blocks are
  declared twice on purpose: in `theme.ts` for the app, and in `index.html`'s
  static block so the request starts before the JS bundle parses. Never a CDN,
  and never add a subset or weight the app does not actually use.
