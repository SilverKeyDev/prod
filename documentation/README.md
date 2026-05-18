# SilverKey documentation

Canonical docs live here. One place for project documentation; no scattered long-form docs elsewhere.

## Layout

- **`documentation/`** — This folder. Index and how we document.
- **`documentation/client/`** — Frontend (Client monorepo): architecture, packages, lint, platform (web vs React Native).
- **`documentation/server/`** — Backend (Server): structure, APIs, and server-specific docs.

## Quick links

| Topic | Location |
|-------|----------|
| Agent quickstart (AI assistants) | [AGENTS.md](../AGENTS.md) (repo root) |
| How we do documentation | [HOW_WE_DOCUMENT.md](./HOW_WE_DOCUMENT.md) |
| Client docs index | [client/README.md](./client/README.md) |
| Server docs index | [server/README.md](./server/README.md) |
| OpenAPI Type Migration | [../OPENAPI_MIGRATION.md](../OPENAPI_MIGRATION.md) |
| To implement soon: Notifications | [to-implement-soon/notifications/](./to-implement-soon/notifications/) |
| To implement soon: Broker team dashboard | [to-implement-soon/broker-workspace/01-broker-team-dashboard.md](./to-implement-soon/broker-workspace/01-broker-team-dashboard.md) |
| Reels for Homes | [reels/](./reels/) |
| Cursor / AI config audit (inventory table) | [internal/cursor-audit-latest.md](./internal/cursor-audit-latest.md) |
| After major architecture: docs + Cursor sync | [internal/post-major-change-checklist.md](./internal/post-major-change-checklist.md) |
| Legacy Cursor notes (forms / OpenAPI adoption logs) | [dev/cursor-legacy/](./dev/cursor-legacy/) |

## In-repo references

- **Client:** `documentation/client/LINTING.md` and `Client/packages/*/README.md` stay in place as lightweight, local references. Architecture and platform rules live in `.cursor/rules/frontend/`. Long-form and cross-cutting docs live here under `documentation/client/`.
- **Cursor rules:** `.cursor/rules/` — architecture and lint rules; they reference docs here where relevant.
