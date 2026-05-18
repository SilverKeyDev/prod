# SilverKey — Agent and engineer quickstart

**What this is:** A monorepo for SilverKey: **React web** + **React Native** (`Client/`), **Flask/Python API** (`Server/`), and **OpenAPI** as the API contract (`openapi/`). Business logic and UI live primarily under `Client/packages/`; `Client/apps/*` are thin composition layers.

**What this is not:** A single-page app with ad-hoc server logic in the web bundle—layering and generated types are enforced.

---

## Quick start (copy-paste)

**Prerequisites:** Node 20+, `pnpm` 9+, Python 3.x (see Server docs), PostgreSQL and env files as in `Server/.env.example`.

**Local bootstrap:** `./scripts/setup-local.sh` (first machine), `./scripts/refresh.sh` (after `git pull`), `make help` — see root [README.md](README.md).

```bash
# Client — from Client/
pnpm install
pnpm dev:web              # Vite web app
pnpm dev:mobile           # Expo / RN

# Client quality gates
pnpm typecheck && pnpm lint && pnpm lint:cycles && pnpm format:check
pnpm check                # Full client check (includes build:web) — see Client/package.json

# Repo-wide linters
./scripts/run-all-linters.sh client
./scripts/run-all-linters.sh server
./scripts/run-all-linters.sh all
```

**Cursor indexing:** Copy [.cursorignore.example](./.cursorignore.example) to `.cursorignore` at the repo root (local file; reduces noise). Optional: tune [.cursorindexingignore](./.cursorindexingignore).

---

## Architecture (short)

Thin **`Client/apps/*`** host routing, providers, and page shells. **Features, hooks, UI primitives, and API wrappers** live under **`Client/packages/`** (`features/`, `hooks/`, `ui/`, `config/api/`, etc.). **`Server/`** exposes HTTP APIs documented in **`openapi/`**; client and server types are generated from that spec. Details: [Client/ARCHITECTURE.md](./Client/ARCHITECTURE.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [documentation/client/thin-app-architecture.md](./documentation/client/thin-app-architecture.md).

### Documentation map (canonical vs server index)

- **`documentation/`** — Canonical long-form guides: product flows ([documentation/transactions/README.md](./documentation/transactions/README.md)), client/server architecture, compliance, QA runbooks. Start at [documentation/README.md](./documentation/README.md).
- **`docs/`** — Curated **server/operations** tree (Flask, Celery, Redis, Postgres stubs, runbooks, refactor backlogs). It **links into** `documentation/server/` for depth; see [`docs/README.md`](./docs/README.md). Prefer **`documentation/`** for new cross-cutting or product prose (see `.cursor/rules/shared/documentation.mdc`).

---

## Top-level directory map

| Path              | Purpose                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `Client/`         | Frontend monorepo (pnpm workspaces): web + mobile apps + shared packages                        |
| `Server/`         | Python/Flask API, services, tests                                                               |
| `openapi/`        | OpenAPI 3.1 sources; single contract for types                                                  |
| `documentation/`  | Human-facing docs index and long-form guides                                                    |
| `docs/`           | Server/ops index and stubs (links into `documentation/server/`) — see [docs/README.md](./docs/README.md) |
| `.cursor/`        | Cursor rules (`.mdc`), skills, agent definitions — see [.cursor/README.md](./.cursor/README.md) |
| `.github/`        | CI workflows, templates                                                                         |
| `scripts/`        | Repo-wide lint/driver scripts                                                                   |

---

## Conventions (pointers)

- **Imports and layers:** [.cursor/rules/frontend/frontend-architecture.mdc](./.cursor/rules/frontend/frontend-architecture.mdc) + [documentation/client/layered-architecture-imports.md](./documentation/client/layered-architecture-imports.md)
- **UI components:** [documentation/client/LINTING.md](./documentation/client/LINTING.md), `.cursor/rules/frontend/ui-components.mdc`
- **Documentation locations:** `documentation/HOW_WE_DOCUMENT.md`
- **Commit / review:** Conventional clarity; CI must stay green (`pnpm check`, server linters)

---

## AI tooling in this repo

| Area                          | Location                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| **Always-on constraints (4)** | `.cursor/rules/shared/security.mdc`, `thin-app-architecture.mdc`, `linting.mdc`, `documentation.mdc` |
| **Scoped rules**              | `.cursor/rules/shared/`, `frontend/`, `backend/` — attach by glob                                |
| **Procedural workflows**      | `.cursor/skills/*/SKILL.md`                                                                      |
| **Post–major change sync**    | `.cursor/skills/post-major-change-sync/SKILL.md` + scoped rule `.cursor/rules/shared/post-major-change-sync.mdc` |
| **Subagent personas**         | `.cursor/agents/*.md`                                                                            |
| **Meta: how to extend**       | [.cursor/README.md](./.cursor/README.md)                                                         |
| **Inventory / audit table**   | [documentation/internal/cursor-audit-latest.md](./documentation/internal/cursor-audit-latest.md) |

**MCP:** Example shape (no secrets) in [.cursor/mcp.example.json](./.cursor/mcp.example.json); real credentials stay local or in env vars.

---

## Gotchas

- **Do not edit** `Client/packages/types/api.generated.ts` or `Server/app/schemas/generated.py` by hand — change **`openapi/`** and regenerate (see `.cursor/rules/shared/openapi-workflow.mdc`).
- **DB migrations:** Do not run or author Alembic migrations unless explicitly directed; model-only constraints in `.cursor/rules/backend/database.mdc`.
- **Tokens:** Client uses memory + `sessionStorage` for tokens — not `localStorage` (security rule).
- **Markdown creation:** Follow `.cursor/rules/shared/documentation.mdc` (allowed team paths include `AGENTS.md`, `.cursor/README.md`, `documentation/internal/**`).
- **Major architecture / feature work:** Update canonical docs and Cursor config per [documentation/internal/post-major-change-checklist.md](./documentation/internal/post-major-change-checklist.md) (same PR or fast-follow).

---

## Server / API

Index: [documentation/server/README.md](./documentation/server/README.md). OpenAPI workflow: `.cursor/rules/shared/openapi-workflow.mdc`.

**Backend refactor checklist:** Run `python3 Server/scripts/lint/lint_circular_imports.py`; targeted `pytest`; if HTTP shapes change, update OpenAPI and contract tests (`Server/tests/contract/test_openapi_contracts.py` where applicable).

---

## Checks summary

| Scope       | Command                                                                             |
| ----------- | ----------------------------------------------------------------------------------- |
| Client      | `cd Client && pnpm typecheck && pnpm lint && pnpm lint:cycles && pnpm format:check` |
| Client full | `cd Client && pnpm check`                                                           |
| Repo-wide   | `./scripts/run-all-linters.sh all`                                                  |
| OpenAPI sync | `make openapi` then commit generated files; `make openapi-verify` before PR        |
