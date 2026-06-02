# PostHog capacity queries (HogQL)

Copy-paste templates for the SilverKey project ingest (`api_request` events). Requires PostHog query access (`POSTHOG_QUERY_API_KEY` for CI dead-endpoint checks uses the same API).

Project id is hardcoded in [`Server/app/services/analytics/posthog_constants.py`](../../Server/app/services/analytics/posthog_constants.py).

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

## Latency after deploy (by `deploy_image_tag`)

Requires `DEPLOY_IMAGE_TAG` on the app container (set in [`.github/scripts/ec2-deploy.sh`](../../../.github/scripts/ec2-deploy.sh)).

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
