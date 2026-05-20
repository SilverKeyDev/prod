# SilverKey `.cursor/` directory

Human-oriented map of **Cursor** configuration: rules, skills, agents, and how to extend them without sprawl.

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
| `settings.json`        | Workspace-level Cursor settings (team-shared)                                      |
| `mcp.example.json`     | Example MCP server block — **no secrets**; copy pattern to local Cursor MCP config |

Loose notes under `.cursor/` should be rare. Prefer `documentation/` or `documentation/internal/` for human reference. Do not introduce new repo-root `docs/` for SilverKey prose — that duplicates `documentation/` and confuses agents; see `documentation.mdc` (always applied). **Rule files:** use a single path per concern (e.g. `backend-architecture.mdc` only); do not keep duplicate copies such as `backend-architecture 2.mdc` alongside the canonical name — they are redundant and inflate context.

---

## Always-on vs scoped rules

**Six rules use `alwaysApply: true`:**

1. `rules/shared/security.mdc`
2. `rules/shared/thin-app-architecture.mdc`
3. `rules/shared/linting.mdc`
4. `rules/shared/documentation.mdc` (canonical doc tree is `documentation/`, not repo-root `docs/`)
5. `rules/shared/silverkey-context.mdc` (company, RESPA reflex, partners — see [CLAUDE.md](../CLAUDE.md))
6. `rules/shared/code-style.mdc` (stack, Linear commits, verification)

**Index:** [rules/README.md](rules/README.md) lists all rules and when they attach.

Everything else attaches via **`globs`** (path patterns) or **agent-requested** / manual `@`-reference. Adding a seventh always-on rule requires team agreement and demoting or merging an existing one.

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
5. **Post–component-audit fixes:** use the `silverkey-audit-axis*` and `silverkey-audit-architecture-remediation` personas ([`documentation/client/react-component-audit-rubric.md`](../documentation/client/react-component-audit-rubric.md) — *Remediation subagents* table).

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
| **`.cursorindexingignore`** | Excludes from **automatic index** only — files can still be **`@`-mentioned** when you need them (migrations, generated blobs, large fixtures).                                                                    |

Rule of thumb: if the model never needs a path unless you explicitly attach it, prefer **indexing ignore** over full ignore.

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
| `.cursor/mcp.json`                              | Only if **no secrets** — otherwise local only |
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
- [ ] Diff `AGENTS.md` Quick start against `Client/package.json` and `./scripts/run-all-linters.sh`

---

## Related

- [AGENTS.md](../AGENTS.md) — engineer + agent orientation
- [documentation/README.md](../documentation/README.md) — docs index
