#!/usr/bin/env bash
# EC2 deploy step 7: Final health verification for all containers.
set -euo pipefail

echo "$(date -u +'%Y-%m-%dT%H:%M:%SZ') Step 7: Verifying all containers are healthy..."

FAILED_CONTAINERS=()

REDIS_STATE=$(sudo docker inspect --format='{{.State.Status}}' redis 2>/dev/null || echo "missing")
REDIS_HEALTH=$(sudo docker inspect --format='{{.State.Health.Status}}' redis 2>/dev/null || echo "unknown")
if [ "$REDIS_STATE" != "running" ] || [ "$REDIS_HEALTH" != "healthy" ]; then
  echo "Redis is not healthy! Status: $REDIS_STATE, Health: $REDIS_HEALTH"
  FAILED_CONTAINERS+=("redis")
fi

APP_STATE=$(sudo docker inspect --format='{{.State.Status}}' cre_app 2>/dev/null || echo "missing")
APP_HEALTH=$(sudo docker inspect --format='{{.State.Health.Status}}' cre_app 2>/dev/null || echo "unknown")
if [ "$APP_STATE" != "running" ] || [ "$APP_HEALTH" != "healthy" ]; then
  echo "App is not healthy! Status: $APP_STATE, Health: $APP_HEALTH"
  sudo docker logs cre_app 2>&1 | tail -100 || true
  FAILED_CONTAINERS+=("cre_app")
fi

WORKER_STATE=$(sudo docker inspect --format='{{.State.Status}}' cre_worker 2>/dev/null || echo "missing")
WORKER_HEALTH=$(sudo docker inspect --format='{{.State.Health.Status}}' cre_worker 2>/dev/null || echo "unknown")
if [ "$WORKER_STATE" != "running" ] || [ "$WORKER_HEALTH" != "healthy" ]; then
  echo "Worker is not healthy! Status: $WORKER_STATE, Health: $WORKER_HEALTH"
  sudo docker logs cre_worker 2>&1 | tail -100 || true
  FAILED_CONTAINERS+=("cre_worker")
fi

if [ ${#FAILED_CONTAINERS[@]} -gt 0 ]; then
  echo "Deployment failed! Unhealthy containers: ${FAILED_CONTAINERS[*]}"
  exit 1
fi

echo "Step 7 complete: All containers are healthy."
echo "Deployment complete!"
