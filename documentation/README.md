# SilverKey documentation

Canonical docs live here. One place for project documentation; no scattered long-form docs elsewhere.

## Layout

- **`documentation/`** — This folder. Index and how we document.
- **`documentation/client/`** — Frontend (Client monorepo): architecture, platform, standards, tooling, patterns, features, and QA. See [client/README.md](./client/README.md).
- **`documentation/server/`** — Backend (Server): structure, APIs, and server-specific docs.

## Quick links

| Topic | Location |
|-------|----------|
| Agent quickstart (AI assistants) | [AGENTS.md](../AGENTS.md) (repo root) |
| Local machine setup | [setup.md](../setup.md) (repo root) |
| How we do documentation | [HOW_WE_DOCUMENT.md](./HOW_WE_DOCUMENT.md) |
| Client docs index | [client/README.md](./client/README.md) |
| Server docs index | [server/README.md](./server/README.md) |
| OpenAPI workflow | [server/openapi-workflow.md](./server/openapi-workflow.md) |
| Planned product work | [Linear](https://linear.app/silverkey/team/SIL/all) (SilverKey team) — not tracked in repo markdown |
| Checklist-driven transactions (spec) | [transactions/](./transactions/) |
| Reels for Homes | [reels/](./reels/) |
| Cursor / AI config audit (inventory table) | [internal/cursor-audit-latest.md](./internal/cursor-audit-latest.md) |
| Compliance index | [compliance/README.md](./compliance/README.md) |
| Security policy | [security/README.md](./security/README.md) |
| Server ops (Postgres, Redis) | [server/ops/postgres.md](./server/ops/postgres.md) |
| After major architecture: docs + Cursor sync | [internal/post-major-change-checklist.md](./internal/post-major-change-checklist.md) |
| Docs + Cursor after major changes | [`.cursor/skills/post-major-change-sync/SKILL.md`](../.cursor/skills/post-major-change-sync/SKILL.md), [internal/post-major-change-checklist.md](./internal/post-major-change-checklist.md) |
| Frontend layer reorg checklist | [internal/component-audit/frontend-reorganization-audit.md](./internal/component-audit/frontend-reorganization-audit.md) |
| Legacy Cursor notes (forms / OpenAPI adoption logs) | [dev/cursor-legacy/](./dev/cursor-legacy/) |

## In-repo references

- **Client:** `documentation/client/standards/LINTING.md` and `Client/packages/*/README.md` stay in place as lightweight, local references. Architecture and platform rules live in `.cursor/rules/frontend/`. Long-form and cross-cutting docs live here under `documentation/client/`.
- **Cursor rules:** `.cursor/rules/` — architecture and lint rules; they reference docs here where relevant.
