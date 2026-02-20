---
name: rework-folder-subfolders
description: Reworks a folder with too many files by grouping some into subfolders, then updates all imports within those files and everywhere that references them. Use when the user asks to reorganize a folder, split a directory, group files into subfolders, or reduce clutter in a file-heavy directory.
---

# Rework Folder with Subfolders

This skill walks through **grouping some files into subfolders** and **updating every import** that touches those files. You may leave some files at the parent level (e.g. `index.ts`, main entry).

## When to Use

- User asks to "reorganize this folder", "split this directory", "group these into subfolders", or "this folder has too many files"
- A directory has ~10+ files (or ~8+ same-type) and clear groupings by feature, type, or domain
- Aligns with project rule: `.cursor/rules/shared/folder-decomposition.mdc`

## Workflow

### Step 1: Identify the target folder and groupings

- Confirm the **root folder** to rework (e.g. `Client/apps/web/features/feed/Reels/`).
- List its files and subfolders (use `list_dir` or read the folder).
- **Group files** by concern (feature, type, or domain). Examples:
  - By type: `components/`, `hooks/`, `utils/`, `sections/`
  - By feature: `Carousel/`, `GestureHandler/`, `FeedItem/`
  - By domain: `auth/`, `search/`, `calendar/`
- Decide which files **stay at parent** (e.g. `index.ts`, main `Reels.tsx`) and which **move** into new subfolders.
- Name subfolders clearly (e.g. `components/`, not `comp/`).

### Step 2: Create subfolders and move files

- Create only the subfolders you need.
- **Move** the chosen files into the right subfolder (one subfolder per group).
- Do **not** change file contents yet (import updates come next).

### Step 3: Update imports inside moved files

For **each moved file**:

- **Relative imports to parent/siblings**: Adjust for the new depth.
  - Example: file was at `Reels/FeedItem.tsx`, now at `Reels/components/FeedItem.tsx`; `from '../utils'` → `from '../utils'` (parent of `Reels`); `from './Other'` → `from './Other'` if `Other` moved with it, else `from '../Other'` if it stayed in `Reels/`.
- **Same-folder references**: If both files moved into the same subfolder, `./Sibling` stays; if one moved and one didn’t, use `../Sibling` or the correct relative path.
- **Barrel/parent**: Imports from `../index` or parent modules must point to the new location of that index/parent (path may need an extra `../` or different segment).

Fix every import in each moved file so paths resolve correctly from its **new** path.

### Step 4: Scan codebase for imports to moved files (old paths)

- **Search for the old path segments** and **old module names**:
  - TypeScript/JavaScript: search for path substrings (e.g. `Reels/FeedItem`, `features/feed/Reels/FeedItem`, or `./FeedItem` in `Reels/`) and for imports that use the **old** file or folder name.
  - Python: search for old module paths in `import` / `from` (e.g. `from app.features.reels.feed_item`).
- Use **grep/ripgrep** (or project search) for:
  - Old file names (e.g. `FeedItem` when that file moved into `components/`).
  - Old path segments (e.g. `Reels/FeedItem` → now `Reels/components/FeedItem`).
- Update **every** hit:
  - Imports in other source files.
  - Barrel files (`index.ts`, `__init__.py`) that re-export moved modules.
  - Config, test, or story files that reference the moved modules.

Re-run the same searches after edits to catch any remaining references.

### Step 5: Update barrel / re-export files

- If the parent folder has an **index** (e.g. `Reels/index.ts`):
  - If it re-exported moved modules by path, change those re-exports to the new paths (e.g. `from './components/FeedItem'` instead of `from './FeedItem'`).
  - Ensure every symbol still needed from the outside is either re-exported from the barrel or imported from the new location elsewhere.
- If you introduced **new subfolder barrels** (e.g. `components/index.ts`), create them and re-export what the parent or callers expect.

### Step 6: Verify

- **Lint and build**:
  - Client (TS): from repo root, `cd Client && pnpm typecheck && pnpm lint`.
  - Server (Python): run project tests/lint as usual.
- Fix any "module not found" or "has no exported member" errors (see project skill **scan-fix-import-errors** if needed).

## Checklist

- [ ] Target folder and groupings identified; subfolders named.
- [ ] Subfolders created; only the chosen files moved.
- [ ] Imports **inside** every moved file updated (relative, same-folder, barrel/parent).
- [ ] Codebase scanned for **old paths and module names**; all such imports updated (source, barrels, config, tests).
- [ ] Parent (and new) barrel files updated so public API is correct.
- [ ] `pnpm typecheck` and `pnpm lint` (or server equivalent) pass.

## Quick reference

- **Scope**: You may move **some** files into subfolders and leave others at the parent (e.g. main entry, `index.ts`).
- **Tools**: Prefer project-wide search (grep/ripgrep) for old path segments and old module names; update every match; search again to confirm.
- **Project rule**: See `.cursor/rules/shared/folder-decomposition.mdc` for when to split and how imports must be updated.
- **Import errors after refactor**: Use the **scan-fix-import-errors** skill to find and fix any remaining import/module errors.
