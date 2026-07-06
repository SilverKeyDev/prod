# Server ops — PostgreSQL

Brief ops reference for local and deployed PostgreSQL. Schema detail lives in SQLAlchemy models under `Server/app/models/`; do not run Alembic migrations from agent sessions.

## Local setup

- Default: `make secrets` / `make setup-dev` fetch `DATABASE_URL` from AWS Secrets Manager (e.g. `db_url` → prod RDS). Local Flask/Celery writes hit that database.
- **Local Docker (opt-in):** `USE_LOCAL_DATABASE=1 make secrets` or `make dev-db-init` (resets Docker volume, injects `postgresql://silverkey:silverkey@localhost:5432/silverkey_dev`, runs migrations).
- Start isolated local Postgres without resetting: `make db-up` (only needed for local Docker path).
- Check local Postgres readiness: `make db-health`.
- Run migrations explicitly with `make migrate` only when you own that workflow (local Docker path uses `make dev-db-init`).
- Deploy and CI database secrets stay in `.github/scripts/*`; local DB reset must not be wired into deploy scripts or Flask startup.

## Schema source of truth

- **Models:** `Server/app/models/` — edit Python definitions only; migrations are operator-only (see `.cursor/rules/backend/database.mdc`).
- **OpenAPI:** HTTP shapes in `openapi/`; regenerate with `make openapi`.

## Common tasks

| Task | Command / location |
|------|-------------------|
| Backend env + prod `DATABASE_URL` | `make setup-dev` or `make secrets` |
| Local Docker DB reset/init (opt-in) | `make dev-db-init` |
| Local `DATABASE_URL` without Docker reset | `USE_LOCAL_DATABASE=1 make secrets` |
| Start isolated local Postgres | `make db-up` |
| Check local Postgres readiness | `make db-health` |
| Reset local Postgres data only | `make db-reset` |
| Post-pull secrets refresh | `make refresh ARGS='--secrets'` |
| Post-pull local Docker reset (opt-in) | `make refresh ARGS='--secrets --reset-db'` |
| Apply schema to local Docker DB | `make dev-db-init` or `make migrate` (operator-owned only) |
| Run API with DB | `make dev-backend` or `cd Server && source .venv/bin/activate && python run.py` |
| Server tests (repo root) | `make test-be` — sets `TESTING=true` and runs pytest in `Server/` |
| Server tests (from `Server/`) | `TESTING=true pytest` |
| Connection issues (local Docker) | `USE_LOCAL_DATABASE=1 make secrets`; `make db-up`; `make db-health` |

## Related docs

- [Redis and Celery](./redis-celery.md)
- [Scripts guide](./scripts-guide.md)
- [Flask architecture](../flask-architecture.md)
- [SQLAlchemy patterns](../sqlalchemy-patterns.md)
- [AWS resources](../aws-resources.md)
