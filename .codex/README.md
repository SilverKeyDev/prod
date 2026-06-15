# SilverKey `.codex/` directory

Codex-specific project configuration. **Canonical** rules, skills, and agent personas live in [`.cursor/`](../.cursor/); this tree is an adapter for [OpenAI Codex](https://developers.openai.com/codex/concepts/customization).

**Inventory:** [documentation/internal/cursor-audit-latest.md](../documentation/internal/cursor-audit-latest.md) (Cursor + Codex adapter tables).

**Quickstart:** [CODEX.md](../CODEX.md) and [AGENTS.md](../AGENTS.md).

---

## What lives where

| Path | Purpose |
| ---- | ------- |
| `config.toml` | Project-scoped Codex settings (requires **trusted** repo) |
| `rules/*.md` | Rule adapters — `@` pointers to `.cursor/rules/**/*.mdc` (same layout as `.claude/rules/`) |
| `agents/*.toml` | Custom subagents — `developer_instructions` point at `.cursor/agents/*.md` |
| [`.agents/skills/`](../.agents/skills/) | Repo skills (Codex discovery path); bodies in `.cursor/skills/` |

Also mirrored for Claude Code: [`.claude/`](../.claude/) (`@` stubs to `.cursor/`).

---

## When you change `.cursor/`

1. Edit rules, skills, or agents under **`.cursor/`** first.
2. If you add/rename a rule, add/update matching **`rules/<flat-name>.md`** here and **`.claude/rules/`**.
3. If you add/rename an agent, add/update matching **`agents/<name>.toml`** here.
4. If you add/rename a skill, add/update **`../.agents/skills/<name>/SKILL.md`**.
5. Bump **cursor-audit-latest.md** when the inventory changes materially.

Do not duplicate long persona or procedure text in TOML — keep a single source in `.cursor/`.

---

## Related

- [`.cursor/README.md`](../.cursor/README.md) — rule vs skill vs agent
- [documentation/internal/post-major-change-checklist.md](../documentation/internal/post-major-change-checklist.md)
