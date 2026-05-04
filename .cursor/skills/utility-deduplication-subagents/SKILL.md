---
name: utility-deduplication-subagents
description: Parallel read-only subagent workflow to find duplicated or misplaced feature utilities, consolidate into packages/utils or packages/schemas, and use ESLint silverkey/no-cross-feature-utils-imports. Use when deduplicating helpers, fixing cross-feature imports, or running utility consolidation passes.
---

# Utility deduplication (parallel subagents)

Use this skill when scanning for reimplemented helpers, cross-feature `packages/features/*` imports that should be shared, or planning moves into `Client/packages/utils/` or `Client/packages/schemas/`.

## Ground rules

- **Shared pure helpers:** `Client/packages/utils/` (framework-agnostic; see [AGENTS.md](../../../AGENTS.md)).
- **Feature-local helpers:** `Client/packages/features/<name>/utils/` only when not shared.
- **Docs:** [Features README](../../../Client/packages/features/README.md) discourages feature-to-feature imports; [shared-packages.md](../../../documentation/client/shared-packages.md) describes package layers.
- **After moves:** Update every import site; follow [folder-decomposition.mdc](../../rules/shared/folder-decomposition.mdc).

## Phase 1 — Launch 2–4 `explore` subagents (readonly)

Run agents **in parallel**. Each returns: paths, import lines, one-line rationale, suggested target (`packages/utils/...`, `packages/schemas/...`, or keep + compose in app).

### Agent A — Cross-feature import edges

**Goal:** List value imports where consumer feature ≠ provider feature.

1. Ripgrep from repo root `Client/`:
   ```bash
   rg 'from "packages/features/' packages/features -g '*.{ts,tsx}'
   ```
2. For each hit, resolve **consumer** = first path segment after `packages/features/` in the **file** path; **provider** = first segment in the import string.
3. Keep rows where `consumer !== provider` and the declaration is not `import type` (type-only imports are lower priority for consolidation).
4. Output a table: `consumer → provider → full import path`.

### Agent B — Duplicate / near-duplicate feature utils

**Goal:** Cluster helpers under `packages/features/**/utils/**/*.ts`.

1. List exports: `rg '^export (function|const|async function)' packages/features -g '**/utils/**/*.ts'`
2. Group by **exact exported name**; flag same name in multiple features.
3. Group by **similar filenames** (e.g. `format*`, `normalize*`) for manual comparison.

### Agent C — Overlap with `packages/utils`

**Goal:** Feature utils that duplicate concerns already in `packages/utils/` (dates, currency, map colors, etc.).

1. Skim [Client/packages/utils/](../../../Client/packages/utils/) top-level folders (`format/`, `maps/`, `date/`, …).
2. Sample-grep feature utils for imports of design-tokens + map/geo/date patterns that mirror existing utils.

### Agent D — Cross-feature type sources

**Goal:** `import type` from `packages/features/<other>/types/...` used widely → candidates for `packages/schemas/` or `packages/types/`.

1. `rg 'import type .* from "packages/features/' packages/features`
2. Filter where provider feature ≠ consumer feature; prioritize types imported from many features.

## Phase 2 — Triage

1. Pure + multi-consumer → `packages/utils/<domain>/`.
2. Shared domain types → `packages/schemas/` or `packages/types/` per shared-packages.md.
3. Orchestration / UI coupling → keep in owning feature; expose via feature barrel or app composition.
4. True duplicate → delete duplicate after switching imports; re-grep old path.

**Do not** move React hooks, components, or fat orchestration into `packages/utils`.

## Phase 3 — Verify (from `Client/`)

```bash
pnpm typecheck && pnpm lint && pnpm lint:cycles
```

Add or extend `*.test.ts` next to moved pure logic when behavior is non-trivial.

## Phase 4 — Guardrails

- **ESLint:** `silverkey/no-cross-feature-utils-imports` — warns on **value** imports from `packages/features/<other>/utils/...` when the importer lives under a different feature. Configured in [eslint.config.js](../../../Client/packages/config/eslint/eslint.config.js) (`packages/features` override). Narrow future allowlist via rule options `allowImportPrefixes` if needed.
- **Repeat:** Re-run Phase 1 on one feature subtree when touching that area; shrink any temporary allowlist as code moves.

## Copy-paste subagent prompts

**Agent A (cross-feature edges):** “Read-only explore: under `Client/packages/features`, find all `from \"packages/features/...\"` imports where the importing file's feature folder (first segment after `packages/features/`) differs from the imported feature. Exclude `import type` declarations. Output markdown table: consumer → provider → import string + file path.”

**Agent B (duplicate utils):** “Read-only explore: under `Client/packages/features/**/utils/**/*.ts`, cluster files by duplicated export names and similar basenames; list top 15 highest-risk pairs with file paths.”

**Agent C (utils overlap):** “Read-only explore: compare `Client/packages/utils/` structure to feature `utils/` folders; list feature files whose responsibility clearly overlaps an existing `packages/utils` module (map, format, date, etc.).”

**Agent D (shared types):** “Read-only explore: find `import type` from another feature's `types/`; list candidates to lift to `packages/schemas`.”
