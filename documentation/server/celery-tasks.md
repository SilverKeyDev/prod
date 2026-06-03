# Celery tasks

> **Last verified:** 2026-05-28  
> **Code:** `Server/app/celery/`

Celery handles async work off the Flask request path. Redis is broker and result backend — see [ops/redis-celery.md](./ops/redis-celery.md).

## When Celery runs

- Long-running or retriable server work (emails, webhooks follow-up, batch jobs) defined under `Server/app/celery/tasks/`.
- Local dev: started via `make dev` / `scripts/run/run-web.sh` with Redis up.

## Conventions

- Tasks import app context safely; use `Server/logger` for logging.
- Failures should be observable in logs; idempotent where retries apply.

## Related

- [flask-architecture.md](./flask-architecture.md)
- [ops/redis-celery.md](./ops/redis-celery.md)
