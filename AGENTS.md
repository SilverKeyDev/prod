# SilverKey — Agent and engineer quickstart

**What this is:** Monorepo — **React web** + **React Native** (`Client/`), **Flask API** (`Server/`), **OpenAPI** contract (`openapi/`). Product logic in **`Client/packages/`**; **`Client/apps/*`** are thin shells only.

**What this is not:** Ad-hoc server logic in the web bundle — layering and generated types are enforced.

---

## Prerequisites

| Tool | Version / notes |
| ---- | ---------------- |
| **Node.js** | **20–22** locally (prefer `nvm use` → **22** per [`.nvmrc`](.nvmrc); CI lint uses **22**) |
| **pnpm** | **9.x** — [`Client/package.json`](Client/package.json) (`packageManager`) |
| **Python** | **3.10–3.13** (prefer **3.12**) — [`Server/README.md`](Server/README.md) |
| **Redis** | Celery/cache; `make setup` warns if unreachable; `make setup-dev` requires it |
| **libmagic** | Secure uploads; macOS: `brew install libmagic` |
| **Docker** | Local Postgres via `make db-up`; initialized by `make setup-dev` |
| **AWS CLI** | Secrets → `Server/.env`; use `make setup-dev` when you have AWS access |

**First machine:** `make setup` then `make setup-dev` for full stack ([setup.md](setup.md)). **After pull:** `make refresh`.

---

## Makefile & checks

Run `make help`. Common targets:

| Target | Purpose |
| ------ | ------- |
| `make setup` / `make setup-dev` / `make refresh` | Core env / backend env / post-pull refresh |
| `make dev-db-init` | Reset local Postgres, refresh non-DB secrets, run migrations |
| `make dev` / `make dev-web` / `make mobile` | Full stack / web only / Expo |
| `make dev-backend` | Backend only |
| `make lint` | `./scripts/ci/run-all-linters.sh all` |
| `make lint-client` / `make lint-server` | Scoped linters |
| `make typecheck` / `make check-client` | Client typecheck / full `pnpm check` |
| `make does-it-run` | CI smoke gate locally (frontend + backend-light; `DOES_IT_RUN_MODE=docker` for full Docker) |
| `make test` / `make test-fe` / `make test-be` | Vitest + pytest |
| `make openapi` / `make openapi-verify` | Regenerate types; PR drift gate |
| `make check-docs` | Doc placement + link checks |

**Client** (from `Client/`): `pnpm dev:web`, `pnpm dev:mobile`, `pnpm test:run`, `pnpm check`.

**Server:** activate `Server/.venv`, then `pytest` or `make test-be`.

**Cursor indexing:** [.cursorignore.example](./.cursorignore.example) → `.cursorignore` (gitignored).

---

## Architecture (short)

- **Thin apps:** `Client/apps/web`, `Client/apps/mobile` — routing, providers, composition.
- **Fat packages:** `Client/packages/` — features, hooks, ui, config, services, store.
- **Workspaces:** Buyer/seller/brokerage state in **`packages/`** — [workspace-first-architecture.md](documentation/client/architecture/workspace-first-architecture.md).
- **API contract:** Edit **`openapi/`** only; never hand-edit generated outputs.
- **Depth:** [Client/ARCHITECTURE.md](Client/ARCHITECTURE.md), [ARCHITECTURE.md](ARCHITECTURE.md), [documentation/client/architecture/thin-app-architecture.md](documentation/client/architecture/thin-app-architecture.md).

| Docs | Start |
| ---- | ----- |
| Canonical tree | [documentation/README.md](documentation/README.md) |
| Server ops | [documentation/server/ops/postgres.md](documentation/server/ops/postgres.md) |
| Placement rules | [documentation/HOW_WE_DOCUMENT.md](documentation/HOW_WE_DOCUMENT.md) |

---

## Directory map

| Path | Purpose |
| ---- | ------- |
| `Client/` | `apps/*` (thin) + `packages/` (logic, UI, hooks) |
| `Server/` | Flask app, tests, `Server/scripts/` |
| `openapi/` | OpenAPI 3.1 → generated types |
| `documentation/` | Long-form docs |
| `scripts/` | `setup/`, `ci/`, `run/` |
| `.cursor/` | Rules, skills, agents — [.cursor/README.md](.cursor/README.md) |

---

## Conventions

- **Layers:** [frontend-architecture.mdc](.cursor/rules/frontend/frontend-architecture.mdc), [layered-architecture-imports.md](documentation/client/architecture/layered-architecture-imports.md)
- **UI:** [LINTING.md](documentation/client/standards/LINTING.md), [ui-components.mdc](.cursor/rules/frontend/ui-components.mdc)
- **CI:** [ci-gates.mdc](.cursor/rules/shared/ci-gates.mdc) — `pnpm check` + `make lint` before merge
- **Commits:** `[LINEAR-ID] short description` + Linear link in PR
- **Planned work:** [Linear — SilverKey team](https://linear.app/silverkey/team/SIL/all) only — do not add repo markdown backlogs (`to-implement-soon/`, triage queues)

---

## AI tooling

| Area | Location |
| ---- | -------- |
| **Always-on rules** | `.cursor/rules/shared/` (security, thin-app, linting, documentation, context, code-style, env-vars-minimal) |
| **Company context** | [CLAUDE.md](CLAUDE.md), [silverkey-context.mdc](.cursor/rules/shared/silverkey-context.mdc), [pitch-and-fundraising.mdc](.cursor/rules/shared/pitch-and-fundraising.mdc) |
| **Skills / subagents** | `.cursor/skills/` (workflows), `.cursor/agents/` (specialized personas — lint, security, component-audit axes, architecture boundary, dead code). Default: `silverkey-engineer`. Docs/reorg: skills `documentation-placement`, `post-major-change-sync`, `make check-docs` — not multi-agent fleets. |
| **Claude** | [CLAUDE.md](CLAUDE.md), [`.claude/`](.claude/) → `.cursor/`; guide: [claude-code-configuration.md](documentation/client/tooling/claude-code-configuration.md) |
| **Memory** | [.cursor/memory/](.cursor/memory/), [cursor-agent-memory.md](documentation/client/tooling/cursor-agent-memory.md) |
| **MCP** | [mcp.example.json](.cursor/mcp.example.json), `make setup-mcp` — daily: GitHub, Linear, Slack; see [cursor-configuration-optimization.md](documentation/client/tooling/cursor-configuration-optimization.md) |
| **Inventory** | [cursor-audit-latest.md](documentation/internal/cursor-audit-latest.md) |

**After major changes:** [post-major-change-checklist.md](documentation/internal/post-major-change-checklist.md).

---

## Gotchas

- **Generated types:** `openapi/` + `make openapi` — not `api.generated.ts` / `generated.py` by hand.
- **Migrations:** Operator-only unless explicitly directed ([database.mdc](.cursor/rules/backend/database.mdc)).
- **Tokens:** memory + `sessionStorage` — not `localStorage`.
- **Logging:** `packages/logger` / `Server/logger` — not raw `console.*` / `print`.
- **Markdown:** [documentation.mdc](.cursor/rules/shared/documentation.mdc); no repo-root `docs/`.

---

## Server / API

- [documentation/server/README.md](documentation/server/README.md)
- HTTP shape changes → `make openapi-verify` + contract tests when applicable

---

## Cursor Cloud agents

| Service | Port | Start |
| ------- | ---- | ----- |
| Vite web | 5173 | `cd Client && pnpm dev:web` |
| Flask API | 5000 | `Server/.venv` + `.env` + `python run.py --host 0.0.0.0 --port 5000` |
| Redis | 6379 | `redis-server --daemonize yes` |
| PostgreSQL | 5432 | `make db-up` / `make dev-db-init` |

Prefer **`make dev`** (Redis, Flask, Celery, Vite). Cloud VM notes: non-empty `Server/.env` keys per `.env.example`; **pnpm 9.x** via corepack; **`python3.12-venv`** on Ubuntu; tests with `TESTING=true`; local DB reset via `make dev-db-init`; **no migrations** unless directed.
