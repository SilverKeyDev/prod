# SilverKey

Monorepo for the SilverKey product: **React** (web + **React Native**) in [`Client/`](Client/), **Flask** API in [`Server/`](Server/), contract in [`openapi/`](openapi/), and long-form docs in [`documentation/`](documentation/).

[![Lint](https://github.com/SilverKeyDev/prod/actions/workflows/lint.yml/badge.svg)](https://github.com/SilverKeyDev/prod/actions/workflows/lint.yml)
[![Tests](https://github.com/SilverKeyDev/prod/actions/workflows/test.yml/badge.svg)](https://github.com/SilverKeyDev/prod/actions/workflows/test.yml)

---

## Contents

- [Quick start](#quick-start)
- [Quality gates & CI](#quality-gates--ci)
- [Makefile](#makefile)
- [Repository structure](#repository-structure)
- [Documentation](#documentation)
- [OpenAPI & generated code](#openapi--generated-code)
- [Security](#security)
- [AI assistants](#ai-assistants)

---

## Quick start

**First-time setup:** run **`make setup`** — installs missing tools (or prints commands), builds Client/Server env, AWS SSO login, fetches secrets, and verifies. Details: **[setup.md](setup.md)**.

```bash
make setup          # deps → build → AWS SSO → secrets → verify
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

## Quality gates & CI

PRs are expected to stay green with the same checks CI runs (see [`.github/workflows/lint.yml`](.github/workflows/lint.yml) and [`.cursor/rules/shared/ci-gates.mdc`](.cursor/rules/shared/ci-gates.mdc)).

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
| [`documentation/`](documentation/) | Canonical long-form documentation. |
| [`docs/`](docs/README.md) | Server / ops index (links into `documentation/server/`). |
| [`scripts/`](scripts/) | `setup-local.sh`, `check-deps.sh`, `refresh.sh`, `run-all-linters.sh`, `run/` dev stacks. |
| [`.github/`](.github/) | Workflows and templates. |

**Architecture rule:** business logic and shared UI live in **`Client/packages/`**; **`Client/apps/*`** stay thin (routing, providers, page composition). See [`documentation/client/thin-app-architecture.md`](documentation/client/thin-app-architecture.md) and [`Client/ARCHITECTURE.md`](Client/ARCHITECTURE.md).

---

## Documentation

| Need | Start here |
| ---- | ---------- |
| **Local machine setup** | **[setup.md](setup.md)** |
| Agent / engineer quickstart | [`AGENTS.md`](AGENTS.md) |
| Doc index | [`documentation/README.md`](documentation/README.md) |
| Client (lint, packages, RN vs web) | [`documentation/client/README.md`](documentation/client/README.md) |
| Server | [`documentation/server/README.md`](documentation/server/README.md) |
| Ops / server stubs index | [`docs/README.md`](docs/README.md) |

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

Start at [`AGENTS.md`](AGENTS.md) for commands, directory map, OpenAPI rules, and Cursor configuration.

File bugs and requests via **GitHub Issues** — templates auto-load area, workspace, paths, and verification context for triagers and AI agents.
