<p align="center">
  <img src="docs/readme-banner.webp" width="100%"
       alt="A hooded quartermaster writes in a ledger by lantern light at a camp table, sorting a haul of weapons, crafting materials and gemstones into piles beside an open satchel.">
</p>

# EQL Loot Filter

A desktop app for creating and editing **EverQuest Legends** advanced loot filter
files (`LF_*.ini`). Point it at your EverQuest UI folder, pick or create a filter
file, then add items (with an autocomplete search over the game's item catalog)
and assign each one a loot action.

Built with [Tauri 2](https://tauri.app/) (Rust backend) and React 19 + TypeScript
(Vite) on the frontend.

## Loot actions

Filters map each item id to one of four actions:

| id | Action        |
|----|---------------|
| 1  | Always Store  |
| 2  | Always Loot   |
| 3  | Always Merge  |
| 4  | Always Sell   |

The numbers are the on-disk source of truth. This
matches `FILTER_MAP` in `src/types.ts` and the in-game behaviour.

Files use a caret-delimited body under a `[Filters]` header:

```
[Filters]
1042^2^540^Fine Steel Dagger
```
`item_id ^ filter_id ^ icon_id ^ name`

## Project layout

```
src/                      # React frontend
  main.tsx                # Entry; mounts <App> inside <ToastProvider>
  App.tsx                 # Orchestration: state + handlers + composition
  api.ts                  # Typed wrappers around every Tauri command (the IPC contract)
  types.ts                # Shared domain types + FILTER_MAP + newUid
  theme.ts                # AppTheme + the four skins, theme/style builders
  utils.ts                # Pure helpers (formatFilterFileName, matchesSearch)
  utils.test.ts           # Vitest unit tests for utils
  components/
    Dashboard.tsx         # Directory picker + detected-file list
    ItemTable.tsx         # The editable item grid
    AddItemModal.tsx      # Item search/autocomplete + add (self-contained)
    NewFileModal.tsx      # Create a new LF_*.ini
    ConfirmModal.tsx      # Reusable confirmation dialog
    Toast.tsx             # ToastProvider + useToast() notifications
    EQIcon.tsx            # Renders an item icon from the sprite sheets
    Icon.tsx              # The interface icon set (inline SVG)
  dev/                    # Dev-only fixture backend (see below); never shipped
  assets/                 # Small build-time assets (the app mark, key art WebPs)

src-tauri/                # Rust backend
  src/main.rs             # Thin binary entry -> lib::run()
  src/lib.rs              # Commands, file I/O, SQLite search, settings, tests
  capabilities/default.json
  tauri.conf.json
```

### Backend commands

All frontend/backend communication goes through the typed functions in
`src/api.ts`, which wrap these Tauri commands in `src-tauri/src/lib.rs`:

- `scan_ui_directory` — find `LF_*.ini` files (auto-routes into `userdata/`),
  and record the selected directory as the confined root for file operations.
- `load_advloot_file` / `save_advloot_file` / `create_advloot_file` — read and
  write filter files. Every path is validated to stay inside the selected
  directory, and item names are rejected if they contain `^` or newlines.
- `search_eq_items` — autocomplete over the bundled SQLite catalog (capped at
  200 matches).
- `classify_tradeskill_ids` — of the loaded item ids, which are tradeskill items.
- `list_tradeskill_items` — every depot-storable tradeskill item, for the bulk
  "Add ALL Tradeskill Items" action (stackable trade goods only; excludes
  no-trade, temporary, attunable, lore, heirloom, containers, weapons, armor and
  jewelry).
- `find_unknown_item_ids` — loaded item ids that aren't in the catalog (custom
  EQL items).
- `add_custom_items` — insert custom items into the catalog with unique item ids.
- `load_settings` / `save_settings` — persist user preferences (see below).

The item catalog is opened **read-write** so `add_custom_items` can add custom
EQL items to the per-user copy; the bundled resource itself is never modified.

### Settings

User preferences are stored as `settings.json` in the OS app-data directory
(resolved via Tauri's `app_data_dir()`), **not** in the webview's `localStorage`.
Currently persisted: the selected skin, dark/light level and the last-used UI
directory. An older `localStorage` value is migrated automatically on first run.

## Development

Prerequisites: Node.js, and the [Tauri prerequisites](https://tauri.app/start/prerequisites/)
(Rust toolchain, platform webview).

```bash
npm install
npm run tauri dev      # run the app with hot reload
```

### UI work without the Tauri shell

```bash
npm run dev            # frontend only, at http://localhost:1420
```

Opened in a normal browser there is no Tauri IPC bridge, so the app serves
**fixture data** instead (`src/dev/`): a stand-in EverQuest directory, three
filter files, and a catalog of about 1,200 items. Useful for fast UI iteration
with devtools and hot reload; no Rust toolchain needed.

`window.__eqlMock` exposes controls from the console — `simulateGameWrite()`
(makes the file watcher fire, as if the game had looted something),
`simulateDelete()`, `reset()`, and `latencyMs`. The fallback is dev-only and is
stripped from production builds.

## Build

```bash
npm run build          # tsc type-check + vite build (frontend)
npm run tauri build    # produce a distributable bundle
```

## Tests

```bash
npm test                       # frontend unit tests (Vitest)
cd src-tauri && cargo test     # backend unit tests
```

## Git LFS

Large binary assets are stored with [Git LFS](https://git-lfs.com/) (configured
in `.gitattributes`):

- `*.sqlite` — the bundled item catalog (`src-tauri/items_database.sqlite`).
- `public/icons/*.png` — the item icon sprite sheets.
- `brand/**` — the design masters (the 2048px icon master and the key art).

Nothing under `brand/` is imported by the app or read by a build, which is why
the whole folder can be tracked safely. Build-time assets deliberately stay out
of LFS: the `frontend` CI job checks out with `lfs: false`, so a tracked file
that Vite bundles would ship as a ~130-byte pointer.

Anyone cloning the repo needs Git LFS installed or those files arrive as small
text pointers instead of real data:

```bash
# one-time install (Windows: winget install GitHub.GitLFS, or git-lfs.com)
git lfs install
git clone <repo-url>        # LFS files are fetched automatically
```

The release workflow checks out with `lfs: true` so builds get the real bytes.
CI also runs an `lfs-guard` job that fails in both directions: if a tracked
asset is committed as a raw blob, or if anything read at build time
(`src/assets/`, `public/fonts/`, `src-tauri/icons/`, `index.html`) ends up
behind LFS.

## Continuous integration & releases

Two GitHub Actions workflows live in `.github/workflows/`:

- **`ci.yml`** runs on every push/PR to `main`: frontend type-check + build +
  Vitest, and `cargo test` for the backend.
- **`release.yml`** builds installers for Windows, macOS (Intel + Apple Silicon),
  and Linux (x64 + Arm64) and creates a **draft** GitHub Release.

To cut a release, bump the version in `src-tauri/tauri.conf.json` (and
`package.json`), then push a matching tag:

```bash
git tag app-v0.1.0
git push origin app-v0.1.0
```

The workflow builds every platform, attaches the installers to a draft release
named after the version, and waits for you to review and publish it. You can
also trigger it manually from the repo's **Actions** tab.

> The release job needs write access to create the release. If you hit
> "Resource not accessible by integration", enable **Settings → Actions →
> Workflow permissions → Read and write permissions**.

