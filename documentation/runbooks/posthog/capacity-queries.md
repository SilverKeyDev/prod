# PostHog capacity queries (HogQL)

Copy-paste templates for the SilverKey project ingest (`api_request` events). Requires PostHog query access (`POSTHOG_QUERY_API_KEY` for CI dead-endpoint checks uses the same API).

Project id is hardcoded in [`Server/app/services/analytics/posthog_constants.py`](../../../../Server/app/services/analytics/posthog_constants.py).

## Dead routes (latest CI sync)

CI posts `endpoint_dead_route` (one row per dead route) and `endpoint_inventory_sync` (summary + `dead_endpoints` array) after merges to `main` and weekly. Filter by deploy:

```sql
SELECT
  properties.endpoint AS endpoint,
  properties.deploy_sha AS deploy_sha,
  timestamp
FROM events
WHERE event = 'endpoint_dead_route'
  AND timestamp > now() - INTERVAL 14 DAY
ORDER BY timestamp DESC, endpoint
LIMIT 200
```

Dead-route count over time:

```sql
SELECT
  toDate(timestamp) AS day,
  properties.deploy_sha AS deploy_sha,
  count() AS dead_routes
FROM events
WHERE event = 'endpoint_dead_route'
  AND timestamp > now() - INTERVAL 30 DAY
GROUP BY day, deploy_sha
ORDER BY day DESC
```

## p50 / p95 / p99 latency by endpoint (7 days)

```sql
SELECT
  properties.endpoint AS endpoint,
  quantile(0.5)(properties.duration_ms) AS p50_ms,
  quantile(0.95)(properties.duration_ms) AS p95_ms,
  quantile(0.99)(properties.duration_ms) AS p99_ms,
  count() AS requests
FROM events
WHERE event = 'api_request'
  AND timestamp > now() - INTERVAL 7 DAY
  AND properties.duration_ms IS NOT NULL
GROUP BY endpoint
ORDER BY requests DESC
LIMIT 50
```

## Request volume by endpoint and status class (24 hours)

```sql
SELECT
  properties.endpoint AS endpoint,
  properties.status_class AS status_class,
  count() AS requests
FROM events
WHERE event = 'api_request'
  AND timestamp > now() - INTERVAL 1 DAY
GROUP BY endpoint, status_class
ORDER BY requests DESC
LIMIT 100
```

## Slow routes (`is_slow = true`, 7 days)

```sql
SELECT
  properties.endpoint AS endpoint,
  count() AS slow_requests,
  avg(properties.duration_ms) AS avg_duration_ms
FROM events
WHERE event = 'api_request'
  AND properties.is_slow = true
  AND timestamp > now() - INTERVAL 7 DAY
GROUP BY endpoint
ORDER BY slow_requests DESC
LIMIT 30
```

## 5xx rate by route (7 days)

```sql
SELECT
  properties.endpoint AS endpoint,
  countIf(properties.status_code >= 500) AS errors_5xx,
  count() AS total,
  errors_5xx / total AS error_rate
FROM events
WHERE event = 'api_request'
  AND timestamp > now() - INTERVAL 7 DAY
GROUP BY endpoint
HAVING errors_5xx > 0
ORDER BY error_rate DESC
LIMIT 30
```

## Incident rate by route (`error_kind = server`, 7 days)

Preferred SLO after `error_kind` ships. See [posthog-api-error-semantics.md](./api-error-semantics.md).

```sql
SELECT
  properties.endpoint AS endpoint,
  countIf(properties.error_kind = 'server') AS errors_server,
  count() AS total,
  errors_server / total AS incident_rate
FROM events
WHERE event = 'api_request'
  AND timestamp > now() - INTERVAL 7 DAY
GROUP BY endpoint
HAVING errors_server > 0
ORDER BY incident_rate DESC
LIMIT 30
```

## Legacy `is_error` rate vs incident rate (7 days)

Surfaces routes that look red only because of 4xx auth/forbidden noise.

```sql
SELECT
  properties.endpoint AS endpoint,
  countIf(properties.is_error = true) AS errors_legacy,
  countIf(properties.error_kind = 'server') AS errors_server,
  countIf(properties.expected_client_error = true) AS expected_client,
  count() AS total,
  errors_legacy / total AS legacy_error_rate,
  errors_server / total AS incident_rate
FROM events
WHERE event = 'api_request'
  AND timestamp > now() - INTERVAL 7 DAY
GROUP BY endpoint
HAVING errors_legacy > 0
ORDER BY legacy_error_rate DESC
LIMIT 30
```

## Status breakdown by endpoint (7 days)

```sql
SELECT
  properties.endpoint AS endpoint,
  properties.status_code AS status_code,
  properties.error_kind AS error_kind,
  count() AS requests
FROM events
WHERE event = 'api_request'
  AND timestamp > now() - INTERVAL 7 DAY
GROUP BY endpoint, status_code, error_kind
ORDER BY endpoint, requests DESC
LIMIT 200
```

## Unexpected client errors (7 days)

4xx that are not marked expected — candidates for fixes.

```sql
SELECT
  properties.endpoint AS endpoint,
  properties.status_code AS status_code,
  properties.error_kind AS error_kind,
  count() AS requests
FROM events
WHERE event = 'api_request'
  AND timestamp > now() - INTERVAL 7 DAY
  AND properties.is_error = true
  AND properties.expected_client_error = false
  AND properties.error_kind != 'server'
GROUP BY endpoint, status_code, error_kind
ORDER BY requests DESC
LIMIT 50
```

## Latency after deploy (by `deploy_image_tag`)

Requires `DEPLOY_IMAGE_TAG` on the app container (set in [`.github/scripts/ec2-deploy.sh`](../../../../.github/scripts/ec2-deploy.sh)).

```sql
SELECT
  properties.deploy_image_tag AS deploy_image_tag,
  properties.endpoint AS endpoint,
  quantile(0.95)(properties.duration_ms) AS p95_ms,
  count() AS requests
FROM events
WHERE event = 'api_request'
  AND properties.deploy_image_tag IS NOT NULL
  AND timestamp > now() - INTERVAL 3 DAY
GROUP BY deploy_image_tag, endpoint
ORDER BY deploy_image_tag DESC, requests DESC
LIMIT 100
```

## Capacity dimensions on each event

After the scale-readiness pass, `api_request` may include:

| Property | Source |
|----------|--------|
| `deploy_image_tag` | `DEPLOY_IMAGE_TAG` env |
| `host` | Container hostname |
| `gunicorn_workers` | `WEB_CONCURRENCY` |
| `gunicorn_threads` | `GUNICORN_THREADS` |

Use these to correlate latency spikes with deploys and worker tuning changes.
