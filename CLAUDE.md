# SilverKey Claude Code Memory

@AGENTS.md

## Stack

- Client: pnpm 9, Node 20+, React web and React Native, TypeScript, Zustand, Vitest
- Server: Python 3.10 to 3.13, Flask, SQLAlchemy, Celery, Redis, pytest, ruff, mypy
- Contract: OpenAPI 3.1 in `openapi/` with generated client and server types

## Key Commands

- Setup: `make setup`
- Refresh after pull: `make refresh`
- Run full stack: `make dev`
- Run web only: `make dev-web`
- Run backend only: `make dev-backend`
- Run mobile: `make mobile`
- Client gate: `make check-client`
- Client typecheck: `make typecheck`
- Server tests: `make test-be`
- Repo lint: `make lint`
- OpenAPI regenerate: `make openapi`
- OpenAPI verify: `make openapi-verify`
- Docs checks: `make check-docs`

## Repository Layout

- `Client/`: thin app entrypoints in `apps/*`, shared product logic in `packages/*`
- `Server/`: Flask application, services, models, routes, tests
- `openapi/`: API contract source, downstream generation entrypoint
- `documentation/`: canonical long-form documentation
- `.claude/`: Claude Code adapter (stubs → `.cursor/`)
- `.codex/`, `.agents/skills/`: Codex adapter (`rules/`, TOML subagents, repo skills → `.cursor/`)

## Universal Conventions

- Keep business logic in shared packages and services, not in thin app shells.
- Edit OpenAPI source files, then regenerate derived types. Do not hand edit generated outputs.
- Treat lint and type errors as blocking.
- Use centralized logging utilities, not ad hoc `console.*` or `print`.
- Do not add new `.env` keys unless a new integration or deployment surface requires it.
- Do not commit secrets or credentials.
