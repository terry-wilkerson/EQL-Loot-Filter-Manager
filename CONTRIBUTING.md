# Contributing & Branching Strategy

This project uses **GitHub Flow**: a lightweight, trunk-based workflow that fits
a small team and tag-based releases.

## The short version

```
main ─────●─────────●─────────●──────  (always releasable; tag app-v* to release)
           \       /
   feature/save-as ●─●   ← branch, commit, open PR, merge back
```

1. `main` is always in a releasable state and is **protected** — no direct pushes.
2. Every change starts on a short-lived branch cut from the latest `main`.
3. Open a Pull Request; CI must pass and the PR is merged (squash) back to `main`.
4. Releases are cut by tagging a commit on `main` (see below).

## Branch naming

Use a type prefix and a short kebab-case description:

| Prefix       | For                                             |
|--------------|-------------------------------------------------|
| `feature/`   | new functionality (e.g. `feature/save-as`)      |
| `fix/`       | bug fixes (e.g. `fix/duplicate-item-id`)        |
| `refactor/`  | internal changes with no behavior change        |
| `docs/`      | documentation only                              |
| `chore/`     | tooling, CI, dependencies                       |

## Workflow

```bash
# 1. Start from an up-to-date main
git checkout main
git pull

# 2. Create your branch
git checkout -b feature/save-as

# 3. Make changes, committing in logical chunks (see commit style below)
git add -A
git commit -m "feat: add Save As with overwrite warning"

# 4. Push and open a Pull Request against main
git push -u origin feature/save-as
#    ...open the PR on GitHub...

# 5. Once CI is green and the PR is approved, squash-merge it.
#    Delete the branch afterward (GitHub offers a button).
```

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/): a
`type: summary` subject in the imperative mood. Common types: `feat`, `fix`,
`docs`, `refactor`, `test`, `chore`. This keeps history scannable and makes
changelogs easy to generate later.

Examples:

```
feat: add Save As with overwrite warning
fix: reject item names containing carets
docs: document the release process
```

## Required checks

The `ci` workflow runs on every PR and must pass before merge:

- `lfs-guard` — no raw (non-LFS) `.sqlite` or icon PNG slipped in
- `frontend` — `npm run build` (tsc) and `npm test`
- `backend` — `cargo test`

## Protecting `main` (one-time GitHub setup)

In the repo: **Settings → Branches → Add branch ruleset** (or "Add rule") for
`main`:

- Require a pull request before merging.
- Require status checks to pass, and select `lfs-guard`, `frontend`, and
  `backend` (they appear after the `ci` workflow has run at least once).
- (Optional) Require branches to be up to date before merging.
- (Optional) Include administrators, so the rule applies to everyone.

## Cutting a release

Releases come from `main` after your changes are merged:

```bash
git checkout main
git pull

# Bump the version in BOTH files so they stay in sync:
#   package.json            -> "version"
#   src-tauri/tauri.conf.json -> "version"
git commit -am "chore: release v0.2.0"      # via a PR if main is protected
git tag app-v0.2.0
git push origin main --tags
```

Pushing the `app-v*` tag triggers the `publish` workflow, which builds all
platforms and creates a **draft** GitHub Release for you to review and publish.

Hotfixes follow the same path as any change: branch (`fix/...`), PR, merge, then
tag a new patch release.
