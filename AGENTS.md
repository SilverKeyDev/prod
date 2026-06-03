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
| **Redis** | Local Celery/cache; `make setup` installs and verifies (`redis-cli ping`) |
| **libmagic** | System library for `python-magic` (secure uploads); macOS: `brew install libmagic` — see [`Server/README.md`](Server/README.md) |
| **PostgreSQL** | Full local API stack; env from [`Server/.env.example`](Server/.env.example) |
| **AWS CLI** | Optional for `make setup` / secrets → `Server/.env`; use `make setup ARGS='--skip-secrets'` without AWS |

**First machine:** `make setup` — deps, build, AWS SSO, secrets, verify, Cursor MCP (see [setup.md](setup.md)). **After `git pull`:** `make refresh`.

---

## Makefile (repo root)

Run `make help` for the full list. Common targets:

| Target | Purpose |
| ------ | ------- |
| `make setup` | First-time: Client `pnpm install`, Server venv, optional secrets |
| `make refresh` | Clear stale dev caches + refresh deps after pull (`ARGS='--no-clean'` to skip) |
| `make dev` | Web + backend (`scripts/run/run-web.sh`) |
| `make dev-web` / `make mobile` | Vite web only / Expo mobile |
| `make dev-backend` | Backend stack only |
| `make lint` | `./scripts/ci/run-all-linters.sh all` (fix phase, then checks) |
| `make lint-client` / `make lint-server` | Client or server linters only |
| `make typecheck` / `make check-client` | Client typecheck / full `pnpm check` |
| `make test` / `make test-fe` / `make test-be` | Vitest + Server pytest |
| `make openapi` | Regenerate TS + Python types from `openapi/` |
| `make openapi-verify` | Regenerate, fail on git drift, contract tests |
| `make check-docs` | Doc placement + link checks (`scripts/ci/check-doc-*.sh`) |

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
./scripts/ci/run-all-linters.sh client|server|all
# equivalent: make lint
```

**Cursor indexing:** Copy [.cursorignore.example](./.cursorignore.example) → `.cursorignore` (local, gitignored). Optional: [.cursorindexingignore](./.cursorindexingignore).

---

## Architecture (short)

- **Thin apps:** `Client/apps/web`, `Client/apps/mobile` — routing, providers, page composition only.
- **Fat packages:** `Client/packages/` — `features/`, `hooks/`, `ui/`, `config/api/`, services, store.
- **Workspace shells:** Buyer / seller / brokerage routes and workspace state live in **`packages/`**, not in fat app files. See [documentation/client/architecture/workspace-first-architecture.md](./documentation/client/architecture/workspace-first-architecture.md).
- **API contract:** Edit **`openapi/`** only; regenerate client/server types (never hand-edit generated files).
- **Deeper reads:** [Client/ARCHITECTURE.md](./Client/ARCHITECTURE.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [documentation/client/architecture/thin-app-architecture.md](./documentation/client/architecture/thin-app-architecture.md).

### Documentation map

| Tree | Use for |
| ---- | ------- |
| [`documentation/`](documentation/README.md) | Canonical long-form: product flows, architecture, compliance, QA |
| [`documentation/server/ops/`](documentation/server/ops/postgres.md) | Server ops (Postgres, Redis/Celery) |
| Doc placement checks | `make check-docs` |

---

## Top-level directory map

| Path | Purpose |
| ---- | ------- |
| `Client/` | pnpm workspace: `apps/*` (thin) + `packages/` (logic, UI, hooks) |
| `Server/` | Flask API, services, tests, `scripts/` (venv, lint, secrets) |
| `openapi/` | OpenAPI 3.1 sources → generated TS/Python types |
| `documentation/` | Canonical human docs (incl. `documentation/server/ops/`) |
| `scripts/` | `scripts/setup/`, `scripts/ci/run-all-linters.sh`, `scripts/run/` dev stacks |
| `.cursor/` | Rules (`.mdc`), skills, agent personas — [.cursor/README.md](./.cursor/README.md) |
| `.github/` | CI workflows and PR templates |

---

## Conventions (pointers)

- **Imports / layers:** [.cursor/rules/frontend/frontend-architecture.mdc](./.cursor/rules/frontend/frontend-architecture.mdc) + [documentation/client/architecture/layered-architecture-imports.md](./documentation/client/architecture/layered-architecture-imports.md)
- **UI primitives:** [documentation/client/standards/LINTING.md](./documentation/client/standards/LINTING.md), `.cursor/rules/frontend/ui-components.mdc`
- **CI gates (client):** typecheck, lint (incl. cycles + max-lines), format, then full `pnpm check` — [.cursor/rules/shared/ci-gates.mdc](./.cursor/rules/shared/ci-gates.mdc)
- **Docs placement:** `documentation/HOW_WE_DOCUMENT.md`
- **PR bar:** Same gates as CI (`pnpm check`, `./scripts/ci/run-all-linters.sh server` or `make lint`)

---

## AI tooling in this repo

| Area | Location |
| ---- | -------- |
| **Always-on (7)** | `security`, `thin-app-architecture`, `linting`, `documentation`, `silverkey-context`, `code-style`, `env-vars-minimal` under `.cursor/rules/shared/` |
| **Company context** | [CLAUDE.md](CLAUDE.md) quickstart + [.cursor/rules/shared/silverkey-context.mdc](.cursor/rules/shared/silverkey-context.mdc) and [.cursor/rules/shared/pitch-and-fundraising.mdc](.cursor/rules/shared/pitch-and-fundraising.mdc) for canonical partner/fundraising facts |
| **Scoped rules** | `.cursor/rules/shared/`, `frontend/`, `backend/` (+ some under `Server/`) — glob-attached; see audit table |
| **Session memory bank** | [.cursor/memory/](./.cursor/memory/) — `activeContext.md`, `progress.md`; rule: `agent-memory.mdc` |
| **Automation memory seeds** | [.cursor/memory/automations/](./.cursor/memory/automations/) — paste into Cursor Memory Notes; `./scripts/print-automation-memory.sh <persona>` |
| **Skills** | `.cursor/skills/*/SKILL.md` (e.g. `run-all-linters`, `post-major-change-sync`) |
| **Subagents** | `.cursor/agents/*.md` |
| **Extend / inventory** | [.cursor/README.md](./.cursor/README.md), [documentation/internal/cursor-audit-latest.md](./documentation/internal/cursor-audit-latest.md) |

**MCP:** Example — [.cursor/mcp.example.json](./.cursor/mcp.example.json); local config via `make setup-mcp` (install/verify, summary at end). Daily default connectors: GitHub, Linear, Slack. Add-ons (enable only when needed): Mercury (read-only banking), AWS/gcloud, PostHog/Datadog, and **`cursor-memory`** (`/memo`, `/recall`). Credentials stay local/env.

**Agent memory (all layers):** [documentation/client/tooling/cursor-agent-memory.md](./documentation/client/tooling/cursor-agent-memory.md) — repo bank, Cursor Settings → Memories, Automations Memory Notes, MCP.

**Commits:** `[LINEAR-ID] short description` — link the Linear ticket in PR descriptions.

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
| Repo-wide lint | `./scripts/ci/run-all-linters.sh all` or `make lint` |
| Documentation | `make check-docs` (placement + internal links) |
| OpenAPI | `make openapi` → commit generated files; `make openapi-verify` before PR |

---

## Cursor Cloud specific instructions

### Services overview

| Service | Port | Start command |
| ------- | ---- | ------------- |
| **Vite web** | 5173 | `cd Client && pnpm dev:web` |
| **Flask API** | 5000 | `cd Server && source .venv/bin/activate && source .env && python run.py --host 0.0.0.0 --port 5000` |
| **Redis** | 6379 | `redis-server --daemonize yes --port 6379` |
| **PostgreSQL** | 5432 | `sudo pg_ctlcluster 16 main start` (auto-starts via service) |

### Running the full dev stack

Use `make dev` (runs `scripts/run/run-web.sh` which starts Redis, Flask, Celery, then Vite). Or start services individually as shown above.

### Gotchas for Cloud Agents

- **Flask requires all `.env.example` vars to be non-empty** — the `config_validator.py` reads `Server/.env.example` and checks each key at startup. Use `Server/.env` with placeholder values for keys you don't have real secrets for (the validator only checks `os.getenv(key)` is truthy, not that the value is valid). Tests skip this check via `TESTING=true`.
- **pnpm must be 9.x** — the VM may ship with pnpm 10+. Fix via `corepack enable && corepack prepare pnpm@9.0.0 --activate`.
- **`python3.12-venv`** package is required on Ubuntu for `Server/scripts/bootstrap-venv.sh` to create the venv.
- **Server tests** pass with `TESTING=true APP_LOG_LEVEL=ERROR pytest --no-cov` (coverage threshold may fail but all 793+ tests pass).
- **Client lint** has a few pre-existing warnings/errors on `main` (import sorting, unused vars) — these are not regressions.
- **Do not run migrations** — the database schema is managed externally. `make migrate` is operator-only.
