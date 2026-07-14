---
name: remove-unused-files
description: >-
  Sweeps the repo for orphaned source files and unnecessary markdown using
  evidence-backed deletion only. Use when removing unused files, dead code
  files, stray scratch .md, duplicate docs, cleanup cruft, or running an unused-file pass before merge.
disable-model-invocation: true
---

# Remove unused files and unnecessary markdown

Use this skill when the user wants a **structured cleanup pass**: orphaned modules, duplicate artifacts, or markdown that violates repo documentation placement — **never** guess-delete.

## Hard stops (do not delete)

- **Legal / policy:** `LICENSE*`, `NOTICE*`, security/compliance artifacts.
- **Repo entrypoints:** `README.md` files that anchor major trees (`Client/`, `Server/`, `documentation/`, package READMEs indexed from `documentation/*/README.md`).
- **Canonical docs:** Everything under `documentation/` unless the user explicitly targets a specific obsolete file and `documentation/how-we-document.md` / folder README index rows are updated in the same change.
- **Generated or toolchain-owned:** Lockfiles, CI configs, OpenAPI outputs (`Client/packages/types/api.generated.ts`), build outputs — delete only when the user requests regeneration/removal per project norms.
- **Anything referenced at runtime** without tracing: dynamic `require`, glob loaders, asset manifests, native linking configs.

When in doubt: **report as candidate**, do not delete.

## Phase 1 — Classify targets

Ask or infer scope:

| Scope | Typical roots |
|-------|----------------|
| Client TS/TSX | `Client/packages/**`, `Client/apps/**` |
| Server Python | `Server/**` |
| Docs hygiene | `.md` outside `documentation/` (except allowed README / `.cursor/` / explicit exceptions) |

Work **one scope per pass** unless the user insists on full-repo.

## Phase 2 — Evidence for “unused” source files

For each candidate path:

1. **Static references:** Ripgrep the basename and the path alias (e.g. `packages/features/foo/bar` → imports containing `foo/bar` or barrel path).
2. **Barrels:** If the file is only imported via `index.ts`, trace exports up to package entry (`package.json` `exports` / app imports).
3. **Tests:** Search `*.test.*`, `__tests__/`, pytest mirrors for imports or path strings.
4. **Config references:** tsconfig paths, Metro/Webpack/Vite aliases, `package.json` scripts, codegen configs.

**Candidate for deletion only if:** zero references after the above **and** `pnpm typecheck` / `pnpm lint` (Client) or targeted Python checks (Server) still pass after removal in a trial branch — or the user confirms intentional orphan.

Prefer launching **`explore` subagents (readonly)** in parallel on disjoint subtrees when many files are suspicious; each agent returns: path, evidence summary (grep hits count / none), risk notes.

## Phase 3 — Evidence for unnecessary `.md`

Per `.cursor/rules/shared/documentation.mdc`:

- Long-form docs belong under **`documentation/`** with index updates — not random folders.
- Flag **scratch / duplicate / obsolete** markdown when:
  - Duplicate topic already covered under `documentation/` (merge or delete duplicate after confirming links).
  - One-off notes in feature folders (`TODO.md`, `NOTES.md`, session dumps) not linked from any README — candidate for deletion or move into `documentation/` only if product-worthy.

**Never** delete `.md` under `.cursor/rules/` or indexed `documentation/` paths without updating README indices in the same PR-level change.

## Phase 4 — Execute deletes safely

1. Delete **only** paths with documented evidence (paste grep rationale or “confirmed by user”).
2. Small batches (e.g. one package or one Server subtree per commit) so revert is easy.
3. After deletes: run verification from repo norms (`Client/`: `pnpm typecheck && pnpm lint`, cycles if touched graph; `Server/`: targeted tests / circular import script when Python layout changes).

## Phase 5 — Output template

Summarize for the user:

```markdown
## Unused / unnecessary file sweep

### Deleted (with evidence)
- `path` — reason + how verified

### Candidates (not deleted — needs confirmation)
- `path` — why uncertain

### Skipped (protected / runtime / generated)
- `path` — rule applied
```

## Copy-paste subagent prompts

**Orphan TS under a package:** “Read-only explore: under `Client/packages/features/<NAME>/`, list `*.ts`/`*.tsx` files with **no** importing references from repo-wide ripgrep for their export paths or basename; exclude stories/tests only if tests are the sole consumer — flag those separately.”

**Stray markdown:** “Read-only explore: find `*.md` under `Client/packages/features/` (or user path) not referenced from any README and not under `documentation/`; classify scratch vs intentional ADR vs duplicate of `documentation/` topic.”

## Relation to other tooling

- Broader duplication / misplaced helpers → [.cursor/skills/utility-deduplication-subagents/SKILL.md](../utility-deduplication-subagents/SKILL.md).
- Import breakage after deletes → [.cursor/skills/scan-fix-import-errors/SKILL.md](../scan-fix-import-errors/SKILL.md).
