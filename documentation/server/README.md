# Server documentation

Backend (Python/Flask) canonical docs. Lightweight module READMEs stay under `Server/app/`.

## Contents

### Ops

| Doc | Description |
|-----|-------------|
| [ops/postgres.md](./ops/postgres.md) | PostgreSQL local setup and schema pointers |
| [ops/redis-celery.md](./ops/redis-celery.md) | Redis broker, Celery workers, troubleshooting |
| [ops/prod-web-rollback.md](./ops/prod-web-rollback.md) | One-command prod web rollback to a prior immutable SHA tag |
| [ops/monitoring-alerts.md](./ops/monitoring-alerts.md) | PostHog error tracking plus Slack health and 5xx alerting |
| [ops/scaling-playbook.md](./ops/scaling-playbook.md) | Capacity tuning, env vars, multi-instance checklist |
| [ops/posthog-capacity-queries.md](./ops/posthog-capacity-queries.md) | HogQL templates for `api_request` latency and volume |
| [ops/scripts-guide.md](./ops/scripts-guide.md) | Master script inventory, caller map, naming conventions, add/deprecate guide |

### Architecture and API

| Doc | Description |
|-----|-------------|
| [flask-architecture.md](./flask-architecture.md) | App factory, blueprints, auth pipeline |
| [sqlalchemy-patterns.md](./sqlalchemy-patterns.md) | Models, relationships, sessions |
| [sqlalchemy-mapped-migration.md](./sqlalchemy-mapped-migration.md) | Historical SQLAlchemy 2.0 `Mapped[]` migration reference |
| [api-conventions.md](./api-conventions.md) | Routes, validation, pagination |
| [input-validation.md](./input-validation.md) | Request/query validation rollout |
| [openapi-workflow.md](./openapi-workflow.md) | Edit `openapi/` → regenerate types |
| [openapi-validation-rollout.md](./openapi-validation-rollout.md) | Strict vs gradual validation modes |
| [user-preferences.md](./user-preferences.md) | Preferences schema and pipeline |
| [aws-resources.md](./aws-resources.md) | AWS services and deployment |
| [infrastructure-reliability-gap-audit.md](./infrastructure-reliability-gap-audit.md) | Reliability checklist |
| [celery-tasks.md](./celery-tasks.md) | Celery task overview |
| [deployment.md](./deployment.md) | CI/CD and deploy pointers |
| [messaging-sse.md](./messaging-sse.md) | Messaging SSE architecture |

## Related

- Backend rules: `.cursor/rules/backend/`
- Server overview: `Server/README.md`, `Server/ARCHITECTURE.md`
