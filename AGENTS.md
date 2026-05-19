# SilverKey — Agent and engineer quickstart

**What this is:** A monorepo for SilverKey: **React web** + **React Native** (`Client/`), **Flask/Python API** (`Server/`), and **OpenAPI** as the API contract (`openapi/`). Business logic and UI live in **`Client/packages/`**; **`Client/apps/*`** are thin composition layers only.

**What this is not:** A single-page app with ad-hoc server logic in the web bundle—layering and generated types are enforced.

---

## Prerequisites

| Tool | Version / notes |
| ---- | ---------------- |
| **Node.js** | 20+ locally; CI lint uses **22** (see `.github/workflows/lint.yml`) |
| **pnpm** | **9.x** — pinned in [`Client/package.json`](Client/package.json) (`packageManager`) |
| **Python** | **3.10–3.13** for `Server/.venv` (see [`Server/README.md`](Server/README.md)) |
| **PostgreSQL** | Full local API stack; env from [`Server/.env.example`](Server/.env.example) |
| **AWS CLI** | Optional for `make setup` / secrets → `Server/.env`; use `make setup ARGS='--skip-secrets'` without AWS |

**First machine:** `make setup` (or `./scripts/setup-local.sh`). **After `git pull`:** `make refresh`. Human-oriented setup: [README.md](README.md).

---

## Makefile (repo root)

Run `make help` for the full list. Common targets:

| Target | Purpose |
| ------ | ------- |
| `make setup` | First-time: Client `pnpm install`, Server venv, optional secrets |
| `make refresh` | Refresh deps after pull |
| `make dev` | Web + backend (`scripts/run/run-web.sh`) |
| `make dev-web` / `make mobile` | Vite web only / Expo mobile |
| `make dev-backend` | Backend stack only |
| `make lint` | `./scripts/run-all-linters.sh all` (fix phase, then checks) |
| `make lint-client` / `make lint-server` | Client or server linters only |
| `make typecheck` / `make check-client` | Client typecheck / full `pnpm check` |
| `make test` / `make test-fe` / `make test-be` | Vitest + Server pytest |
| `make openapi` | Regenerate TS + Python types from `openapi/` |
| `make openapi-verify` | Regenerate, fail on git drift, contract tests |

---

## Commands (copy-paste)

```bash
# Client — from Client/
pnpm install
pnpm dev:web              # Vite web
pnpm dev:mobile           # Expo / RN

# Client tests & gates
pnpm test:run             # Vitest (CI: make test-fe)
pnpm typecheck && pnpm lint && pnpm lint:cycles && pnpm format:check
pnpm check                # typecheck + lint + format + cycles + audit + build:web

# Server — activate Server/.venv first
cd Server && pytest       # or: make test-be from repo root

# Repo-wide linters (fix first, then verify — same order as CI)
./scripts/run-all-linters.sh client|server|all
# equivalent: make lint
```

**Cursor indexing:** Copy [.cursorignore.example](./.cursorignore.example) → `.cursorignore` (local, gitignored). Optional: [.cursorindexingignore](./.cursorindexingignore).

---

## Architecture (short)

- **Thin apps:** `Client/apps/web`, `Client/apps/mobile` — routing, providers, page composition only.
- **Fat packages:** `Client/packages/` — `features/`, `hooks/`, `ui/`, `config/api/`, services, store.
- **Workspace shells:** Buyer / seller / brokerage routes and workspace state live in **`packages/`**, not in fat app files. See [documentation/client/workspace-first-architecture.md](./documentation/client/workspace-first-architecture.md).
- **API contract:** Edit **`openapi/`** only; regenerate client/server types (never hand-edit generated files).
- **Deeper reads:** [Client/ARCHITECTURE.md](./Client/ARCHITECTURE.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [documentation/client/thin-app-architecture.md](./documentation/client/thin-app-architecture.md).

### Documentation map

| Tree | Use for |
| ---- | ------- |
| [`documentation/`](documentation/README.md) | Canonical long-form: product flows, architecture, compliance, QA |
| [`docs/`](docs/README.md) | Server/ops index (Celery, Redis, runbooks) — links into `documentation/server/` |
| New cross-cutting prose | **`documentation/`** only — not repo-root `docs/` expansion (see `.cursor/rules/shared/documentation.mdc`) |

---

## Top-level directory map

| Path | Purpose |
| ---- | ------- |
| `Client/` | pnpm workspace: `apps/*` (thin) + `packages/` (logic, UI, hooks) |
| `Server/` | Flask API, services, tests, `scripts/` (venv, lint, secrets) |
| `openapi/` | OpenAPI 3.1 sources → generated TS/Python types |
| `documentation/` | Canonical human docs |
| `docs/` | Server/ops stubs and index |
| `scripts/` | `setup-local.sh`, `refresh.sh`, `run-all-linters.sh`, `run/` dev stacks |
| `.cursor/` | Rules (`.mdc`), skills, agent personas — [.cursor/README.md](./.cursor/README.md) |
| `.github/` | CI workflows and PR templates |

---

## Conventions (pointers)

- **Imports / layers:** [.cursor/rules/frontend/frontend-architecture.mdc](./.cursor/rules/frontend/frontend-architecture.mdc) + [documentation/client/layered-architecture-imports.md](./documentation/client/layered-architecture-imports.md)
- **UI primitives:** [documentation/client/LINTING.md](./documentation/client/LINTING.md), `.cursor/rules/frontend/ui-components.mdc`
- **CI gates (client):** typecheck, lint (incl. cycles + max-lines), format, then full `pnpm check` — [.cursor/rules/shared/ci-gates.mdc](./.cursor/rules/shared/ci-gates.mdc)
- **Docs placement:** `documentation/HOW_WE_DOCUMENT.md`
- **PR bar:** Same gates as CI (`pnpm check`, `./scripts/run-all-linters.sh server` or `make lint`)

---

## AI tooling in this repo

| Area | Location |
| ---- | -------- |
| **Always-on (4)** | `security`, `thin-app-architecture`, `linting`, `documentation` under `.cursor/rules/shared/` |
| **Scoped rules** | `.cursor/rules/shared/`, `frontend/`, `backend/` (+ some under `Server/`) — glob-attached; see audit table |
| **Skills** | `.cursor/skills/*/SKILL.md` (e.g. `run-all-linters`, `post-major-change-sync`) |
| **Subagents** | `.cursor/agents/*.md` |
| **Extend / inventory** | [.cursor/README.md](./.cursor/README.md), [documentation/internal/cursor-audit-latest.md](./documentation/internal/cursor-audit-latest.md) |

**MCP:** Example only — [.cursor/mcp.example.json](./.cursor/mcp.example.json). Credentials stay local/env.

**After major architecture changes:** [documentation/internal/post-major-change-checklist.md](./documentation/internal/post-major-change-checklist.md) — update `documentation/`, relevant `.mdc` files, and this file when quickstart or tooling map changes.

---

## Gotchas

- **Generated types:** Do not edit `Client/packages/types/api.generated.ts` or `Server/app/schemas/generated.py` — change `openapi/`, then `make openapi` (see `.cursor/rules/shared/openapi-workflow.mdc`).
- **DB migrations:** Do not run or author Alembic unless explicitly directed (`.cursor/rules/backend/database.mdc`). `make migrate` is operator-only.
- **Tokens:** Client uses memory + `sessionStorage` — not `localStorage`.
- **Logging:** Use `packages/logger` (client) and `Server/logger` (backend) — not raw `console.*` / `print`.
- **Markdown:** Follow `.cursor/rules/shared/documentation.mdc`; team-maintained exceptions include `AGENTS.md`, `.cursor/README.md`, `documentation/internal/**`.

---

## Server / API

- Index: [documentation/server/README.md](./documentation/server/README.md)
- **Refactor checklist:** `python3 Server/scripts/lint/lint_circular_imports.py`; targeted `pytest`; if HTTP shapes change → update `openapi/` + `make openapi-verify` + contract tests (`Server/tests/contract/test_openapi_contracts.py` where applicable)

---

## Checks summary

| Scope | Command |
| ----- | ------- |
| Client (partial) | `cd Client && pnpm typecheck && pnpm lint && pnpm lint:cycles && pnpm format:check` |
| Client (full) | `cd Client && pnpm check` or `make check-client` |
| Client tests | `cd Client && pnpm test:run` or `make test-fe` |
| Server tests | `make test-be` (venv + `TESTING=true`) |
| Repo-wide lint | `./scripts/run-all-linters.sh all` or `make lint` |
| OpenAPI | `make openapi` → commit generated files; `make openapi-verify` before PR |
