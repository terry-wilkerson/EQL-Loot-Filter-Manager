# CLAUDE.md

Guidance for AI agents working in this repo. Read this before making changes.

## What this is

A Tauri 2 desktop app for editing EverQuest Legends loot filter files
(`LF_*.ini`). Rust backend in `src-tauri/src/lib.rs`; React 19 + TypeScript
frontend in `src/`. See `README.md` for the full layout and file format.

## Architecture conventions

- **All IPC goes through `src/api.ts`.** Never call `invoke(...)` directly from a
  component. Add a typed wrapper in `api.ts` and import it.
- **Shared types live in `src/types.ts`** and mirror the Rust structs. If you
  change a Rust `#[derive(Serialize)]` struct that crosses the boundary, update
  the matching TS interface (field names are snake_case on both sides).
- **`App.tsx` is orchestration only** — state, handlers, and composition.
  Presentational pieces are components under `src/components/`.
- **Pure logic goes in `src/utils.ts`** (frontend) or free functions in
  `lib.rs` (backend) so it can be unit-tested. Prefer extracting over inlining.

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

## Gotchas

- `main.rs` is a thin entry that calls `eql_loot_filter_manager_lib::run()`; all
  real code is in `lib.rs`. Don't re-add logic to `main.rs`.
- The SQLite item catalog is opened **read-only** and shipped as a bundled
  resource; it is copied into `app_data_dir` on first launch.
- `EQIcon` computes sprite-sheet offsets from `icon_id` (500 offset,
  column-major, 36 icons/sheet). Sheets live in the frontend `public/icons/`.
