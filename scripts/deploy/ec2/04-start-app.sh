#!/usr/bin/env bash
# EC2 deploy step 4: Start App container.
# Env: IMAGE, NETWORK_NAME from /tmp/ec2-deploy.env; app env vars from appleboy.
set -euo pipefail

# shellcheck source=/dev/null
[ -f /tmp/ec2-deploy.env ] && . /tmp/ec2-deploy.env
IMAGE="${IMAGE:?IMAGE not set}"
NETWORK_NAME="${NETWORK_NAME:-cre_network}"

echo "$(date -u +'%Y-%m-%dT%H:%M:%SZ') Step 4: Starting App..."

sudo docker run -d \
  --name cre_app \
  --network "$NETWORK_NAME" \
  -p 5000:5000 \
  --health-cmd="curl -fsS http://localhost:5000/livez || exit 1" \
  --health-interval=30s --health-timeout=10s --health-retries=3 --health-start-period=40s \
  -e FLASK_ENV="production" \
  -e REDIS_URL="redis://redis:6379/0" \
  -e AWS_REGION="${AWS_REGION}" \
  -e AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
  -e AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
  -e JWT_SIGNING_SECRET="${JWT_SIGNING_SECRET}" \
  -e DATABASE_URL="${DATABASE_URL}" \
  -e AWS_COGNITO_USER_POOL_ID="${AWS_COGNITO_USER_POOL_ID}" \
  -e AWS_COGNITO_CLIENT_ID="${AWS_COGNITO_CLIENT_ID}" \
  -e AWS_COGNITO_CLIENT_SECRET="${AWS_COGNITO_CLIENT_SECRET}" \
  -e GOOGLE_MAPS_API_KEY="${GOOGLE_MAPS_API_KEY}" \
  -e GOOGLE_CALENDAR_SECRET="${GOOGLE_CALENDAR_SECRET}" \
  -e GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID}" \
  -e CENSUS_API_KEY="${CENSUS_API_KEY}" \
  -e MAPBOX_API_KEY="${MAPBOX_API_KEY}" \
  -e OPENAI_KEY="${OPENAI_KEY}" \
  -e PERPLEXITY_API_KEY="${PERPLEXITY_API_KEY}" \
  -e PLAID_SANDBOX_KEY="${PLAID_SANDBOX_KEY}" \
  -e PLAID_SECRET="${PLAID_SECRET}" \
  -e EXPO_PUBLIC_PLAID_CLIENT_ID="${EXPO_PUBLIC_PLAID_CLIENT_ID}" \
  -e SERP_API="${SERP_API}" \
  -e SLIPSTREAM_PRIVATE="${SLIPSTREAM_PRIVATE}" \
  -e SLIPSTREAM_PUBLIC="${SLIPSTREAM_PUBLIC}" \
  -e SLIPSTREAM_LIC_KEY="${SLIPSTREAM_LIC_KEY}" \
  "$IMAGE" >/dev/null

sleep 5

APP_STATE=$(sudo docker inspect --format='{{.State.Status}}' cre_app 2>/dev/null || echo "missing")
if [ "$APP_STATE" != "running" ]; then
  echo "App container is not running! Status: $APP_STATE"
  sudo docker logs cre_app 2>&1 | tail -100 || true
  exit 1
fi

if ! timeout 90s bash -c 'until docker inspect --format="{{.State.Health.Status}}" cre_app 2>/dev/null | grep -q "healthy"; do sleep 2; done'; then
  echo "App health check failed or timed out"
  sudo docker logs cre_app 2>&1 | tail -100 || true
  exit 1
fi

echo "Step 4 complete: App is healthy."
