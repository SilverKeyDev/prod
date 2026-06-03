# PostHog: dead API routes table

> **Last verified:** 2026-06-02

CI sync posts two event types. Only one is suitable for a **row-per-dead-route** table.

| Event | Use for table? | Why |
| ----- | -------------- | --- |
| **`endpoint_dead_route`** | **Yes** | One PostHog event per dead route; `properties.endpoint` is the row key |
| `endpoint_inventory_sync` | No (summary only) | `dead_endpoints` is a JSON array on a single event — table insights show one row per sync, not per route |

## Prerequisites

1. Merged script: `Server/scripts/endpoints/sync_inventory_posthog.py` (posts dead routes + inventory).
2. GitHub secrets on the repo that runs the workflow: `POSTHOG_PROJECT_TOKEN`, `POSTHOG_QUERY_API_KEY`.
3. Successful workflow run — log line should look like:
   `sent endpoint_inventory_sync (N routes, dead_endpoint_count=M) and M endpoint_dead_route events`

If the log only says `sent 179 endpoints` with no `endpoint_dead_route`, the repo is still on the **old** sync script.

## Option A — Insight table (UI)

1. Open PostHog → **Product analytics** → **Insights** → **New insight**.
2. Type: **Trends** (or **Table** visualization).
3. **Series:** event = `endpoint_dead_route`.
4. **Breakdown** (or table columns): property `endpoint`.
5. Optional filter: property `deploy_sha` = latest SHA from CI.
6. Date range: last 14 days (sync runs on merge + weekly).

Save to a dashboard named e.g. **API dead routes**.

## Option B — HogQL (SQL insight)

```sql
SELECT
  properties.endpoint AS endpoint,
  properties.deploy_sha AS deploy_sha,
  max(timestamp) AS last_reported_at
FROM events
WHERE event = 'endpoint_dead_route'
  AND timestamp > now() - INTERVAL 14 DAY
GROUP BY endpoint, deploy_sha
ORDER BY last_reported_at DESC, endpoint
```

Use this when you want the latest snapshot per deploy without duplicate rows from multiple syncs.

## Verify ingest

**Data management** → **Events** → search `endpoint_dead_route`. You should see events within minutes of CI completing.

Distinct count (sanity check):

```sql
SELECT count(DISTINCT properties.endpoint) AS dead_routes
FROM events
WHERE event = 'endpoint_dead_route'
  AND properties.deploy_sha = '<sha-from-ci-log>'
```

## Related

- [posthog-capacity-queries.md](./posthog-capacity-queries.md) — HogQL templates
- [deployment.md](../deployment.md) — CI secrets and `make endpoints-sync-posthog`
