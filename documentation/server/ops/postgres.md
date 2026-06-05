# Server ops — PostgreSQL

Brief ops reference for local and deployed PostgreSQL. Schema detail lives in SQLAlchemy models under `Server/app/models/`; do not run Alembic migrations from agent sessions.

## Local setup

- Install PostgreSQL 14+ (see [setup.md](../../../setup.md)).
- Connection vars in `Server/.env.example` (`DATABASE_URL`, host, port, user, password).
- Start: `sudo pg_ctlcluster 16 main start` (Linux) or `brew services start postgresql@16` (macOS).

## Schema source of truth

- **Models:** `Server/app/models/` — edit Python definitions only; migrations are operator-only (see `.cursor/rules/backend/database.mdc`).
- **OpenAPI:** HTTP shapes in `openapi/`; regenerate with `make openapi`.

## Common tasks

| Task | Command / location |
|------|-------------------|
| Run API with DB | `make dev-backend` or `cd Server && source .venv/bin/activate && python run.py` |
| Server tests (repo root) | `make test-be` — sets `TESTING=true` and runs pytest in `Server/` |
| Server tests (from `Server/`) | `TESTING=true pytest` |
| Refresh secrets into `Server/.env` | `make secrets` (repo root; see [scripts-guide.md](./scripts-guide.md)) |
| Connection issues | Verify `Server/.env` matches `.env.example`; check Postgres listening on 5432 |

## Related docs

- [Redis and Celery](./redis-celery.md)
- [Scripts guide](./scripts-guide.md)
- [Flask architecture](../flask-architecture.md)
- [SQLAlchemy patterns](../sqlalchemy-patterns.md)
- [AWS resources](../aws-resources.md)
