# SilverKey Claude Code Memory

@AGENTS.md

@.cursor/rules/shared/security.mdc
@.cursor/rules/shared/thin-app-architecture.mdc
@.cursor/rules/shared/linting.mdc
@.cursor/rules/shared/documentation.mdc
@.cursor/rules/shared/silverkey-context.mdc
@.cursor/rules/shared/code-style.mdc
@.cursor/rules/shared/env-vars-minimal.mdc

@.cursor/memory/projectbrief.md

When continuing an in-flight workstream, read `.cursor/memory/activeContext.md` and `.cursor/memory/progress.md` (see `.cursor/rules/shared/agent-memory.mdc`).

## Claude-specific paths

| Path | Purpose |
| ---- | ------- |
| [`.claude/rules/`](.claude/rules/) | Scoped rule adapters → [`.cursor/rules/`](.cursor/rules/) (lazy-load; always-on rules live here in `@` includes only) |
| [`.claude/agents/`](.claude/agents/) | Subagent personas (default: `silverkey-engineer`) |
| [`.claude/skills/`](.claude/skills/) | Procedure adapters → [`.cursor/skills/`](.cursor/skills/) |
| [`.claude/settings.json`](.claude/settings.json) | Team permissions config |
| [`mcp.example.json`](mcp.example.json) | Claude daily MCP — copy to gitignored `mcp.json` at repo root |
| [`.cursor/mcp.example.json`](.cursor/mcp.example.json) | Cursor daily MCP — copy to gitignored `.cursor/mcp.json` |

Full guide: [documentation/client/tooling/claude-code-configuration.md](documentation/client/tooling/claude-code-configuration.md).

## Default persona and MCP

- **Default subagent:** [`.claude/agents/silverkey-engineer.md`](.claude/agents/silverkey-engineer.md) (Linear-first, RESPA-aware, MCP-backed).
- **Daily MCP:** `github`, `linear`, `slack` from [`mcp.example.json`](mcp.example.json). Enable add-ons (PostHog, AWS, Mercury, etc.) only when the task needs them — same dedupe policy as [cursor-configuration-optimization.md](documentation/client/tooling/cursor-configuration-optimization.md).
- **Edit `.cursor/` first;** sync [`.claude/`](.claude/) stubs when rules, agents, or skills change (see [`.claude/README.md`](.claude/README.md)).

## On-demand context (not loaded every session)

| Task | Reference |
| ---- | --------- |
| Continue workstream | `@.cursor/memory/activeContext.md`, `@.cursor/memory/progress.md` |
| CI / PR gates | `@.cursor/rules/shared/ci-gates.mdc` |
| Partner / RESPA | `@.cursor/rules/shared/respa-compliance.mdc` |
| OpenAPI contract | `@.cursor/rules/shared/openapi-workflow.mdc` |
| QA persona flows | `@.claude/rules/shared-qa-test-accounts.md` |
