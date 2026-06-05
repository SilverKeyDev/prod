# How we do documentation

Brief guide to SilverKey's documentation approach: one canonical system plus lightweight READMEs, no sprawl.

## 1. One canonical docs system

- **Root:** `documentation/` at the repo root. All long-form, cross-cutting docs live here.
- **Repo-root `docs/` must not exist.** Ops runbooks live in `documentation/server/ops/`. Creating `docs/` fails CI.
- **Split by surface:** `documentation/client/` for frontend; `documentation/server/` for backend. Client docs are grouped in subfolders (`architecture/`, `platform/`, `standards/`, `tooling/`, `patterns/`, `features/`, `qa/`). Add new docs in the right subfolder and link from that folder's README and `documentation/client/README.md`.
- **No duplicate long-form docs:** Don't add new long guides under `Client/` or `Server/` (except colocated READMEs noted below). Put them in `documentation/` and link from READMEs or Cursor rules.

## 2. Doc types

| Type | Where | Length |
|------|-------|--------|
| **Canonical** | `documentation/**` | Long-form allowed |
| **Entrypoint** | `AGENTS.md`, `ARCHITECTURE.md`, `README.md`, `setup.md`, `CLAUDE.md` | Short; link to `documentation/` |
| **Colocated** | `Client/packages/*/README.md`, `Server/app/**/README.md`, `Server/app/services/docusign/docs/` | Short (~40 lines); link to canonical |
| **Design spec** | `documentation/transactions/` | Status banner required; shipped vs partial vs planned — **planned work is tracked in Linear only**, not repo markdown backlogs |
| **Cursor** | `.cursor/rules/`, `.cursor/skills/` | Constraints + links; not duplicate long guides |

## 3. Lightweight READMEs in major folders

- **Every major top-level folder** has a short **README.md**: what the folder is and where to read more.
- **Keep READMEs short:** A few sentences or a small table; link to `documentation/` for detail.

## 4. What stays in-repo (not under documentation/)

- **Client:** `documentation/client/standards/LINTING.md` — local reference. Architecture rules in `.cursor/rules/frontend/`.
- **Client packages:** `Client/packages/*/README.md` — short overviews only.
- **Server:** Per-module READMEs under `Server/app/` stay; server-wide long-form docs go in `documentation/server/`.
- **Cursor:** `.cursor/rules/` and `.cursor/agents/` — may reference `documentation/`.

## 5. Cursor and tooling

- **Rules** (`monorepo.mdc`, `documentation.mdc`) point to `documentation/` for structure.
- **Skills:** `documentation-placement` for new prose; `post-major-change-sync` after major architecture changes; `make check-docs` for link/placement gates. Full-tree audits use the default agent + checklist — not a fleet of `silverkey-docs-*` subagents.
- **Checks:** `./scripts/ci/check-script-references.sh`, `./scripts/ci/check-doc-placement.sh`, and `./scripts/ci/check-doc-links.sh` (also `make check-docs`).

## 6. Adding or moving docs

- **New long-form doc:** Create under `documentation/client/` or `documentation/server/`, add a row to that folder's README, fix internal links.
- **Broken `docs/` links:** Retarget to `documentation/server/ops/` — never create repo-root `docs/`.
- **Deprecating a doc:** Remove content and update all links.

## 7. Maintenance

- Quarterly: run `make check-docs` and bump "Last verified" dates on `documentation/transactions/` docs after code review.
- After major features: [post-major-change-checklist.md](./internal/post-major-change-checklist.md).

## Summary

| Where | What |
|-------|------|
| `documentation/` | Single canonical docs root |
| `documentation/HOW_WE_DOCUMENT.md` | This file |
| `documentation/internal/post-major-change-checklist.md` | After major features: sync docs + Cursor |
| Entrypoints | Short READMEs linking to `documentation/` |
| CI | `scripts/ci/check-script-references.sh`, `scripts/ci/check-doc-placement.sh`, `scripts/ci/check-doc-links.sh` |
