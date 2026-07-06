# Cursor configuration optimization

This guide keeps Cursor/Claude configuration fast, deterministic, and low-noise for daily coding in SilverKey.

## Daily MCP profile

Use a lightweight default in `.cursor/mcp.json`:

- `github`
- `linear`
- `slack`

Enable add-on connectors only when needed (Mercury, PostHog, Datadog, AWS, gcloud, cursor-memory).

## MCP dedupe rule

For any connector, use one source:

- project `.cursor/mcp.json`, or
- plugin-managed MCP

Do not enable both for the same service at the same time.

## Config hardening

- Keep real credentials in local `.cursor/mcp.json` only.
- Do not commit root `mcp.json` with secrets (use [mcp.example.json](../../../mcp.example.json) as the template).
- Prefer pinned versions for command-based MCP servers over unbounded `@latest`.
- Keep AWS defaults aligned with SilverKey region expectations unless a task requires otherwise.

## Rule payload hygiene

- Keep always-on rules short and constraint-focused.
- Move tutorials, large examples, and long checklists to `documentation/`.
- Prefer scoped rules (`alwaysApply: false` + `globs`) when guidance is path- or task-specific.

## Validation cadence

- Re-audit MCP surface and rule payload after major tooling changes.
- Update `documentation/internal/cursor-audit-latest.md` when rule/skill/agent inventory changes.
- Run `make check-docs` when adding or moving documentation.

## See also

- [Claude Code configuration](./claude-code-configuration.md) — Claude-specific entrypoint, memory, subagents, and MCP
