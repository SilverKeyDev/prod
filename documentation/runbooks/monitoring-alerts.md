# Monitoring and alerts

SilverKey uses PostHog for backend error/request telemetry and Slack `#alerts` for first-response notifications. The app exposes `GET /livez`, `GET /healthz`, and `GET /readyz`; run the uptime probe from outside the app host so process-down and box-down failures are visible.

## Signals

| Signal | Source | Alert path |
| ------ | ------ | ---------- |
| Backend handled 5xx errors | `backend_error` PostHog events from Flask error handlers | PostHog error tracking / dashboards |
| API 5xx spikes | `api_request` PostHog events with `status_code >= 500` | `make monitor-5xx-alert` |
| Process-down / unhealthy app | External `GET /healthz` probe | `make monitor-health-alert` |

## Required secrets

| Secret | Purpose |
| ------ | ------- |
| `POSTHOG_PROJECT_TOKEN` | Runtime ingest token; enables `api_request` and `backend_error` events |
| `POSTHOG_QUERY_API_KEY` | Query token with `query:read` for 5xx spike alerts |
| `SLACK_ALERTS_WEBHOOK_URL` | Incoming Slack webhook pointed at `#alerts` |
| `SILVERKEY_HEALTH_URL` | External health URL, e.g. staging `https://staging.example.com/healthz` |
| `SILVERKEY_SERVICE_NAME` | Alert label, e.g. `SilverKey staging` |

## One-minute staging monitor

Run the health probe from an external host or monitor runner, not the app EC2 box:

```bash
* * * * * cd /srv/silverkey/prod && SILVERKEY_SERVICE_NAME="SilverKey staging" SILVERKEY_HEALTH_URL="https://staging.example.com/healthz" SLACK_ALERTS_WEBHOOK_URL="https://hooks.slack.com/services/..." make monitor-health-alert
```

Run the PostHog 5xx spike alert every minute for staging with a low threshold:

```bash
* * * * * cd /srv/silverkey/prod && SILVERKEY_SERVICE_NAME="SilverKey staging" POSTHOG_QUERY_API_KEY="phx_..." SLACK_ALERTS_WEBHOOK_URL="https://hooks.slack.com/services/..." make monitor-5xx-alert ARGS="--window-minutes 1 --threshold 1"
```

If your cron wrapper cannot pass Makefile variables cleanly, run the script directly:

```bash
cd /srv/silverkey/prod/Server && . .venv/bin/activate && POSTHOG_QUERY_API_KEY="phx_..." SLACK_ALERTS_WEBHOOK_URL="https://hooks.slack.com/services/..." python3 scripts/monitoring/alert_5xx_spike.py --window-minutes 1 --threshold 1 --service-name "SilverKey staging"
```

## Kill test

1. Confirm the external monitor has `SLACK_ALERTS_WEBHOOK_URL` pointed at `#alerts`.
2. Confirm `SILVERKEY_HEALTH_URL` points to staging `/healthz`.
3. Stop the staging app container or process.
4. Within the next one-minute monitor interval, Slack `#alerts` should receive `SilverKey staging health check failed`.
5. Restart staging and confirm `curl -fsS "$SILVERKEY_HEALTH_URL"` returns HTTP 200.

For a local dry run that does not post to Slack:

```bash
python3 scripts/ops/check_health_alert.py --url http://127.0.0.1:1/healthz --service-name "SilverKey staging" --dry-run
```

## PostHog error tracking

Backend PostHog is initialized in `Server/app/posthog_client.py` with exception autocapture enabled when `POSTHOG_PROJECT_TOKEN` is set. Flask 500/502/503/504 and database error handlers also emit sanitized `backend_error` events without full URLs, request bodies, headers, or exception messages.

`api_request` events continue to include `status_code`, `status_class`, `is_server_error`, `route_pattern`, `request_id`, latency, host, and deploy tag. Use [posthog-capacity-queries.md](./posthog/capacity-queries.md) for dashboard queries.
