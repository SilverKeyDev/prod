---
name: post-major-change-sync
description: After a major feature or architecture change, update canonical documentation under documentation/, Cursor rules (.mdc), skills, and the cursor audit inventory. Use when the user ships cross-cutting routing, workspace/auth, OpenAPI, or monorepo structure changes and must keep agents and humans aligned.
---

# Post–major change: documentation and Cursor sync

## When to use

- Routing shells, workspace model, or navigation contracts changed on web/mobile.
- OpenAPI / generated types changed.
- New ESLint or package-structure rules, or new always-on / scoped Cursor rules.
- User explicitly asks to “update docs and Cursor rules after this architecture change.”

## Steps

1. Read **[documentation/internal/post-major-change-checklist.md](../../../documentation/internal/post-major-change-checklist.md)** and work through every section that applies.
2. Put **long-form** explanation in **`documentation/client/`** or **`documentation/server/`**; add a row to that folder’s **`README.md`** if the doc is new.
3. Update **`.cursor/rules/`** only where the constraint or pattern actually changed; prefer **scoped** rules (`alwaysApply: false` + `globs`). Do not increase always-on rule count without replacing an existing always-on rule — see **[`.cursor/README.md`](../../README.md)**.
4. Add or update **`.cursor/skills/*/SKILL.md`** when there is a new **repeatable procedure** for this repo.
5. Sync **`.claude/rules/`** and **`.codex/rules/`** stubs when `.mdc` rules are added or renamed; update **`.claude/settings.json`** when Claude file-exclusion or session defaults change; update **`.claude/README.md`** if the adapter process changes.
6. Update **`documentation/internal/cursor-audit-latest.md`** when rules, skills, or agents are added, removed, or renamed (bump “Last regenerated” and tables).
7. If onboarding or the AI tooling map changed, update **[`AGENTS.md`](../../../AGENTS.md)**, **[`CLAUDE.md`](../../../CLAUDE.md)**, and/or **[`.cursor/README.md`](../../README.md)**.

## Commands (verification)

From `Client/` after client-affecting changes:

```bash
pnpm typecheck && pnpm lint
```

Repo-wide when appropriate:

```bash
./scripts/ci/run-all-linters.sh client
```

OpenAPI edits: follow **`.cursor/rules/shared/openapi-workflow.mdc`** (regenerate TS + Pydantic; never hand-edit generated contract files).
