# Claude Code configuration

How SilverKey wires [Claude Code](https://docs.anthropic.com/en/docs/claude-code) to the same canonical AI config as Cursor. For Cursor-specific setup (plugins, Automations, cursor-memory MCP), see [cursor-configuration-optimization.md](./cursor-configuration-optimization.md) and [cursor-agent-memory.md](./cursor-agent-memory.md).

---

## Architecture

| Layer | Location | Role |
| ----- | -------- | ---- |
| **Canonical** | [`.cursor/`](../../../.cursor/) | Rules (`.mdc`), skills, agents, memory bank |
| **Claude adapter** | [`.claude/`](../../../.claude/) | Lazy-load rule stubs pointing at `.cursor/` |
| **Entrypoint** | [`CLAUDE.md`](../../../CLAUDE.md) | Always-on rules, stable memory, quickstart |

Edit `.cursor/` first. Sync [`.claude/`](../../../.claude/) stubs when rules, agents, or skills change — see [`.claude/README.md`](../../../.claude/README.md).

---

## How Claude loads context

### 1. `CLAUDE.md` (every session)

[`CLAUDE.md`](../../../CLAUDE.md) at the repo root is Claude Code's project memory file. SilverKey uses it to load:

- [`AGENTS.md`](../../../AGENTS.md) — engineer quickstart (commands, gates, layout)
- **Seven always-on rules** — direct `@.cursor/rules/shared/*.mdc` includes (security, thin-app, linting, documentation, silverkey-context, code-style, env-vars-minimal)
- **Stable repo memory** — `@.cursor/memory/projectbrief.md` only

**Not loaded every session:** `techContext.md` (commands duplicate `AGENTS.md`), `activeContext.md`, `progress.md`. Read those when continuing an in-flight workstream (per [agent-memory.mdc](../../../.cursor/rules/shared/agent-memory.mdc)).

**On-demand references** (in `CLAUDE.md`, not `@`-loaded): CI gates, RESPA, OpenAPI workflow, QA test accounts.

### 2. `.claude/rules/` (path-scoped, lazy-load)

**38 scoped stubs** (no pathless always-on stubs — those duplicate `CLAUDE.md` and load twice).

```markdown
---
alwaysApply: false
paths: Client/**/*.ts, Client/**/*.tsx
---
@../../.cursor/rules/frontend/frontend-architecture.mdc
```

**Do not add pathless stubs** for the seven always-on rules — keep them only as `@` includes in `CLAUDE.md`.

Claude attaches scoped rules when working in matching paths. For tasks outside those paths, `@`-reference the stub or the canonical `.mdc` directly.

**Narrowed stubs** (avoid `**/*`):

| Stub | Paths |
| ---- | ----- |
| `shared-claude-optimization` | `.claude/**`, `documentation/reference/**`, `CLAUDE.md` |
| `shared-cursor-optimization` | `.cursor/**`, `documentation/reference/**`, `setup.md` |
| `shared-monorepo` | `Makefile`, `Client/package.json`, `scripts/ci/**`, `documentation/**/README.md` |
| `shared-agent-memory` | `.cursor/memory/**` |

### 3. Subagents (`.claude/agents/`)

Nineteen personas mirror [`.cursor/agents/`](../../../.cursor/agents/). Each stub has YAML frontmatter (`name`, `description`) and an `@` pointer to the canonical persona file.

**Default:** `silverkey-engineer` — Linear-first, RESPA-aware, MCP-backed.

Invoke by name in Claude Code or `@`-reference [`.claude/agents/silverkey-engineer.md`](../../../.claude/agents/silverkey-engineer.md).

| Category | Agents |
| -------- | ------ |
| Default | `silverkey-engineer` |
| Quality / hygiene | `react-lint-fixer`, `silverkey-linter-structure-enforcer`, `silverkey-security-secrets-scanner`, `silverkey-dead-code-sweeper`, `silverkey-error-surface-detector`, `silverkey-doc-readability-auditor`, `silverkey-test-coverage-gap-analyzer`, `silverkey-performance-regression-analyzer` |
| Architecture / refactor | `silverkey-architecture-boundary-auditor`, `silverkey-refactor-suggestion-engine`, `silverkey-file-module-reorganizer`, `silverkey-bundle-build-optimizer` |
| Component-audit remediation | `silverkey-audit-axis1-size-responsibility-fixer` through `axis5`, `silverkey-audit-architecture-remediation` |

Full inventory: [cursor-audit-latest.md](../../internal/cursor-audit-latest.md).

### 4. Skills (`.claude/skills/`)

Fourteen procedure adapters mirror [`.cursor/skills/`](../../../.cursor/skills/). Invoke when a repeatable workflow applies (lint fixes, doc placement, OpenAPI sync, etc.).

---

## MCP setup

### Daily profile

| Tool | Template | Copy target |
| ---- | -------- | ----------- |
| Claude Code | [`mcp.example.json`](../../../mcp.example.json) | gitignored `mcp.json` at repo root |
| Cursor | [`.cursor/mcp.example.json`](../../../.cursor/mcp.example.json) | gitignored `.cursor/mcp.json` |

Both include: `github`, `linear`, `slack`. Enable add-on connectors (PostHog, AWS, Mercury, Datadog, gcloud) only when the task needs them.

### Secrets and dedupe

- Keep real credentials in local `mcp.json` only — never commit tokens.
- Use **one source** per connector (project `mcp.json` or a plugin — not both for the same service).
- Prefer pinned versions for command-based MCP servers over unbounded `@latest`.

For Cursor-specific MCP (plugins in `.cursor/settings.json`), see [cursor-configuration-optimization.md](./cursor-configuration-optimization.md).

### Local permissions

`.claude/settings.local.json` (gitignored) can allow-list MCP tools for your machine. Team-shared permissions live in [`.claude/settings.json`](../../../.claude/settings.json).

---

## File exclusion (not `.cloudignore`)

Some guides reference `.cloudignore` or `.claudeignore`. **Claude Code does not use those files.** SilverKey uses two official mechanisms:

| Mechanism | Location | What it blocks |
| --------- | -------- | -------------- |
| **`permissions.deny`** | [`.claude/settings.json`](../../../.claude/settings.json) | Read, Glob, and Grep on matched paths (secrets, coverage, `mcp.json`, iOS Pods, etc.) |
| **`.gitignore`** | Repo root [`.gitignore`](../../../.gitignore) | Discovery when `respectGitignore: true` (team default) — `node_modules/`, `dist/`, `.env*`, build artifacts |

Do **not** add `.cloudignore` or `.claudeignore` to this repo. Extend `permissions.deny` for Claude-specific exclusions beyond `.gitignore`.

Verify with `/doctor` (settings parse) and by attempting to read a denied path (e.g. `Server/.env`) — should be blocked.

---

## Session and token hygiene

| Practice | SilverKey guidance |
| -------- | ------------------ |
| Fresh session per task | Start a new Claude Code session for unrelated work |
| Progressive disclosure | Rely on scoped `.claude/rules/` + skills; don't paste long guides into prompts |
| `/compact` | Manual compaction when context grows; `autoCompactEnabled: true` in team settings is a safety net |
| `/context` | Inspect top token consumers; tune `permissions.deny` if noisy dirs appear |
| `/memory` | Confirm always-on load matches `CLAUDE.md` `@` includes — no duplicate pathless stubs |
| `/init` | One-time bootstrap only — **do not re-run** over hand-curated `CLAUDE.md` |
| Semantic search MCP | Optional add-on (Code Graph, Cartographer); not required — scoped rules + GitHub MCP cover most needs |

Scoped rule: [`.claude/rules/shared-claude-optimization.md`](../../../.claude/rules/shared-claude-optimization.md) → [claude-optimization.mdc](../../../.cursor/rules/shared/claude-optimization.mdc).

---

## Memory: Claude vs Cursor

| Layer | Cursor | Claude Code |
| ----- | ------ | ----------- |
| Repo memory bank | `.cursor/memory/*.md` + `agent-memory.mdc` | `projectbrief` via `CLAUDE.md`; `activeContext` / `progress` on demand |
| Commands / versions | `AGENTS.md`, `techContext.md` | `AGENTS.md` via `CLAUDE.md` (no `techContext` every session) |
| Account memories | Cursor Settings → Memories | Claude Code user/project settings (manual) |
| Automations memory | Cursor cloud per automation | Not available — use repo memory bank |
| MCP `cursor-memory` | Optional in `.cursor/mcp.json` | Not used |

Claude gets **stable** product context every session without bloating tokens with volatile session notes or duplicate command tables.

---

## Context hygiene checklist

1. **Always-on rules** — only in `CLAUDE.md` `@` includes (seven `.mdc` files). Never pathless stubs in `.claude/rules/`.
2. **Scoped stubs** — `alwaysApply: false` + comma-separated `paths:` (single line, unquoted). Avoid `**/*` unless unavoidable.
3. **Verify** — run `/memory` in Claude Code at session start; confirm no duplicate always-on rules.
4. **On-demand** — use the table in `CLAUDE.md` for CI, RESPA, OpenAPI, QA flows.

---

## When to `@` a rule vs read the `.mdc`

| Situation | Action |
| --------- | ------ |
| Universal constraint (security, linting) | Already in `CLAUDE.md` — no extra step |
| Path-scoped work (Client TS, Server Flask, OpenAPI) | Rely on `.claude/rules/` lazy-load or `@` the stub |
| One-off deep dive (RESPA on partner code) | `@.cursor/rules/shared/respa-compliance.mdc` |
| QA flow probing | `@.claude/rules/shared-qa-test-accounts.md` |

---

## Adding or changing config

Follow [post-major-change-checklist.md](../../internal/post-major-change-checklist.md):

1. Edit `.cursor/rules/`, `.cursor/skills/`, or `.cursor/agents/`.
2. Add/update matching stubs in `.claude/rules/`, `.claude/agents/`, `.claude/skills/` (scoped only — use `alwaysApply: false` + CSV `paths:`).
3. If always-on policy changes, update `CLAUDE.md` `@` includes only (not pathless stubs).
4. If Claude session hygiene or file exclusion changes, update [`.claude/settings.json`](../../../.claude/settings.json) and [claude-optimization.mdc](../../../.cursor/rules/shared/claude-optimization.mdc).
5. Bump [cursor-audit-latest.md](../../internal/cursor-audit-latest.md).

---

## Related

- [`.claude/README.md`](../../../.claude/README.md) — adapter layout and sync steps
- [`.cursor/README.md`](../../../.cursor/README.md) — rule vs skill vs agent
- [AGENTS.md](../../../AGENTS.md) — engineer quickstart
- [cursor-configuration-optimization.md](./cursor-configuration-optimization.md) — shared MCP hygiene
