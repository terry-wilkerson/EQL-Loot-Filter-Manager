# EQL Loot Filter Manager

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
| 1  | Always Loot   |
| 2  | Always Store  |
| 3  | Always Merge  |
| 4  | Always Sell   |

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
  theme.ts                # GlassTheme type, theme/style builders
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
- `search_eq_items` — autocomplete over the bundled read-only SQLite catalog.
- `load_settings` / `save_settings` — persist user preferences (see below).

### Settings

User preferences are stored as `settings.json` in the OS app-data directory
(resolved via Tauri's `app_data_dir()`), **not** in the webview's `localStorage`.
Currently persisted: dark/light theme and the last-used UI directory. An older
`localStorage` value is migrated automatically on first run.

## Development

Prerequisites: Node.js, and the [Tauri prerequisites](https://tauri.app/start/prerequisites/)
(Rust toolchain, platform webview).

```bash
npm install
npm run tauri dev      # run the app with hot reload
```

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

Two kinds of large binary assets are stored with [Git LFS](https://git-lfs.com/)
(configured in `.gitattributes`):

- `*.sqlite` — the bundled item catalog (`src-tauri/items_database.sqlite`).
- `public/icons/*.png` — the item icon sprite sheets.

Anyone cloning the repo needs Git LFS installed or those files arrive as small
text pointers instead of real data:

```bash
# one-time install (Windows: winget install GitHub.GitLFS, or git-lfs.com)
git lfs install
git clone <repo-url>        # LFS files are fetched automatically
```

The release workflow checks out with `lfs: true` so builds get the real bytes.

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

