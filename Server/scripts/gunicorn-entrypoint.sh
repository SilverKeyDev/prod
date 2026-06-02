#!/usr/bin/env bash
# Env-driven Gunicorn launcher for production and local prod-mode runs.
set -euo pipefail

WEB_CONCURRENCY="${WEB_CONCURRENCY:-4}"
GUNICORN_THREADS="${GUNICORN_THREADS:-8}"
GUNICORN_TIMEOUT="${GUNICORN_TIMEOUT:-3600}"
GUNICORN_MAX_REQUESTS="${GUNICORN_MAX_REQUESTS:-1000}"
GUNICORN_MAX_REQUESTS_JITTER="${GUNICORN_MAX_REQUESTS_JITTER:-100}"
GUNICORN_WORKER_CLASS="${GUNICORN_WORKER_CLASS:-gthread}"
GUNICORN_BIND="${GUNICORN_BIND:-0.0.0.0:5000}"

args=(
  gunicorn
  --preload
  -w "${WEB_CONCURRENCY}"
  -b "${GUNICORN_BIND}"
  --timeout "${GUNICORN_TIMEOUT}"
  --worker-class "${GUNICORN_WORKER_CLASS}"
  --max-requests "${GUNICORN_MAX_REQUESTS}"
  --max-requests-jitter "${GUNICORN_MAX_REQUESTS_JITTER}"
  --access-logfile -
  --error-logfile -
)

if [[ "${GUNICORN_WORKER_CLASS}" == "gthread" ]]; then
  args+=(--threads "${GUNICORN_THREADS}")
fi

exec "${args[@]}" run:app
