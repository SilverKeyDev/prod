# Cursor configuration audit (SilverKey)

**Purpose:** Single inventory for `.cursor/` decisions (`keep` / `merge` / `delete` / `move`). Update this file when rules, skills, or agents materially change.

**Last regenerated:** 2026-05-11 (implementation of Optimal Cursor setup plan).

## AGENTS.md vs repo commands (verified)

| Documented command                                                                                | Source                                                         |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `pnpm typecheck`, `pnpm lint`, `pnpm lint:cycles`, `pnpm format:check`, `pnpm check`, `pnpm test` | [Client/package.json](../../Client/package.json)               |
| `./scripts/run-all-linters.sh [client\|server\|all]`                                              | [scripts/run-all-linters.sh](../../scripts/run-all-linters.sh) |

Client dev: `pnpm dev:web`, `pnpm dev:mobile`, `pnpm build:web` (from `Client/package.json`).

## MCP / ignore

| Item                    | Status                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| `.cursor/mcp.json`      | Not committed; use [.cursor/mcp.example.json](../../.cursor/mcp.example.json) and local Cursor MCP settings |
| `.cursorindexingignore` | Added at repo root — `@mention`-only paths                                                                  |
| `.cursorignore`         | Team template: [.cursorignore.example](../../.cursorignore.example) (copy to `.cursorignore` locally)       |

## Tracked `.cursor/` files (lines, last commit date, audit status)

| Path                                                          |       Lines | Last touched (git) | Status | Notes                          |
| ------------------------------------------------------------- | ----------: | ------------------ | ------ | ------------------------------ |
| `.cursor/mcp.example.json`                                    |  (see repo) | 2026-05-11         | keep   | MCP shape only; no secrets     |
| `.cursor/README.md`                                           |  (see repo) | 2026-05-11         | keep   | Meta-doc for `.cursor/` layout |
| `.cursorindexingignore`                                       | (repo root) | 2026-05-11         | keep   | Index-only excludes            |
| `.cursor/settings.json`                                       |          16 | 2026-05-11         | keep   | Workspace Cursor settings      |
| `.cursor/agents/react-lint-fixer.md`                          |          73 | 2026-05-11         | keep   | Subagent                       |
| `.cursor/agents/silverkey-architecture-boundary-auditor.md`   |          70 | 2026-02-20         | keep   | Subagent                       |
| `.cursor/agents/silverkey-bundle-build-optimizer.md`          |          47 | 2026-02-20         | keep   | Subagent                       |
| `.cursor/agents/silverkey-dead-code-sweeper.md`               |          62 | 2026-02-20         | keep   | Subagent                       |
| `.cursor/agents/silverkey-doc-readability-auditor.md`         |          39 | 2026-02-20         | keep   | Subagent                       |
| `.cursor/agents/silverkey-error-surface-detector.md`          |          44 | 2026-02-20         | keep   | Subagent                       |
| `.cursor/agents/silverkey-file-module-reorganizer.md`         |          72 | 2026-02-20         | keep   | Subagent                       |
| `.cursor/agents/silverkey-linter-structure-enforcer.md`       |          75 | 2026-04-20         | keep   | Subagent                       |
| `.cursor/agents/silverkey-performance-regression-analyzer.md` |          70 | 2026-02-20         | keep   | Subagent                       |
| `.cursor/agents/silverkey-refactor-suggestion-engine.md`      |          64 | 2026-02-20         | keep   | Subagent                       |
| `.cursor/agents/silverkey-security-secrets-scanner.md`        |          77 | 2026-04-20         | keep   | Subagent                       |
| `.cursor/agents/silverkey-test-coverage-gap-analyzer.md`      |          46 | 2026-02-20         | keep   | Subagent                       |
| `.cursor/skills/feature-translations/SKILL.md`                |         129 | 2026-04-20         | keep   | i18n / raw keys                |
| `.cursor/skills/platform-file-extension-choice/SKILL.md`      |          46 | 2026-05-11         | keep   | `.web` / `.tsx` choice         |
| `.cursor/skills/react-native-migration/SKILL.md`              |          54 | 2026-02-20         | keep   | RN migration                   |
| `.cursor/skills/remove-unused-files/SKILL.md`                 |          92 | 2026-05-04         | keep   | Dead files                     |
| `.cursor/skills/resolve-layouts-violation/SKILL.md`           |         273 | 2026-03-10         | keep   | ESLint layouts rule            |
| `.cursor/skills/resolve-primitives-violation/SKILL.md`        |         145 | 2026-03-10         | keep   | ESLint primitives rule         |
| `.cursor/skills/resolve-variants-violation/SKILL.md`          |         182 | 2026-03-10         | keep   | ESLint variants rule           |
| `.cursor/skills/responsive-ui-silverkey/SKILL.md`             |          88 | 2026-04-12         | keep   | Responsive passes              |
| `.cursor/skills/rework-folder-subfolders/SKILL.md`            |          89 | 2026-02-20         | keep   | Folder splits                  |
| `.cursor/skills/run-all-linters/SKILL.md`                     |          42 | 2026-05-11         | keep   | Repo linters script            |
| `.cursor/skills/scan-fix-import-errors/SKILL.md`              |          89 | 2026-02-20         | keep   | Import fixes                   |
| `.cursor/skills/utility-deduplication-subagents/SKILL.md`     |          85 | 2026-05-04         | keep   | Utils dedup                    |

**Invocation “last used”** is not tracked in git. Use `git log -1 -- SKILL.md` as a proxy for stale skills.

### Rules (`.mdc`) summary

| Rule                                        | Always-on (before → after) | Globs (after pass)                      | Notes                                           |
| ------------------------------------------- | -------------------------- | --------------------------------------- | ----------------------------------------------- |
| `shared/security.mdc`                       | yes → **yes**              | Client/**, Server/**                    | Universal                                       |
| `shared/thin-app-architecture.mdc`          | yes → **yes**              | Client/\*\*                             | Universal                                       |
| `shared/linting.mdc`                        | yes → **yes**              | \*_/_                                   | Universal                                       |
| `shared/monorepo.mdc`                       | yes → **no**               | \*_/_                                   | Context budget                                  |
| `shared/ci-gates.mdc`                       | yes → **no**               | .github/workflows/**, Client/**         |                                                 |
| `shared/openapi-workflow.mdc`               | yes → **no**               | openapi/\*\*, workflow, generated types |                                                 |
| `shared/cross-platform-component-reuse.mdc` | yes → **no**               | Client/\*_/_.{ts,tsx}                   |                                                 |
| `shared/logging.mdc`                        | yes → **no**               | Client/**, Server/**                    |                                                 |
| `frontend/frontend-architecture.mdc`        | yes → **no**               | Client/\*_/_.{ts,tsx}                   | Aligned with packages/features; long form → doc |
| `frontend/ui-components.mdc`                | yes → **no**               | apps/web + packages                     |                                                 |
| `frontend/platform-file-extensions.mdc`     | yes → **no**               | Client/apps/\*\*                        |                                                 |
| `frontend/state-boundaries.mdc`             | yes → **no**               | Client/\*_/_.{ts,tsx}                   |                                                 |
| `backend/database.mdc`                      | yes → **no**               | Server/\*\*                             |                                                 |

Other `.mdc` files were already `alwaysApply: false` or unchanged in scope.

## Loose markdown under `.cursor/` (historical)

Previously noted: `FORMS_*`, `openapi-adoption-checklist.md`, etc. **Not present** in the current workspace listing. If reintroduced, default **move** to `documentation/internal/` or domain docs per plan.

## Local-only noise (do not commit)

| Pattern                 | Action                                           |
| ----------------------- | ------------------------------------------------ |
| `.cursor/debug-*.log`   | Added to `.cursorignore.example`; delete locally |
| `.cursor/.agent-tools/` | Local agent artifacts                            |

## Definition-of-done checklist

- [x] `alwaysApply: true` count ≤ 3 (security, thin-app, linting)
- [x] `.cursor/README.md` meta-doc
- [x] `documentation/internal/cursor-audit-latest.md` (this file)
- [x] `.cursorignore.example` / `.cursorindexingignore` tightened
- [x] `.cursor/mcp.example.json`
- [x] PR template Cursor section
- [x] `.cursorrules` deprecated / pointer only
