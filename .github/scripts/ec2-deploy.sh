#!/usr/bin/env bash
# ec2-deploy.sh — executed on EC2 by CI after scp.
# Required env: ACCOUNT_ID, AWS_REGION, IMAGE_TAG, REPO, DB_URL_SECRET_ID
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/_secrets-env.sh"

echo "🕒 $(date -u +'%Y-%m-%dT%H:%M:%SZ') Starting EC2 deployment..."
REGION="$AWS_REGION"
DB_SECRET_NAME="${DB_URL_SECRET_ID:-db_url}"
REPO="${REPO:-cre}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
NETWORK_NAME="cre_network"

# Ensure Docker is installed & running (quiet)
if ! command -v docker >/dev/null 2>&1; then
  sudo apt-get update -y >/dev/null 2>&1
  timeout 3m sudo apt-get install -y docker.io unzip curl >/dev/null 2>&1 || true
fi
sudo systemctl enable --now docker >/dev/null 2>&1 || sudo service docker start >/dev/null 2>&1 || true

if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker daemon not running; attempted to start it but failed."
  sudo journalctl -u docker -n 200 --no-pager || true
  exit 1
fi

# Ensure Buildx (quiet)
docker buildx version >/dev/null 2>&1 || (wget -qO- https://get.docker.com | sh >/dev/null 2>&1 && docker buildx create --use >/dev/null 2>&1) || true

# Minimal diagnostics
echo "📊 Disk usage before cleanup:"
df -h || true
docker system df || true

echo "🗑️ Cleaning Docker resources..."
# Only remove ours; avoid nuking host images unnecessarily
for name in cre_app cre_worker redis; do
  sudo docker rm -f "$name" >/dev/null 2>&1 || true
done
sudo docker system prune -af --volumes >/dev/null 2>&1 || true
sudo docker builder prune -af >/dev/null 2>&1 || true
sudo docker image prune -af >/dev/null 2>&1 || true
sudo docker volume prune -f >/dev/null 2>&1 || true

echo "🧽 Cleaning system caches..."
sudo apt-get clean >/dev/null 2>&1 || true
sudo rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/* >/dev/null 2>&1 || true
sudo journalctl --vacuum-time=3d >/dev/null 2>&1 || true
sudo rm -rf ~/.cache /root/.cache /tmp/* /var/tmp/* >/dev/null 2>&1 || true

echo "📊 Disk usage after cleanup:"
df -h || true
docker system df || true

# AWS CLI (quiet install if missing)
if ! aws --version 2>/dev/null | grep -q aws-cli; then
  curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
  unzip -q awscliv2.zip && sudo ./aws/install >/dev/null 2>&1 && rm -rf aws awscliv2.zip
fi

if ! command -v jq >/dev/null 2>&1; then
  sudo apt-get update -y >/dev/null 2>&1
  sudo apt-get install -y jq >/dev/null 2>&1 || true
fi

ACCOUNT_ID="${ACCOUNT_ID:?ACCOUNT_ID must be set}"
IMAGE="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO:$IMAGE_TAG"

aws ecr get-login-password --region "$REGION" \
  | sudo docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com" >/dev/null 2>&1

sudo docker pull "$IMAGE" 2>&1 | grep -Ev 'sha256:[0-9a-f]{64}|Pulling fs layer|Waiting|Downloading|Verifying Checksum|Download complete|Extracting' || true

# Create user-defined bridge network
sudo docker network rm "$NETWORK_NAME" >/dev/null 2>&1 || true
sudo docker network create "$NETWORK_NAME" >/dev/null 2>&1

# 1) Redis
echo "🚀 Starting Redis..."
sudo docker run -d \
  --name redis \
  --network "$NETWORK_NAME" \
  --network-alias redis \
  --health-cmd="redis-cli ping || exit 1" \
  --health-interval=30s --health-timeout=10s --health-retries=3 --health-start-period=30s \
  redis:7-alpine >/dev/null

echo "⏳ Waiting for Redis to start..."
sleep 3

# Check if Redis crashed immediately
REDIS_STATE=$(sudo docker inspect --format='{{.State.Status}}' redis 2>/dev/null || echo "missing")
if [ "$REDIS_STATE" != "running" ]; then
  echo "❌ Redis container is not running! Status: $REDIS_STATE"
  echo "📋 Container logs:"
  sudo docker logs redis 2>&1 | tail -50 || true
  EXIT_CODE=$(sudo docker inspect --format='{{.State.ExitCode}}' redis 2>/dev/null || echo "unknown")
  echo "❌ Container exit code: $EXIT_CODE"
  exit 1
fi

echo "⏳ Waiting for Redis to be healthy..."
if ! timeout 60s bash -c 'until docker inspect --format="{{.State.Health.Status}}" redis 2>/dev/null | grep -q "healthy"; do sleep 2; done'; then
  echo "❌ Redis health check failed or timed out"
  REDIS_STATE=$(sudo docker inspect --format='{{.State.Status}}' redis 2>/dev/null || echo "missing")
  REDIS_HEALTH=$(sudo docker inspect --format='{{.State.Health.Status}}' redis 2>/dev/null || echo "unknown")
  EXIT_CODE=$(sudo docker inspect --format='{{.State.ExitCode}}' redis 2>/dev/null || echo "unknown")
  echo "📋 Container status: $REDIS_STATE"
  echo "📋 Health status: $REDIS_HEALTH"
  echo "📋 Exit code: $EXIT_CODE"
  echo "📋 Container logs (last 50 lines):"
  sudo docker logs redis 2>&1 | tail -50 || true
  exit 1
fi

# Merge app secrets from AWS Secrets Manager (EC2 instance role or host credentials).
SECRET_IDS=("$DB_SECRET_NAME" AWS_Access cognito gmaps google_calendar census_api mapbox openai perplexity plaid serp slipstream skyslope docusign)

# Build env as ubuntu (merge writes need a writable file), then copy to a root-owned path for sudo docker --env-file.
ENV_BUILD=$(mktemp)
chmod 600 "$ENV_BUILD" 2>/dev/null || true
ENV_FILE="$ENV_BUILD"
DEPLOY_ENV_FILE="/root/.deploy_env"
cleanup_deploy_env_files() {
  rm -f "$ENV_BUILD" 2>/dev/null || true
  sudo rm -f "$DEPLOY_ENV_FILE" 2>/dev/null || true
}
trap cleanup_deploy_env_files EXIT

build_env_file "${SECRET_IDS[@]}"

sudo cp "$ENV_BUILD" "$DEPLOY_ENV_FILE"
sudo chmod 600 "$DEPLOY_ENV_FILE"
rm -f "$ENV_BUILD"
ENV_FILE="$DEPLOY_ENV_FILE"

# 2) App
echo "🚀 Starting App..."
sudo docker run -d \
  --name cre_app \
  --network "$NETWORK_NAME" \
  -p 5000:5000 \
  --health-cmd="curl -fsS http://localhost:5000/healthz || exit 1" \
  --health-interval=30s --health-timeout=10s --health-retries=3 --health-start-period=40s \
  --env-file "$ENV_FILE" \
  -e FLASK_ENV="production" \
  -e REDIS_URL="redis://redis:6379/0" \
  -e AWS_REGION="${AWS_REGION}" \
  "$IMAGE" >/dev/null

echo "⏳ Waiting for App to start..."
sleep 5

# Check if container crashed immediately
APP_STATE=$(sudo docker inspect --format='{{.State.Status}}' cre_app 2>/dev/null || echo "missing")
if [ "$APP_STATE" != "running" ]; then
  echo "❌ App container is not running! Status: $APP_STATE"
  echo "📋 Container logs:"
  sudo docker logs cre_app 2>&1 | tail -100 || true
  EXIT_CODE=$(sudo docker inspect --format='{{.State.ExitCode}}' cre_app 2>/dev/null || echo "unknown")
  echo "❌ Container exit code: $EXIT_CODE"
  exit 1
fi

echo "⏳ Waiting for App to be healthy..."
if ! timeout 90s bash -c 'until docker inspect --format="{{.State.Health.Status}}" cre_app 2>/dev/null | grep -q "healthy"; do sleep 2; done'; then
  echo "❌ App health check failed or timed out"
  APP_STATE=$(sudo docker inspect --format='{{.State.Status}}' cre_app 2>/dev/null || echo "missing")
  APP_HEALTH=$(sudo docker inspect --format='{{.State.Health.Status}}' cre_app 2>/dev/null || echo "unknown")
  EXIT_CODE=$(sudo docker inspect --format='{{.State.ExitCode}}' cre_app 2>/dev/null || echo "unknown")
  echo "📋 Container status: $APP_STATE"
  echo "📋 Health status: $APP_HEALTH"
  echo "📋 Exit code: $EXIT_CODE"
  echo "📋 Container logs (last 100 lines):"
  sudo docker logs cre_app 2>&1 | tail -100 || true
  exit 1
fi

# 3) Worker
echo "🚀 Starting Worker..."
sudo docker run -d \
  --name cre_worker \
  --network "$NETWORK_NAME" \
  --health-cmd="celery -A app.celery.celery_worker:celery inspect ping || exit 1" \
  --health-interval=60s --health-timeout=30s --health-retries=3 --health-start-period=60s \
  --env-file "$ENV_FILE" \
  -e FLASK_ENV="production" \
  -e REDIS_URL="redis://redis:6379/0" \
  -e AWS_REGION="${AWS_REGION}" \
  "$IMAGE" \
  celery -A app.celery.celery_worker:celery worker --loglevel=info >/dev/null 2>&1

echo "⏳ Waiting for Worker to start..."
sleep 5

# Check if Worker crashed immediately
WORKER_STATE=$(sudo docker inspect --format='{{.State.Status}}' cre_worker 2>/dev/null || echo "missing")
if [ "$WORKER_STATE" != "running" ]; then
  echo "❌ Worker container is not running! Status: $WORKER_STATE"
  echo "📋 Container logs:"
  sudo docker logs cre_worker 2>&1 | tail -100 || true
  EXIT_CODE=$(sudo docker inspect --format='{{.State.ExitCode}}' cre_worker 2>/dev/null || echo "unknown")
  echo "❌ Container exit code: $EXIT_CODE"
  exit 1
fi

echo "⏳ Waiting for Worker to be healthy..."
if ! timeout 120s bash -c 'until docker inspect --format="{{.State.Health.Status}}" cre_worker 2>/dev/null | grep -q "healthy"; do sleep 3; done'; then
  echo "❌ Worker health check failed or timed out"
  WORKER_STATE=$(sudo docker inspect --format='{{.State.Status}}' cre_worker 2>/dev/null || echo "missing")
  WORKER_HEALTH=$(sudo docker inspect --format='{{.State.Health.Status}}' cre_worker 2>/dev/null || echo "unknown")
  EXIT_CODE=$(sudo docker inspect --format='{{.State.ExitCode}}' cre_worker 2>/dev/null || echo "unknown")
  echo "📋 Container status: $WORKER_STATE"
  echo "📋 Health status: $WORKER_HEALTH"
  echo "📋 Exit code: $EXIT_CODE"
  echo "📋 Container logs (last 100 lines):"
  sudo docker logs cre_worker 2>&1 | tail -100 || true
  exit 1
fi

# ---- Export built frontend WITHOUT docker cp (avoids hangs) ----
# Use a bounded tar stream from container -> host; skip if dist missing.
echo "📦 Syncing static frontend to /var/www/html (bounded)..."
sudo mkdir -p /var/www/html
if timeout 5s sudo docker exec cre_app test -d /app/Client/dist; then
  # stream with timeout to prevent hangs > 20s
  timeout 20s bash -c \
    'sudo docker exec cre_app sh -lc "cd /app/Client/dist && tar -cf - ." | sudo tar -C /var/www/html -xf -' \
    >/dev/null 2>&1 || echo "⚠️ Frontend export timed out or failed (continuing)"
  sudo chown -R www-data:www-data /var/www/html >/dev/null 2>&1 || true
else
  echo "⚠️ /app/Client/dist not found in container; skipping export."
fi

# Final health checks - fail if any container is unhealthy or crashed
echo "🔍 Final container status check..."
FAILED_CONTAINERS=()

# Check Redis
REDIS_STATE=$(sudo docker inspect --format='{{.State.Status}}' redis 2>/dev/null || echo "missing")
REDIS_HEALTH=$(sudo docker inspect --format='{{.State.Health.Status}}' redis 2>/dev/null || echo "unknown")
if [ "$REDIS_STATE" != "running" ] || [ "$REDIS_HEALTH" != "healthy" ]; then
  echo "❌ Redis is not healthy! Status: $REDIS_STATE, Health: $REDIS_HEALTH"
  FAILED_CONTAINERS+=("redis")
else
  echo "✅ Redis: $REDIS_STATE ($REDIS_HEALTH)"
fi

# Check App
APP_STATE=$(sudo docker inspect --format='{{.State.Status}}' cre_app 2>/dev/null || echo "missing")
APP_HEALTH=$(sudo docker inspect --format='{{.State.Health.Status}}' cre_app 2>/dev/null || echo "unknown")
APP_EXIT_CODE=$(sudo docker inspect --format='{{.State.ExitCode}}' cre_app 2>/dev/null || echo "unknown")
if [ "$APP_STATE" != "running" ] || [ "$APP_HEALTH" != "healthy" ]; then
  echo "❌ App is not healthy! Status: $APP_STATE, Health: $APP_HEALTH, Exit Code: $APP_EXIT_CODE"
  echo "📋 App container logs (last 100 lines):"
  sudo docker logs cre_app 2>&1 | tail -100 || true
  FAILED_CONTAINERS+=("cre_app")
else
  echo "✅ App: $APP_STATE ($APP_HEALTH)"
fi

# Check Worker
WORKER_STATE=$(sudo docker inspect --format='{{.State.Status}}' cre_worker 2>/dev/null || echo "missing")
WORKER_HEALTH=$(sudo docker inspect --format='{{.State.Health.Status}}' cre_worker 2>/dev/null || echo "unknown")
WORKER_EXIT_CODE=$(sudo docker inspect --format='{{.State.ExitCode}}' cre_worker 2>/dev/null || echo "unknown")
if [ "$WORKER_STATE" != "running" ] || [ "$WORKER_HEALTH" != "healthy" ]; then
  echo "❌ Worker is not healthy! Status: $WORKER_STATE, Health: $WORKER_HEALTH, Exit Code: $WORKER_EXIT_CODE"
  echo "📋 Worker container logs (last 100 lines):"
  sudo docker logs cre_worker 2>&1 | tail -100 || true
  FAILED_CONTAINERS+=("cre_worker")
else
  echo "✅ Worker: $WORKER_STATE ($WORKER_HEALTH)"
fi

# Fail if any containers are unhealthy
if [ ${#FAILED_CONTAINERS[@]} -gt 0 ]; then
  echo "❌ Deployment failed! Unhealthy containers: ${FAILED_CONTAINERS[*]}"
  exit 1
fi

echo "✅ Deployment complete! All containers are healthy."

