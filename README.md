# SilverKey

Monorepo for the SilverKey product: **React** (web + **React Native**) in [`Client/`](Client/), **Flask** API in [`Server/`](Server/), contract in [`openapi/`](openapi/), and long-form docs in [`documentation/`](documentation/).

[![Lint](https://github.com/SilverKeyDev/prod/actions/workflows/lint.yml/badge.svg)](https://github.com/SilverKeyDev/prod/actions/workflows/lint.yml)
[![Tests](https://github.com/SilverKeyDev/prod/actions/workflows/test.yml/badge.svg)](https://github.com/SilverKeyDev/prod/actions/workflows/test.yml)

---

## Contents

- [Quick start](#quick-start)
- [Requirements](#requirements)
- [Local development](#local-development)
- [Quality gates & CI](#quality-gates--ci)
- [Makefile](#makefile)
- [Repository structure](#repository-structure)
- [Documentation](#documentation)
- [OpenAPI & generated code](#openapi--generated-code)
- [Security](#security)
- [AI assistants](#ai-assistants)

---

## Quick start

**AWS (for default setup):** Install the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) and sign in to the **dev account** with credentials that can **read Secrets Manager** in the region you use (default `us-east-2`; override with `AWS_REGION`). Typical flows: `aws sso login --profile <your-profile>` then `export AWS_PROFILE=<your-profile>`, or use access keys your team documents. Confirm the session with `aws sts get-caller-identity`. Without AWS, use `make setup ARGS='--skip-secrets'` and maintain `Server/.env` yourself (see `Server/.env.example`).

```bash
git clone https://github.com/SilverKeyDev/prod.git
cd prod   # GitHub default folder name; use your checkout directory if different

make setup                            # same as ./scripts/setup-local.sh — Client, Server/.venv, secrets
# make setup ARGS='--skip-secrets'    # skip Secrets Manager if AWS is not ready yet

make dev                              # web + API (see make help)
# or: cd Client && pnpm dev:web
```

After every `git pull`:

```bash
make refresh                          # same as ./scripts/refresh.sh — refresh pnpm + pip
# make refresh ARGS='--secrets'       # also refresh Server/.env from AWS
```

| If you need… | Run |
| ------------ | --- |
| Same as `setup-local.sh` | `make setup` |
| Same as `refresh.sh` | `make refresh` |
| Secrets only | `make secrets` |
| Web only | `make dev-web` |
| Mobile (Expo) | `make mobile` |
| Full client CI gate | `make check-client` |
| All repo linters | `make lint` |

---

## Requirements

| Tool | Notes |
| ---- | ----- |
| **Node.js** | 20+ (CI uses newer Node with pnpm cache; local 20+ matches `AGENTS.md`). |
| **pnpm** | **9.x** — pinned via `packageManager` in [`Client/package.json`](Client/package.json). `corepack enable` then `corepack prepare pnpm@9.0.0 --activate`. |
| **Python** | **3.10–3.13** for [`Server/.venv`](Server/README.md). Newer versions may break wheels; use e.g. `PYTHON=python3.12` with `Server/scripts/bootstrap-venv.sh`. |
| **AWS CLI** | Needed for default `make setup` / `./scripts/setup-local.sh` (secrets → `Server/.env`). Requires an **authenticated** session (SSO or keys) with Secrets Manager access in the target account/region. Use `make setup ARGS='--skip-secrets'` without AWS. |
| **PostgreSQL** | For a full local API stack; see `Server/.env.example` and server docs. |
| **Docker** | Optional (containers / CI parity). |

---

## Local development

1. **Bootstrap once** — `make setup` (same as [`scripts/setup-local.sh`](scripts/setup-local.sh)) runs `pnpm install` in `Client/`, bootstraps **`Server/.venv`**, and fetches secrets unless `ARGS='--skip-secrets'`. If `.venv` already exists and you only need dependency refresh, use **`make refresh`** instead. Recreate the venv: `make setup ARGS='--force-venv'`.

2. **Editor (optional)** — Copy [`.cursorignore.example`](.cursorignore.example) to `.cursorignore` at the repo root to trim indexing noise. Team rules live under [`.cursor/`](.cursor/).

3. **Run apps** — From `Client/`: `pnpm dev:web`, `pnpm dev:mobile`, `pnpm build:web`, `pnpm preview:web`. From repo root: `make help` for `dev`, `dev-web`, `dev-backend`, etc.

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
| [`scripts/`](scripts/) | `setup-local.sh`, `refresh.sh`, `run-all-linters.sh`, `run/` dev stacks. |
| [`.github/`](.github/) | Workflows and templates. |

**Architecture rule:** business logic and shared UI live in **`Client/packages/`**; **`Client/apps/*`** stay thin (routing, providers, page composition). See [`documentation/client/thin-app-architecture.md`](documentation/client/thin-app-architecture.md) and [`Client/ARCHITECTURE.md`](Client/ARCHITECTURE.md).

---

## Documentation

| Need | Start here |
| ---- | ---------- |
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

Regenerate: `make openapi` or `cd Client && pnpm generate:api-types`. Workflow: [`.cursor/rules/shared/openapi-workflow.mdc`](.cursor/rules/shared/openapi-workflow.mdc).

---

## Security

- Engineering controls and patterns: [`documentation/security/SECURITY.md`](documentation/security/SECURITY.md) and [`.cursor/rules/shared/security.mdc`](.cursor/rules/shared/security.mdc).
- **Do not** commit secrets; use env vars and existing secrets scripts.

---

## AI assistants

Start at [`AGENTS.md`](AGENTS.md) for commands, directory map, OpenAPI rules, and Cursor configuration.

File bugs and requests via **GitHub Issues** — templates auto-load area, workspace, paths, and verification context for triagers and AI agents.
