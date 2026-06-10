# Server ops — PostgreSQL

Brief ops reference for local and deployed PostgreSQL. Schema detail lives in SQLAlchemy models under `Server/app/models/`; do not run Alembic migrations from agent sessions.

## Local setup

- Default local development uses Docker Postgres from the repo root `docker-compose.yml`.
- First-time setup (`make setup`) resets the local Docker Postgres volume, fetches non-database secrets, and runs migrations.
- Repeat the same local reset/init workflow with `make dev-db-init`.
- Start the isolated local database without resetting it with `make db-up`.
- `make secrets` writes `DATABASE_URL=postgresql://silverkey:silverkey@localhost:5432/silverkey_dev` unless an existing local URL is already present.
- Check readiness with `make db-health`.
- Run migrations explicitly with `make migrate` only when you own that workflow.
- To intentionally fetch a shared database secret for an operator workflow, run `ALLOW_SHARED_DATABASE_URL=1 make secrets`.
- Deploy and CI database secrets stay in `.github/scripts/*`; local DB reset must not be wired into deploy scripts or Flask startup.

## Schema source of truth

- **Models:** `Server/app/models/` — edit Python definitions only; migrations are operator-only (see `.cursor/rules/backend/database.mdc`).
- **OpenAPI:** HTTP shapes in `openapi/`; regenerate with `make openapi`.

## Common tasks

| Task | Command / location |
|------|-------------------|
| First-time local DB init | `make setup` |
| Repeat local DB reset/init | `make dev-db-init` |
| Start isolated local Postgres | `make db-up` |
| Check local Postgres readiness | `make db-health` |
| Reset local Postgres data only | `make db-reset` |
| Post-pull reset with refreshed secrets | `make refresh ARGS='--secrets --reset-db'` |
| Apply schema to local DB | `make migrate` (operator/developer-owned workflow only) |
| Run API with DB | `make dev-backend` or `cd Server && source .venv/bin/activate && python run.py` |
| Server tests (repo root) | `make test-be` — sets `TESTING=true` and runs pytest in `Server/` |
| Server tests (from `Server/`) | `TESTING=true pytest` |
| Refresh non-DB secrets into `Server/.env` | `make secrets` (repo root; see [scripts-guide.md](./scripts-guide.md)) |
| Connection issues | Verify `Server/.env` uses localhost; run `make db-health` |

## Related docs

- [Redis and Celery](./redis-celery.md)
- [Scripts guide](./scripts-guide.md)
- [Flask architecture](../flask-architecture.md)
- [SQLAlchemy patterns](../sqlalchemy-patterns.md)
- [AWS resources](../aws-resources.md)
