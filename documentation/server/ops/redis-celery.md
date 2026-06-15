# Server ops — Redis and Celery

Redis backs Celery broker/results and caching. Required for full local API stack (see [setup.md](../../../setup.md)).

## Local setup

```bash
redis-server --daemonize yes --port 6379
redis-cli ping   # expect PONG
```

`make setup` installs and verifies Redis.

## Usage in SilverKey

| Role | Notes |
|------|-------|
| **Celery broker** | Async tasks (`Server/app/celery/`) |
| **Results backend** | Task result storage |
| **Cache** | App caching layers where configured |

## Run Celery worker (local)

From repo root:

```bash
make dev-backend   # scripts/run/run-backend.sh — Redis + Flask + Celery
make dev           # full stack (same backend path, then Vite web)
```

Or manually from `Server/` with venv active and `Server/.env` loaded.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| `Connection refused` on 6379 | `redis-cli ping`; start redis-server |
| Tasks not running | Celery worker process up; `REDIS_URL` / broker env in `Server/.env` |
| Stale cache | Flush dev cache only in local env — never in production without runbook |

## Related docs

- [Celery tasks](../celery-tasks.md) (task catalog)
- [Flask architecture](../flask-architecture.md)
- [Infrastructure gap audit](../infrastructure-reliability-gap-audit.md)
