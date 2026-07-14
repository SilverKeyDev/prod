# Runbooks

Operational and QA procedures.

## Ops

| Runbook | Description |
|---------|-------------|
| [postgres.md](./postgres.md) | Local Postgres and schema pointers |
| [redis-celery.md](./redis-celery.md) | Redis broker, Celery workers |
| [prod-web-rollback.md](./prod-web-rollback.md) | Prod web rollback to prior SHA tag |
| [monitoring-alerts.md](./monitoring-alerts.md) | PostHog errors + Slack health/5xx |
| [scaling-playbook.md](./scaling-playbook.md) | Capacity tuning, multi-instance |
| [scripts-guide.md](./scripts-guide.md) | Script inventory and conventions |
| [messaging-sse-operations.md](./messaging-sse-operations.md) | Messaging SSE ops |

## PostHog

Start with [posthog/README.md](./posthog/README.md).

| Runbook | Description |
|---------|-------------|
| [posthog/capacity-queries.md](./posthog/capacity-queries.md) | HogQL for `api_request` latency |
| [posthog/api-error-semantics.md](./posthog/api-error-semantics.md) | `error_kind` and SLO vs 4xx |
| [posthog/dead-routes-table.md](./posthog/dead-routes-table.md) | Dead-route PostHog insight |

## QA

Start with [qa/end-to-end-qa-runbook.md](./qa/end-to-end-qa-runbook.md). Full index: [qa/README.md](./qa/README.md).
