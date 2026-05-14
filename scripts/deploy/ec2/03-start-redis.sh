#!/usr/bin/env bash
# EC2 deploy step 3: Start Redis container.
# Env: NETWORK_NAME from /tmp/ec2-deploy.env (set by step 2).
set -euo pipefail

# shellcheck source=/dev/null
[ -f /tmp/ec2-deploy.env ] && . /tmp/ec2-deploy.env
NETWORK_NAME="${NETWORK_NAME:-cre_network}"

echo "$(date -u +'%Y-%m-%dT%H:%M:%SZ') Step 3: Starting Redis..."

sudo docker run -d \
  --name redis \
  --network "$NETWORK_NAME" \
  --network-alias redis \
  --health-cmd="redis-cli ping || exit 1" \
  --health-interval=30s --health-timeout=10s --health-retries=3 --health-start-period=30s \
  redis:7-alpine >/dev/null

sleep 3

REDIS_STATE=$(sudo docker inspect --format='{{.State.Status}}' redis 2>/dev/null || echo "missing")
if [ "$REDIS_STATE" != "running" ]; then
  echo "Redis container is not running! Status: $REDIS_STATE"
  sudo docker logs redis 2>&1 | tail -50 || true
  exit 1
fi

if ! timeout 60s bash -c 'until docker inspect --format="{{.State.Health.Status}}" redis 2>/dev/null | grep -q "healthy"; do sleep 2; done'; then
  echo "Redis health check failed or timed out"
  sudo docker logs redis 2>&1 | tail -50 || true
  exit 1
fi

echo "Step 3 complete: Redis is healthy."
