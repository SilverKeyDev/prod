# SilverKey Codex quickstart

@AGENTS.md

## Codex-specific paths

| Path | Purpose |
| ---- | ------- |
| [`.codex/`](.codex/) | Project `config.toml`, [`rules/`](.codex/rules/) adapters, and subagents (`agents/*.toml`) |
| [`.agents/skills/`](.agents/skills/) | Repo skills — canonical procedures in [`.cursor/skills/`](.cursor/skills/) |
| [`.cursor/`](.cursor/) | Canonical rules (`.mdc`), agents, skills, memory |

## Rules

Always-on and scoped constraints live in [`.cursor/rules/`](.cursor/rules/). Codex adapters: [`.codex/rules/`](.codex/rules/) (38 scoped stubs, same names as [`.claude/rules/`](.claude/rules/)) — read the matching `.mdc` or `@`-reference a stub before editing. Always-on rules load via `CLAUDE.md` only, not pathless stubs.

Also: [`.claude/`](.claude/) mirrors `.cursor/` for Claude Code. Long-form docs: [`documentation/`](documentation/).
