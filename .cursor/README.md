# SilverKey `.cursor/` directory

Human-oriented map of **Cursor** configuration: rules, skills, agents, and how to extend them without sprawl. This tree is **canonical**; Claude Code uses thin adapters:

- **[`.claude/`](../.claude/)** — Claude Code (`@` stubs to `.cursor/`)

**Audit / inventory:** [documentation/internal/cursor-audit-latest.md](../documentation/internal/cursor-audit-latest.md)

---

## What lives where

| Folder / file          | Purpose                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `rules/shared/*.mdc`   | Cross-cutting constraints (security, OpenAPI, monorepo, logging, …)                |
| `rules/frontend/*.mdc` | Client/React/RN architecture, UI, hooks, state                                     |
| `rules/backend/*.mdc`  | Flask/SQLAlchemy/model constraints                                                 |
| `skills/*/SKILL.md`    | **Procedures** — multi-step workflows agents follow when invoked                   |
| `agents/*.md`          | **Subagent personas** — specialized prompts (lint, security, architecture, …)      |
| `memory/*.md`          | **Session memory bank** — active context + progress (team git); see `agent-memory.mdc` |
| `settings.json`        | Workspace-level Cursor settings (team-shared)                                      |
| `mcp.example.json`     | Example MCP server block — **no secrets**; copy pattern to local `.cursor/mcp.json` |

Loose notes under `.cursor/` should be rare. Prefer `documentation/` or `documentation/internal/` for human reference. Do not introduce new repo-root `docs/` for SilverKey prose — that duplicates `documentation/` and confuses agents; see `documentation.mdc` (always applied). **Rule files:** use a single path per concern (e.g. `backend-architecture.mdc` only); do not keep duplicate copies such as `backend-architecture 2.mdc` alongside the canonical name — they are redundant and inflate context.

---

## Documentation placement

- **Canonical tree:** `documentation/` only for long-form SilverKey prose.
- **Forbidden:** repo-root `docs/` (CI fails if it exists).
- **Checks:** `make check-docs` or `./scripts/ci/check-doc-placement.sh` + `./scripts/ci/check-doc-links.sh`.
- **Skill:** [skills/documentation-placement/SKILL.md](skills/documentation-placement/SKILL.md).

---

## Always-on vs scoped rules

**Seven rules use `alwaysApply: true`:**

1. `rules/shared/security.mdc`
2. `rules/shared/thin-app-architecture.mdc`
3. `rules/shared/linting.mdc`
4. `rules/shared/documentation.mdc` (canonical doc tree is `documentation/`, not repo-root `docs/`)
5. `rules/shared/silverkey-context.mdc` (company, RESPA reflex, partners; investor language in `pitch-and-fundraising.mdc`)
6. `rules/shared/code-style.mdc` (stack, Linear commits, verification)
7. `rules/shared/env-vars-minimal.mdc` (do not add `.env` keys unless a new integration requires it)

**Index:** [rules/README.md](rules/README.md) lists all rules and when they attach.

Everything else attaches via **`globs`** (path patterns) or **agent-requested** / manual `@`-reference. New always-on rules should stay short; prefer scoped `globs` for deep detail.

---

## New rule (`.mdc`) — frontmatter template

````yaml
---
description: One line — when this rule should attach
globs:
  - "Client/packages/**/*.{ts,tsx}"
alwaysApply: false
---

# Title

Short body. Link to `documentation/**` for long prose.

## Example

```ts
// ✅ DO
// ❌ DON'T
````

````

**Requirements:** One concern per file; include at least one **good/bad** example; prefer **&lt; ~150 lines** in the rule — move depth to `documentation/`.

---

## New skill

1. Create `.cursor/skills/<skill-name>/SKILL.md`.
2. Start with **when to use** (1–3 sentences).
3. **Ordered steps**, concrete commands/paths for this repo.
4. At least one **example** (input → output or before/after).

---

## New agent

1. Add `.cursor/agents/<name>.md`.
2. **Distinct role** from the default agent (otherwise don’t add).
3. Keep **&lt; ~500 lines**; link to rules/skills this agent must follow.
4. Team policy: **commit** shared agents; don’t commit personal experiments (or use a separate branch).
5. **Post–component-audit fixes:** use the `silverkey-audit-axis*` and `silverkey-audit-architecture-remediation` personas ([`documentation/architecture/patterns/react-component-audit-rubric.md`](../documentation/architecture/patterns/react-component-audit-rubric.md) — *Remediation subagents* table).
6. **Docs / reorg hygiene:** use skills [`documentation-placement`](skills/documentation-placement/SKILL.md) and [`post-major-change-sync`](skills/post-major-change-sync/SKILL.md) with [`documentation/internal/post-major-change-checklist.md`](../documentation/internal/post-major-change-checklist.md). Optional checklist: [`frontend-reorganization-audit.md`](../documentation/internal/component-audit/frontend-reorganization-audit.md). Do **not** add per-domain `silverkey-docs-*` or `silverkey-*-reorg-*` fleet agents — they were removed as low-signal context bloat.

---

## After major feature or architecture work

Cross-cutting changes (route shells, workspace/auth, OpenAPI contracts, monorepo boundaries, new global lint rules) should ship with **docs and Cursor updates**, not only code.

1. Follow **[documentation/internal/post-major-change-checklist.md](../documentation/internal/post-major-change-checklist.md)**.
2. Scoped rule **`rules/shared/post-major-change-sync.mdc`** (attaches under `Client/apps`, `Client/packages`, `openapi`, `Server/app`) and skill **`skills/post-major-change-sync/SKILL.md`** keep agents aligned with the same checklist.
3. Refresh **[documentation/internal/cursor-audit-latest.md](../documentation/internal/cursor-audit-latest.md)** when rules, skills, or agents are added, removed, or renamed.

---

## Rule vs skill vs agent

| Type | Use when | Context |
| ---- | -------- | ------- |
| **Rule (`.mdc`)** | Passive **always/never** or **pattern** constraints | Injected by glob or always-on |
| **Skill (`SKILL.md`)** | **Repeatable workflow** (“fix imports”, “run all linters”) | Loaded when the skill applies |
| **Agent (`.md`)** | **Dedicated persona** for a subagent task | Explicitly launched |

**Heuristic:** constraint → rule; procedure → skill; persona → agent.

```mermaid
flowchart TD
  start[Need_new_guidance]
  start --> q1{Passive_constraint?}
  q1 -->|yes_glob_or_sparse_always| rule[Rule_mdc]
  start --> q2{Multi_step_procedure?}
  q2 -->|yes| skill[Skill_SKILLmd]
  start --> q3{Distinct_subagent?}
  q3 -->|yes| agent[Agent_md]
````

---

## `.cursorignore` vs `.cursorindexingignore`

| File                        | Effect                                                                                                                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`.cursorignore`**         | Excludes paths from **indexing and default AI context** (noise, secrets, huge trees). Copy from `.cursorignore.example` → `.cursorignore` locally if you want team defaults without committing personal overrides. |
| **`.cursorindexingignore`** | Excludes from **automatic index** only — files can still be **`@`-mentioned** when you need them (migrations, generated blobs, large fixtures). Includes **`.claude/`** adapter stubs so Cursor does not index duplicate content alongside canonical `.cursor/` files. |

Rule of thumb: if the model never needs a path unless you explicitly attach it, prefer **indexing ignore** over full ignore.

---

## MCP profiles and dedupe

- Keep **daily MCP profile** lightweight (`github`, `linear`, `slack`) unless the task needs more.
- Add optional connectors (AWS, PostHog, Datadog, Mercury, gcloud, cursor-memory) only for scoped sessions.
- Avoid duplicate connectors across project MCP and plugins (for example, do not enable both plugin Linear and project Linear simultaneously).
- Keep secrets in local `.cursor/mcp.json` only; never commit real tokens.

---

## Commit vs ignore (team policy)

| Path                                            | Commit?                                       |
| ----------------------------------------------- | --------------------------------------------- |
| `.cursor/rules/**`                              | Yes                                           |
| `.cursor/skills/**`                             | Yes                                           |
| `.cursor/agents/**`                             | Yes (team agents)                             |
| `.cursor/README.md`                             | Yes                                           |
| `.cursor/rules/README.md`                       | Yes                                           |
| `CLAUDE.md` (repo root)                         | Yes                                           |
| `.cursor/settings.json`                         | Yes                                           |
| `.cursor/mcp.example.json`                      | Yes                                           |
| `.cursor/mcp.json`, repo-root `mcp.json`        | No — gitignored; copy from `*mcp.example.json` |
| `.cursorignore.example`                         | Yes                                           |
| `.cursorindexingignore`                         | Yes                                           |
| `.cursorignore`                                 | Optional local (often gitignored)             |
| `AGENTS.md`                                     | Yes                                           |
| `documentation/internal/cursor-audit-latest.md` | Yes (update when inventory changes)           |
| `documentation/internal/post-major-change-checklist.md` | Yes (process doc; update when the bar for “major change” evolves) |
| `.cursor/projects/**`, local logs               | No                                            |

---

## Quarterly review (lightweight)

- [ ] Skim `rules/**` — stale globs, contradictions, oversized files?
- [ ] Skim `skills/**` — triggers still accurate? unused skills?
- [ ] `.cursorignore.example` / `.cursorindexingignore` — new build outputs or huge dirs?
- [ ] MCP servers in use still valid?
- [ ] Diff `AGENTS.md` Quick start against `Client/package.json` and `./scripts/ci/run-all-linters.sh`

---

## Agent memory (four layers)

Full setup: [documentation/guides/tooling/cursor-agent-memory.md](../documentation/guides/tooling/cursor-agent-memory.md).

| Layer | Where |
| ----- | ----- |
| Repo bank | `.cursor/memory/` + rule `rules/shared/agent-memory.mdc` |
| Cursor account | Settings → Memories |
| Automations | Tools → Memories → **Manage** (Memory Notes); seeds in `.cursor/memory/automations/` |
| MCP | `cursor-memory` in local `.cursor/mcp.json` (optional add-on; not in default `mcp.example.json`) |

Print paste bundle: `./scripts/print-automation-memory.sh <persona>` (e.g. `engineer-default`, `ci-pr-babysit`).

---

## Related

- [AGENTS.md](../AGENTS.md) — engineer + agent orientation
- [documentation/README.md](../documentation/README.md) — docs index
