# SilverKey `.claude/` directory

Claude Code project configuration. **Canonical** rules, skills, and agent personas live in [`.cursor/`](../.cursor/); this tree is an adapter for [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

**Inventory:** [documentation/internal/cursor-audit-latest.md](../documentation/internal/cursor-audit-latest.md) (Cursor + Claude adapter tables).

**Quickstart:** [CLAUDE.md](../CLAUDE.md) and [AGENTS.md](../AGENTS.md).

**Tooling guide:** [documentation/client/tooling/claude-code-configuration.md](../documentation/client/tooling/claude-code-configuration.md).

---

## What lives where

| Path | Purpose |
| ---- | ------- |
| `rules/*.md` | Rule adapters — `@` pointers to `.cursor/rules/**/*.mdc` |
| `agents/*.md` | Custom subagents — YAML frontmatter + `@` pointer to `.cursor/agents/*.md` |
| `skills/*/SKILL.md` | Procedure adapters — `@` pointer to `.cursor/skills/<name>/SKILL.md` |
| `settings.json` | Team-shared Claude Code permissions config |
| `settings.local.json` | Local MCP tool allow-list (gitignored globally — not committed) |

---

## When you change `.cursor/`

1. Edit rules, skills, or agents under **`.cursor/`** first.
2. If you add/rename a **scoped** rule, add/update matching **`rules/<flat-name>.md`** here with `alwaysApply: false` + CSV `paths:` (see [rules/README.md](rules/README.md)). **Never add pathless stubs** for the seven always-on rules — those load only via `CLAUDE.md` `@` includes.
3. If you add/rename an agent, add/update matching **`agents/<name>.md`** here.
4. If you add/rename a skill, add/update **`skills/<name>/SKILL.md`** here.
5. Bump **[cursor-audit-latest.md](../documentation/internal/cursor-audit-latest.md)** when the inventory changes materially.

Do not duplicate long persona or procedure text in stubs — keep a single source in `.cursor/`.

---

## Indexing

`.claude/` is excluded from Cursor's automatic index via [`.cursorindexingignore`](../.cursorindexingignore). Stubs remain manually `@`-mentionable; canonical content lives in `.cursor/`.

---

## Related

- [`.cursor/README.md`](../.cursor/README.md) — rule vs skill vs agent
- [documentation/internal/post-major-change-checklist.md](../documentation/internal/post-major-change-checklist.md)
