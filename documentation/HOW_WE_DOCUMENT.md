# How we do documentation

Brief guide to SilverKey’s documentation approach: one canonical system plus lightweight READMEs, no sprawl.

## 1. One canonical docs system

- **Root:** `documentation/` at the repo root. All long-form, cross-cutting docs live here.
- **Split by surface:** `documentation/client/` for frontend; `documentation/server/` for backend. Add new docs in the right folder and link from the folder’s README.
- **No duplicate long-form docs:** Don’t add new long guides or references under `Client/` or `Server/` (except as noted below). Put them in `documentation/client/` or `documentation/server/` and link from READMEs or Cursor rules if needed.

## 2. Lightweight READMEs in major folders

- **Every major top-level folder** has a short **README.md**: what the folder is, how it’s used, and where to read more (often a link into `documentation/`).
- **Major folders:** Repo root, `Client/`, `Server/`, `documentation/`, and optionally `Client/apps/`, `Client/packages/` (the latter already have a `packages/README.md`). Not every subfolder gets a README — only those that are entry points or need a one-paragraph orientation.
- **Keep READMEs short:** A few sentences or a small table; link to `documentation/` or in-repo files (e.g. `ARCHITECTURE.md`, `LINTING.md`) for detail. No “README spam”: avoid redundant or copy-pasted long text.

## 3. What stays in-repo (not under documentation/)

- **Client:** `documentation/client/LINTING.md` — kept as local reference. Architecture and platform rules are in `.cursor/rules/frontend/`. Linked from `documentation/client/` and Cursor rules.
- **Client packages:** `Client/packages/*/README.md` and key subfolders (e.g. `config/`, `hooks/`, `services/`) — short package/API overviews. Detailed structure and rules live in `documentation/client/`.
- **Server:** Per-module READMEs under `Server/app/` stay; server-wide long-form docs go in `documentation/server/`.
- **Cursor:** `.cursor/rules/` and `.cursor/agents/` — rules and agent instructions; they may reference paths under `documentation/`.

## 4. Cursor and tooling

- **Rules** (e.g. `monorepo.mdc`, `documentation.mdc`) point to `documentation/` for structure and “how we document.” Don’t reference removed or legacy doc paths (e.g. old `Client/documentation/structure-*.md`).
- **Agents/skills** that need doc context should use `documentation/client/` or `documentation/server/` and the READMEs in major folders.

## 5. Adding or moving docs

- **New long-form doc:** Create it under `documentation/client/` or `documentation/server/`, add a row to that folder’s README, and fix any internal links (e.g. `./other-doc.md`).
- **New major folder:** Add a brief README.md at the top level of that folder and, if relevant, a link from `documentation/README.md` or the appropriate client/server README.
- **Deprecating a doc:** Remove or replace content and update all links (READMEs, Cursor rules, other docs). Don’t leave broken references.

## Summary

| Where | What |
|-------|------|
| `documentation/` | Single canonical docs root; client/ and server/ subfolders. |
| `documentation/HOW_WE_DOCUMENT.md` | This file — how we do documentation. |
| Major top-level folders | Lightweight README.md only; link to documentation/ for detail. |
| Client/Server in-repo | Short local refs (ARCHITECTURE, LINTING, package READMEs); long-form in documentation/. |
| Cursor rules | Reference documentation/ and READMEs; no legacy doc paths. |
