# SilverKey

Monorepo for the SilverKey product: **React** (web + **React Native**) in [`Client/`](Client/), **Flask** API in [`Server/`](Server/), contract in [`openapi/`](openapi/), and long-form docs in [`documentation/`](documentation/).

[![Lint](https://github.com/SilverKeyDev/prod/actions/workflows/lint.yml/badge.svg)](https://github.com/SilverKeyDev/prod/actions/workflows/lint.yml)
[![Tests](https://github.com/SilverKeyDev/prod/actions/workflows/test.yml/badge.svg)](https://github.com/SilverKeyDev/prod/actions/workflows/test.yml)

---

## Contents

- [Quick start](#quick-start)
- [For AI assistants and new engineers](#for-ai-assistants-and-new-engineers)
- [Quality gates & CI](#quality-gates--ci)
- [Makefile](#makefile)
- [Repository structure](#repository-structure)
- [Documentation](#documentation)
- [OpenAPI & generated code](#openapi--generated-code)
- [Security](#security)
- [AI assistants](#ai-assistants)

---

## Quick start

**First-time setup:** run **`make setup`** — installs missing tools (or prints commands), builds Client/Server env, AWS SSO login, fetches secrets, verifies, and seeds Cursor MCP config. Details: **[setup.md](setup.md)**.

```bash
make setup          # deps → build → AWS SSO → secrets → verify → MCP
make dev            # web + API (after setup)
make refresh        # after git pull
```

| If you need… | Run |
| ------------ | --- |
| Full setup guide | [setup.md](setup.md) |
| Same as `setup-local.sh` | `make setup` |
| Same as `refresh.sh` | `make refresh` |
| Secrets only | `make secrets` |
| Web only | `make dev-web` |
| Mobile (Expo) | `make mobile` |
| Full client CI gate | `make check-client` |
| All repo linters | `make lint` |

---

## For AI assistants and new engineers

This repo uses Cursor with MCP connectors and a structured rules system. On first clone:

1. Copy [`.cursor/mcp.example.json`](.cursor/mcp.example.json) to `.cursor/mcp.json` and OAuth into each connector (GitHub, Linear, Slack, Mercury — see [setup.md](setup.md) or `make setup-mcp`)
2. Read [`CLAUDE.md`](CLAUDE.md) for company context (business model, RESPA, partners, fundraising)
3. Read [`AGENTS.md`](AGENTS.md) for engineering commands and quality gates
4. Cursor auto-loads rules from [`.cursor/rules/`](.cursor/rules/) based on which files you edit — see [`.cursor/rules/README.md`](.cursor/rules/README.md)

---

## Quality gates & CI

Run lint gates locally before merge (`make lint`, `pnpm check`). CI runs the same linters **weekly on Mondays** (see [`.github/workflows/lint.yml`](.github/workflows/lint.yml) and [`.cursor/rules/shared/ci-gates.mdc`](.cursor/rules/shared/ci-gates.mdc)); tests still run on every PR via [`.github/workflows/test.yml`](.github/workflows/test.yml).

**Client** (from `Client/`):

```bash
pnpm typecheck && pnpm lint && pnpm lint:cycles && pnpm format:check
pnpm check          # includes build:web — full client gate
pnpm test:run       # Vitest
```

**Repo-wide:** `./scripts/run-all-linters.sh client|server|all` or `make lint` (all scopes).

**Server:** activate `Server/.venv`, then use `Server/README.md` and [`documentation/server/`](documentation/server/README.md) for `pytest` and Python linters.

---

## Makefile

The root [`Makefile`](Makefile) wraps common flows (`setup`, `refresh`, `secrets`, `dev`, `lint`, `typecheck`, `check-client`, `openapi`, …). Run:

```bash
make help
```

---

## Repository structure

| Path | Purpose |
| ---- | ------- |
| [`Client/`](Client/) | pnpm workspace: **`apps/web`**, **`apps/mobile`** (thin shells), **`packages/`** (features, hooks, UI, config, store, …). |
| [`Server/`](Server/) | Flask app, services, tests, `Server/scripts/` (venv bootstrap, secrets, lint). |
| [`openapi/`](openapi/) | HTTP API contract; drives generated TS/Python types. |
| [`documentation/`](documentation/) | Canonical long-form documentation (incl. server ops under `documentation/server/ops/`). |
| [`scripts/`](scripts/) | `setup-local.sh`, `check-deps.sh`, `refresh.sh`, `run-all-linters.sh`, `run/` dev stacks. |
| [`.github/`](.github/) | Workflows and templates. |

**Architecture rule:** business logic and shared UI live in **`Client/packages/`**; **`Client/apps/*`** stay thin (routing, providers, page composition). See [`documentation/client/architecture/thin-app-architecture.md`](documentation/client/architecture/thin-app-architecture.md) and [`Client/ARCHITECTURE.md`](Client/ARCHITECTURE.md).

---

## Documentation

| Need | Start here |
| ---- | ---------- |
| **Local machine setup** | **[setup.md](setup.md)** |
| Agent / engineer quickstart | [`AGENTS.md`](AGENTS.md) |
| Doc index | [`documentation/README.md`](documentation/README.md) |
| Client (lint, packages, RN vs web) | [`documentation/client/README.md`](documentation/client/README.md) |
| Server | [`documentation/server/README.md`](documentation/server/README.md) |
| Server ops (Postgres, Redis) | [`documentation/server/ops/`](documentation/server/ops/postgres.md) |

---

## OpenAPI & generated code

Edit **`openapi/`** only; regenerate types instead of editing:

- `Client/packages/types/api.generated.ts`
- `Server/app/schemas/generated.py`

Regenerate: `make openapi` (bundle + server + client) or `cd Client && pnpm generate:api-types`. Before a PR: `make openapi-verify` (regenerates, checks git drift, contract tests, typecheck). Workflow: [`.cursor/rules/shared/openapi-workflow.mdc`](.cursor/rules/shared/openapi-workflow.mdc).

---

## Security

- Engineering controls and patterns: [`documentation/security/SECURITY.md`](documentation/security/SECURITY.md) and [`.cursor/rules/shared/security.mdc`](.cursor/rules/shared/security.mdc).
- **Do not** commit secrets; use env vars and existing secrets scripts.

---

## AI assistants

- **Company context:** [`CLAUDE.md`](CLAUDE.md)
- **Engineering quickstart:** [`AGENTS.md`](AGENTS.md)
- **Cursor rules index:** [`.cursor/rules/README.md`](.cursor/rules/README.md)
- **Default subagent persona:** [`.cursor/agents/silverkey-engineer.md`](.cursor/agents/silverkey-engineer.md)

File bugs and requests via **GitHub Issues** — templates auto-load area, workspace, paths, and verification context for triagers and AI agents.
