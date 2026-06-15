# Cursor configuration audit (SilverKey)

**Purpose:** Single inventory for `.cursor/` decisions (`keep` / `merge` / `delete` / `move`). Update this file when rules, skills, or agents materially change. After cross-cutting architecture or feature work, also follow [post-major-change-checklist.md](./post-major-change-checklist.md) so docs and this inventory stay aligned.

**Last regenerated:** 2026-06-07 (Added scoped `shared/local-dev-database.mdc` rule and Claude/Codex adapters for local DB reset/secrets/deploy boundaries. **19** agents, **14** skills remain.)

## AGENTS.md vs repo commands (verified)

| Documented command                                                                                | Source                                                         |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `pnpm typecheck`, `pnpm lint`, `pnpm lint:cycles`, `pnpm format:check`, `pnpm check`, `pnpm test:run` | [Client/package.json](../../Client/package.json)               |
| `./scripts/ci/run-all-linters.sh [client\|server\|all]`, `make lint`                                  | [scripts/ci/run-all-linters.sh](../../scripts/ci/run-all-linters.sh), [Makefile](../../Makefile) |
| `make setup`, `make dev-db-init`, `make dev`, `make test-fe`, `make test-be`, `make openapi`, `make openapi-verify` | [Makefile](../../Makefile)                                     |

Client dev: `pnpm dev:web`, `pnpm dev:mobile`, `pnpm build:web` (from `Client/package.json`).

## MCP / ignore

| Item                    | Status                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| `.cursor/mcp.json`      | Not committed; use [.cursor/mcp.example.json](../../.cursor/mcp.example.json) and local Cursor MCP settings |
| `.cursorindexingignore` | Excludes `@mention`-only paths; **`.claude/`**, **`.codex/`**, **`.agents/`** adapter trees (canonical content in `.cursor/`) |
| `.cursorignore`         | Team template: [.cursorignore.example](../../.cursorignore.example) (copy to `.cursorignore` locally)       |

## Tracked `.cursor/` files (lines, last commit date, audit status)

| Path                                                          |       Lines | Last touched (git) | Status | Notes                          |
| ------------------------------------------------------------- | ----------: | ------------------ | ------ | ------------------------------ |
| `.cursor/mcp.example.json`                                    |  (see repo) | 2026-05-11         | keep   | MCP shape only; no secrets     |
| `.cursor/README.md`                                           |  (see repo) | 2026-05-11         | keep   | Meta-doc for `.cursor/` layout |
| `.cursorindexingignore`                                       | (repo root) | 2026-05-11         | keep   | Index-only excludes            |
| `.cursor/settings.json`                                       |          16 | 2026-05-11         | keep   | Workspace Cursor settings      |
| `.cursor/agents/silverkey-engineer.md`                        |  (see repo) | 2026-05-20         | keep   | Default engineering persona    |
| `.cursor/agents/react-lint-fixer.md`                          |          73 | 2026-05-11         | keep   | Subagent                       |
| `.cursor/agents/silverkey-architecture-boundary-auditor.md`   |          70 | 2026-02-20         | keep   | Subagent                       |
| `.cursor/agents/silverkey-bundle-build-optimizer.md`          |          47 | 2026-02-20         | keep   | Subagent                       |
| `.cursor/agents/silverkey-dead-code-sweeper.md`               |          62 | 2026-02-20         | keep   | Subagent                       |
| `.cursor/agents/silverkey-doc-readability-auditor.md`         |          39 | 2026-02-20         | keep   | Subagent                       |
| `.cursor/agents/silverkey-error-surface-detector.md`          |          44 | 2026-02-20         | keep   | Subagent                       |
| `.cursor/agents/silverkey-file-module-reorganizer.md`         |          72 | 2026-02-20         | keep   | Subagent                       |
| `.cursor/agents/silverkey-linter-structure-enforcer.md`       |          75 | 2026-04-20         | keep   | Subagent                       |
| `.cursor/agents/silverkey-performance-regression-analyzer.md` |          70 | 2026-02-20         | keep   | Subagent                       |
| `.cursor/agents/silverkey-refactor-suggestion-engine.md`      |          71 | 2026-05-13         | keep   | Subagent                       |
| `.cursor/agents/silverkey-security-secrets-scanner.md`        |          77 | 2026-04-20         | keep   | Subagent                       |
| `.cursor/agents/silverkey-test-coverage-gap-analyzer.md`      |          46 | 2026-02-20         | keep   | Subagent                       |
| `.cursor/agents/silverkey-audit-axis1-size-responsibility-fixer.md` |      43 | 2026-05-13         | keep   | Post–component-audit remediation |
| `.cursor/agents/silverkey-audit-axis2-props-api-fixer.md`           |      40 | 2026-05-13         | keep   | Post–component-audit remediation |
| `.cursor/agents/silverkey-audit-axis3-state-dataflow-fixer.md`      |      39 | 2026-05-13         | keep   | Post–component-audit remediation |
| `.cursor/agents/silverkey-audit-axis4-render-cost-fixer.md`        |      40 | 2026-05-13         | keep   | Post–component-audit remediation |
| `.cursor/agents/silverkey-audit-axis5-bundle-import-fixer.md`        |      39 | 2026-05-13         | keep   | Post–component-audit remediation |
| `.cursor/agents/silverkey-audit-architecture-remediation.md`       |      39 | 2026-05-13         | keep   | Post–component-audit remediation |
| `.cursor/skills/post-major-change-sync/SKILL.md`             |  (see repo) | 2026-05-15         | keep   | Docs + rules sync after major changes |
| `.cursor/skills/documentation-placement/SKILL.md`            |  (see repo) | 2026-05-28         | keep   | Canonical `documentation/` placement; anti-`docs/` |
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
| `shared/documentation.mdc`                 | yes → **yes**              | `documentation/**/*.md`, `**/README.md` | Canonical doc tree vs `docs/`; see `AGENTS.md` |
| `shared/silverkey-context.mdc`            | — → **yes**                | (always-on)                             | Company, RESPA reflex, MCP; canonical context lives in rule + pitch rule |
| `shared/code-style.mdc`                   | — → **yes**                | (always-on)                             | Stack, Linear commits, verification            |
| `shared/respa-compliance.mdc`             | — → **no**                 | partners, placement, concierge, financing/insurance/closing | RESPA guardrails for partner code |
| `shared/pitch-and-fundraising.mdc`        | — → **no**                 | pitch, deck, investor, fundraising globs | Deck-aligned numbers and tone      |
| `shared/local-dev-database.mdc`           | — → **no**                 | Makefile, compose, setup/secrets scripts, Postgres ops docs | Local DB reset/init stays in Make/setup; deploy secrets stay in `.github/scripts/*` |
| `shared/post-major-change-sync.mdc`         | no → **no**                | Client/apps/**, Client/packages/**, openapi/**, Server/app/** | Same-PR / fast-follow docs + rules sync after major architecture |
| `shared/qa-test-accounts.mdc`               | no → **no**                | `documentation/client/qa/**`            | SIL-145 per-role dev sign-in + flow probing (agent-requested) |
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
| `frontend/component-audit-rubric.mdc`       | yes → **no**               | Client/\*_/_.{ts,tsx}                   | Five-axis component audits; see `documentation/client/patterns/react-component-audit-rubric.md` |
| `frontend/accessibility.mdc`                | no → **no**                | Client/\*_/_.{ts,tsx}                   | WCAG 2.1 AA; see `documentation/client/standards/accessibility-standards.md` |

Other `.mdc` files were already `alwaysApply: false` or unchanged in scope. **No duplicate filenames:** do not add `* 2.mdc` copies alongside a canonical rule—Cursor may load both and waste context.

### Component audit artifacts

| Path | Purpose |
|------|---------|
| [`documentation/internal/component-audit/README.md`](./component-audit/README.md) | Tracked audit evidence (folder matrix); remediation → Linear. |
| Repo root `audit/` (gitignored) | Local-only scratch audit tables; see rubric doc. |

## Claude adapter (`.claude/`)

Canonical content stays in `.cursor/`. Claude Code loads `@` stubs from `.claude/`.

| Path | Count | Status | Notes |
| ---- | ----- | ------ | ----- |
| `.claude/settings.json` | 1 | keep | Adapter permissions config |
| `.claude/rules/*.md` | 43 | keep | `@` stub → `.cursor/rules/**/*.mdc` |
| `.claude/agents/*.md` | 19 | keep | `@` stub → `.cursor/agents/<name>.md` |
| `.claude/skills/*/SKILL.md` | 14 | keep | `@` stub → `.cursor/skills/<name>/SKILL.md` (parity with `.cursor/skills/`) |

## Codex adapter (`.codex/` + `.agents/skills/`)

Canonical content stays in `.cursor/`. Codex loads project config when the repo is **trusted**.

| Path | Count | Status | Notes |
| ---- | ----- | ------ | ----- |
| `.codex/README.md` | 1 | keep | Adapter map; edit `.cursor/` first |
| `.codex/config.toml` | 1 | keep | `file_opener`, `project_doc_max_bytes`, `[agents]` |
| `.codex/rules/*.md` | 43 | keep | `@` stub → `.cursor/rules/**/*.mdc`; mirrors `.claude/rules/` |
| `.codex/rules/README.md` | 1 | keep | Adapter index |
| `.codex/agents/*.toml` | 19 | keep | `developer_instructions` → `.cursor/agents/<name>.md` |
| `.agents/skills/*/SKILL.md` | 14 | keep | `@` stub → `.cursor/skills/<name>/SKILL.md` |
| `CODEX.md` (repo root) | 1 | keep | Codex quickstart; `@AGENTS.md` |

See [`.codex/README.md`](../../.codex/README.md) and [CODEX.md](../../CODEX.md).

## Removed fleet agents (2026-06-04)

Deleted from `.cursor/agents/` (+ matching `.claude/agents/`, `.codex/agents/`) and skills:

- **Docs audit:** `silverkey-docs-*` (9) + skill `documentation-full-stack-audit`
- **Frontend reorg:** `silverkey-frontend-reorg-*` (8) + skill `frontend-reorganization`
- **Backend reorg:** `silverkey-backend-reorg-*` (10) + skill `backend-reorganization`

**Replacement:** default / `silverkey-engineer` agent + skills `documentation-placement`, `post-major-change-sync`, `make check-docs`; reorg checklists under `documentation/internal/component-audit/`.

## Loose markdown under `.cursor/` (historical)

OpenAPI adoption and forms implementation journals were **moved** to [documentation/dev/cursor-legacy/](../dev/cursor-legacy/README.md) (read-only). Do not re-add `.cursor/openapi-*.md` or `.cursor/FORMS_*.md`; extend canonical docs under `documentation/server/` or `.cursor/rules/` instead.

## Local-only noise (do not commit)

| Pattern                 | Action                                           |
| ----------------------- | ------------------------------------------------ |
| `.cursor/debug-*.log`   | Added to `.cursorignore.example`; delete locally |
| `.cursor/.agent-tools/` | Local agent artifacts                            |

## Definition-of-done checklist

- [x] `alwaysApply: true` count = **7** (security, thin-app, linting, documentation, silverkey-context, code-style, env-vars-minimal) — see [.cursor/README.md](../../.cursor/README.md)
- [x] [CLAUDE.md](../../CLAUDE.md) — Claude Code quickstart at repo root
- [x] [CODEX.md](../../CODEX.md) — Codex quickstart at repo root
- [x] `.codex/` + `.agents/skills/` — Codex adapters (2026-06-02)
- [x] [.cursor/rules/README.md](../../.cursor/rules/README.md) — rules index
- [x] `.cursor/README.md` meta-doc
- [x] `documentation/internal/cursor-audit-latest.md` (this file)
- [x] `documentation/internal/post-major-change-checklist.md` — process for syncing docs + Cursor after major architecture/features
- [x] `.cursorignore.example` / `.cursorindexingignore` tightened
- [x] `.cursor/mcp.example.json`
- [x] PR template Cursor section
- [x] `.cursorrules` deprecated / pointer only
