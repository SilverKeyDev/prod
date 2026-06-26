# Checklist: after a major feature or architecture change

Use this when shipping **cross-cutting** work (routing shells, workspace/auth model, OpenAPI contracts, monorepo boundaries, new quality gates). Goal: humans and Cursor agents read the same source of truth as the code.

## Documentation (`documentation/`)

- [ ] **New or changed behavior** is described under `documentation/client/` or `documentation/server/` (not repo-root `docs/` for cross-cutting product/architecture prose — see `.cursor/rules/shared/documentation.mdc`).
- [ ] **Folder README** — If you added a new long-form doc, add a row to the relevant subfolder README (`documentation/client/<area>/README.md`) and `documentation/client/README.md`, or `documentation/server/README.md`.
- [ ] **Links** — Fix broken relative links from READMEs, rules, and other docs.
- [ ] **Feature copy** — If you added `t("feature.*")` keys, follow `.cursor/skills/feature-translations/SKILL.md` (typed feature translation maps + aggregator).

## Cursor rules (`.cursor/rules/`)

- [ ] **Constraint or pattern changed?** Update the relevant `.mdc` (prefer editing one rule per concern over duplicating guidance).
- [ ] **New concern?** Add a **scoped** rule (`alwaysApply: false` + `globs`) unless you are explicitly replacing one of the seven always-on rules (security, thin-app, linting, documentation, silverkey-context, code-style, env-vars-minimal — cap is **7**; see `.cursor/README.md`).
- [ ] **Codex / Claude rule adapters** — When adding or renaming a rule, add matching stubs under `.codex/rules/` and `.claude/rules/` (see [`.codex/rules/README.md`](../../.codex/rules/README.md)).
- [ ] **Keep rules short** — Deep examples and tables live under `documentation/`; rules link out.

## Cursor skills and agents

- [ ] **Repeatable workflow** (e.g. “how we regen OpenAPI types”) — Add or update `.cursor/skills/<name>/SKILL.md` with steps and commands for *this* repo.
- [ ] **Dedicated subagent persona** — Add or update `.cursor/agents/<name>.md` only when the role is distinct from the default agent.
- [ ] **Codex adapters** — When skills or agents change, update matching `.agents/skills/<name>/SKILL.md` and `.codex/agents/<name>.toml` stubs (see [`.codex/README.md`](../../.codex/README.md)).
- [ ] **Claude adapters** — When skills or agents change, update matching `.claude/skills/<name>/SKILL.md` and `.claude/agents/<name>.md` stubs (see [`.claude/README.md`](../../.claude/README.md)).

## Repo entrypoints

- [ ] **`AGENTS.md`** — Update when quickstart, directory map, or AI tooling table materially changes.
- [ ] **`CLAUDE.md`** — Update when always-on rule includes, stable memory wiring, or Claude entrypoint paths change.
- [ ] **`.cursor/README.md`** — Update when extension process, always-on rule policy, or rule/skill/agent layout changes.
- [ ] **`.claude/README.md`** — Update when Claude adapter layout or sync process changes.
- [ ] **Claude tooling doc** — Update [documentation/client/tooling/claude-code-configuration.md](../client/tooling/claude-code-configuration.md) when Claude-specific setup materially changes.

## Inventory

- [ ] **`documentation/internal/cursor-audit-latest.md`** — Bump “Last regenerated” and update the rules/skills/agents tables when `.cursor/` files change.

## OpenAPI / types

- [ ] **Spec + codegen** — Edit `openapi/` and run Client + Server generators per `.cursor/rules/shared/openapi-workflow.mdc` (do not hand-edit `api.generated.ts` / `generated.py`).

## Verification

- [ ] **Quality gates** — `pnpm check` (Client) and/or `./scripts/ci/run-all-linters.sh` as appropriate before merge.
- [ ] **Documentation** — `make check-docs` when adding or moving markdown (`scripts/ci/check-doc-placement.sh`, `scripts/ci/check-doc-links.sh`).

## Related docs

- [Workspace-first client architecture](../client/architecture/workspace-first-architecture.md) — example of architecture prose living under `documentation/client/`.
- [How we document](../HOW_WE_DOCUMENT.md) — canonical tree and README policy.
- [Cursor meta: `.cursor/README.md`](../../.cursor/README.md) — rule vs skill vs agent.
