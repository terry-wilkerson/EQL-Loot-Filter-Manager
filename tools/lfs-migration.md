# Moving the design masters into Git LFS

The multi-megabyte artwork under `brand/` was committed as raw blobs before the
LFS rule existed. Adding the rule only changes *future* commits — the old blobs
stay in history and keep the repo (and every clone) heavy. Clearing them means
rewriting history.

**Run all of this from Windows** (Git Bash or PowerShell), not from a shell that
lacks `git-lfs`. Check first:

```bash
git lfs version   # if this fails, install Git LFS and run: git lfs install
```

---

## What moves, and what deliberately does not

**Into LFS — `brand/**`:** the 2048px icon master, its transparent variant, the
key-art illustration, and the raw generator output. About 17 MB. Nothing in this
folder is imported by the app or read by a build, which is exactly why the whole
folder can be tracked safely.

**Staying as normal blobs:**

| Path | Why |
|---|---|
| `src/assets/mark-144.png` (9 KB) | `App.tsx` imports it; Vite bundles it |
| `src/assets/quartermaster-*.webp` | intended for the UI |
| `public/fonts/*.woff2` (59 KB total) | read by the build |
| `src-tauri/icons/*` | `tauri-build` reads these |

This split matters: **the `frontend` CI job checks out with `lfs: false`.** An
LFS-tracked file that Vite bundles would be embedded as a ~130-byte pointer, the
build would pass, and the artifact would ship a broken image. `ci.yml` now has a
guard that fails the build if anything under `src/assets/`, `public/fonts/`,
`src-tauri/icons/` or `index.html` ends up LFS-tracked.

---

## Step 0 — commit the current state first

`git lfs migrate` refuses to run with a dirty working tree.

```bash
git checkout -b chore/brand-assets-lfs
git add -A
git commit -m "chore: move design masters to brand/ and track via Git LFS"
```

## Step 1 — back up

History rewriting is not reversible in place. Take a full mirror before you
touch anything:

```bash
git clone --mirror . ../eql-backup.git
```

## Step 2 — rewrite history

The `--include` list carries **both** the new `brand/` paths and the old
`src/assets/` paths, because that is where the big blobs actually live in the
existing commits. Converting only the new path would leave the old blobs behind
and shrink nothing.

```bash
git lfs migrate import --everything \
  --include="brand/**,src/assets/a4-quill-icon-v1.png,src/assets/b1-quartermaster-v2.png,src/assets/b1-quartermaster-v2-clean.png,src/assets/icon-source-2048.png,src/assets/icon-mark-transparent-2048.png"
```

`--everything` covers all branches and tags. Every commit SHA after the first
affected commit will change.

## Step 3 — verify

```bash
git lfs ls-files                      # the brand/ files should be listed
git lfs migrate info --everything     # nothing large should remain outside LFS
```

Then confirm the working tree is still intact — the files should be real images,
not pointer text:

```bash
head -c 8 brand/icon-source-2048.png | xxd    # expect the PNG magic bytes
npm run build                                  # mark-144.png must still bundle
```

## Step 4 — reclaim local space

```bash
git reflog expire --expire-unreachable=now --all
git gc --prune=now --aggressive
```

## Step 5 — push

```bash
git lfs push --all origin
git push --force-with-lease origin --all
git push --force-with-lease origin --tags
```

---

## Before you force-push

- **`main` is protected.** GitHub will reject the push until you temporarily
  allow force pushes in Settings → Branches, then re-protect afterwards. If you
  would rather not, do the rewrite on a branch and open a PR — but note the
  history rewrite only takes effect on `main` once `main` itself is rewritten,
  so a normal merge will not shrink anything.
- **Anyone else with a clone must re-clone.** Their old history no longer exists
  upstream and a `git pull` will produce a mess.
- **Existing release tags get new SHAs.** Published GitHub Releases keep their
  uploaded binaries, but the tag they point at will move. If that matters, note
  the old SHAs before you start.
- **GitHub does not immediately reclaim the space.** The old objects stop being
  served once nothing references them; the packfile shrinks on their side later.
  The repo *clones* small straight away, which is the part that matters.
