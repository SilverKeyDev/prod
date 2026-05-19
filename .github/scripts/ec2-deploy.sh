#!/usr/bin/env bash
# ec2-deploy.sh — executed on EC2 by CI after scp.
# Required env: ACCOUNT_ID, AWS_REGION, IMAGE_TAG, REPO, DB_URL_SECRET_ID
# Optional env: IMAGE_DIGEST (sha256:… from ECR; preferred over tag), DEPLOY_LOG_LINES (default 500)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/_secrets-env.sh"

# Timestamps for deploy phases (secrets merge, docker pull, health waits). Set to 0 to silence extra lines.
export DEPLOY_LOG_TIMING="${DEPLOY_LOG_TIMING:-1}"
DEPLOY_T0=$(date +%s)
deploy_phase() {
  local msg="$1"
  local now
  now=$(date +%s)
  echo "🕒 $(date -u +'%Y-%m-%dT%H:%M:%SZ') ${msg} (deploy +$((now - DEPLOY_T0))s)"
}

DEPLOY_SUCCEEDED=0
ROLLBACK_WAS_TEARDOWN=0
ROLLBACK_IMAGE=""
ROLLBACK_ENV_FILE="/root/.deploy_env.rollback"
ROLLBACK_IMAGE_FILE="/root/.deploy_rollback_image_ref"
DEPLOY_LOG_LINES="${DEPLOY_LOG_LINES:-500}"
STACK_IMAGE=""
ENV_FILE=""
DEPLOY_ENV_FILE="/root/.deploy_env"
NETWORK_NAME="cre_network"

cleanup_deploy_temp_files() {
  rm -f "${ENV_BUILD:-}" "${DEPLOY_ENV_EXAMPLE:-}" 2>/dev/null || true
}

# Full diagnostics on failure (inspect + tail + persisted log file). Surfaces Alembic/migration errors
# that are often truncated in CI SSH output.
dump_container_diagnostics() {
  local name="${1:?container name required}"
  local ts
  ts=$(date -u +'%Y%m%dT%H%M%SZ')
  local log_file="/var/log/silverkey-deploy-failure-${name}-${ts}.log"

  echo ""
  echo "══════════════════════════════════════════════════════════════"
  echo "DIAGNOSTICS: container=${name} (last ${DEPLOY_LOG_LINES} log lines + full dump)"
  echo "══════════════════════════════════════════════════════════════"

  if sudo docker inspect "$name" >/dev/null 2>&1; then
    echo "--- docker inspect (state) ---"
    sudo docker inspect "$name" --format \
      'Status={{.State.Status}} ExitCode={{.State.ExitCode}} OOMKilled={{.State.OOMKilled}} Error={{.State.Error}} StartedAt={{.State.StartedAt}} FinishedAt={{.State.FinishedAt}}' \
      2>/dev/null || true
    echo "--- docker inspect (health) ---"
    sudo docker inspect "$name" --format 'Health={{if .State.Health}}{{.State.Health.Status}}{{else}}n/a{{end}}' 2>/dev/null || true
    echo "--- docker inspect (image) ---"
    sudo docker inspect "$name" --format 'Image={{.Config.Image}} ImageID={{.Image}}' 2>/dev/null || true
  else
    echo "Container $name not found (may have been removed)."
  fi

  echo "--- docker logs (tail ${DEPLOY_LOG_LINES}) ---"
  sudo docker logs "$name" 2>&1 | tail -n "$DEPLOY_LOG_LINES" || true

  echo "--- saving full docker logs to ${log_file} ---"
  sudo mkdir -p /var/log
  sudo docker logs "$name" 2>&1 | sudo tee "$log_file" >/dev/null || true
  sudo chmod 640 "$log_file" 2>/dev/null || true
  echo "Full logs: $log_file"
  echo "══════════════════════════════════════════════════════════════"
  echo ""
}

load_rollback_image_ref() {
  if [ -n "$ROLLBACK_IMAGE" ]; then
    return 0
  fi
  if [ -f "$ROLLBACK_IMAGE_FILE" ]; then
    ROLLBACK_IMAGE=$(sudo cat "$ROLLBACK_IMAGE_FILE" 2>/dev/null || true)
    if [ -n "$ROLLBACK_IMAGE" ]; then
      echo "📌 Rollback image loaded from $ROLLBACK_IMAGE_FILE: $ROLLBACK_IMAGE"
    fi
  fi
}

# Pin rollback by image ID before pulling a new tag/digest. A mutable :latest tag would point at the
# broken image after docker pull.
capture_rollback_snapshot() {
  ROLLBACK_IMAGE=""
  if sudo docker inspect cre_app >/dev/null 2>&1; then
    local image_id prev_tag
    image_id=$(sudo docker inspect --format='{{.Image}}' cre_app)
    prev_tag="cre-rollback:predeploy-$(date -u +'%Y%m%dT%H%M%SZ')"
    if sudo docker tag "$image_id" "$prev_tag" 2>/dev/null; then
      ROLLBACK_IMAGE="$prev_tag"
      echo "$ROLLBACK_IMAGE" | sudo tee "$ROLLBACK_IMAGE_FILE" >/dev/null
      sudo chmod 600 "$ROLLBACK_IMAGE_FILE" 2>/dev/null || true
      echo "📌 Rollback image pinned locally: $ROLLBACK_IMAGE (from image id ${image_id:0:19}…)"
      echo "   Prior registry ref was: $(sudo docker inspect --format='{{.Config.Image}}' cre_app 2>/dev/null || echo unknown)"
    else
      echo "⚠️ Could not tag rollback image; rollback may be unavailable if deploy fails."
    fi
  else
    echo "ℹ️ No running cre_app; rollback will not be available if this deploy fails."
    sudo rm -f "$ROLLBACK_IMAGE_FILE" 2>/dev/null || true
  fi
  if [ -f "$DEPLOY_ENV_FILE" ]; then
    sudo cp "$DEPLOY_ENV_FILE" "$ROLLBACK_ENV_FILE"
    sudo chmod 600 "$ROLLBACK_ENV_FILE"
    echo "📌 Rollback env saved to $ROLLBACK_ENV_FILE"
  fi
}

stop_app_stack() {
  deploy_phase "BEGIN stop running stack"
  for name in cre_app cre_worker redis; do
    sudo docker rm -f "$name" >/dev/null 2>&1 || true
  done
  sudo docker network rm "$NETWORK_NAME" >/dev/null 2>&1 || true
  deploy_phase "END stop running stack"
}

ensure_app_network() {
  sudo docker network rm "$NETWORK_NAME" >/dev/null 2>&1 || true
  sudo docker network create "$NETWORK_NAME" >/dev/null 2>&1
}

start_redis_container() {
  echo "🚀 Starting Redis..."
  sudo docker run -d \
    --name redis \
    --network "$NETWORK_NAME" \
    --network-alias redis \
    --health-cmd="redis-cli ping || exit 1" \
    --health-interval=30s --health-timeout=10s --health-retries=3 --health-start-period=30s \
    redis:7-alpine >/dev/null

  deploy_phase "BEGIN Redis container start wait"
  echo "⏳ Waiting for Redis to start..."
  sleep 3

  local redis_state
  redis_state=$(sudo docker inspect --format='{{.State.Status}}' redis 2>/dev/null || echo "missing")
  if [ "$redis_state" != "running" ]; then
    echo "❌ Redis container is not running! Status: $redis_state"
    dump_container_diagnostics redis
    return 1
  fi

  deploy_phase "BEGIN Redis health wait (up to 60s)"
  echo "⏳ Waiting for Redis to be healthy..."
  if ! timeout 60s bash -c 'until sudo docker inspect --format="{{.State.Health.Status}}" redis 2>/dev/null | grep -q "healthy"; do sleep 2; done'; then
    echo "❌ Redis health check failed or timed out"
    dump_container_diagnostics redis
    return 1
  fi
  deploy_phase "END Redis health wait"
}

start_app_container() {
  local image="${1:?image required}"
  local env_file="${2:?env file required}"

  echo "🚀 Starting App ($image)..."
  sudo docker run -d \
    --name cre_app \
    --network "$NETWORK_NAME" \
    -p 5000:5000 \
    --health-cmd="curl -fsS http://localhost:5000/livez || exit 1" \
    --health-interval=30s --health-timeout=10s --health-retries=3 --health-start-period=40s \
    --env-file "$env_file" \
    -e FLASK_ENV="production" \
    -e REDIS_URL="redis://redis:6379/0" \
    -e AWS_REGION="${AWS_REGION}" \
    "$image" >/dev/null

  deploy_phase "BEGIN App container start wait (poll up to 120s)"
  echo "⏳ Waiting for App to start (watching for early exit — e.g. Alembic migrations)..."
  local app_state waited=0
  while [ "$waited" -lt 120 ]; do
    app_state=$(sudo docker inspect --format='{{.State.Status}}' cre_app 2>/dev/null || echo "missing")
    if [ "$app_state" = "exited" ] || [ "$app_state" = "dead" ]; then
      echo "❌ App container exited during startup! Status: $app_state"
      dump_container_diagnostics cre_app
      return 1
    fi
    if [ "$app_state" = "running" ]; then
      break
    fi
    sleep 2
    waited=$((waited + 2))
  done
  app_state=$(sudo docker inspect --format='{{.State.Status}}' cre_app 2>/dev/null || echo "missing")
  if [ "$app_state" != "running" ]; then
    echo "❌ App container is not running after ${waited}s! Status: $app_state"
    dump_container_diagnostics cre_app
    return 1
  fi

  deploy_phase "BEGIN App Docker health wait /livez (up to 90s)"
  echo "⏳ Waiting for App to be healthy..."
  if ! timeout 90s bash -c 'until sudo docker inspect --format="{{.State.Health.Status}}" cre_app 2>/dev/null | grep -q "healthy"; do
    st=$(sudo docker inspect --format="{{.State.Status}}" cre_app 2>/dev/null || echo missing)
    if [ "$st" = "exited" ] || [ "$st" = "dead" ]; then exit 2; fi
    sleep 2
  done'; then
    app_state=$(sudo docker inspect --format='{{.State.Status}}' cre_app 2>/dev/null || echo "missing")
    if [ "$app_state" = "exited" ] || [ "$app_state" = "dead" ]; then
      echo "❌ App exited during health wait (status: $app_state)"
    else
      echo "❌ App health check failed or timed out"
    fi
    dump_container_diagnostics cre_app
    return 1
  fi
  sleep 3
  app_state=$(sudo docker inspect --format='{{.State.Status}}' cre_app 2>/dev/null || echo "missing")
  if [ "$app_state" != "running" ]; then
    echo "❌ App exited after health check (status: $app_state)"
    dump_container_diagnostics cre_app
    return 1
  fi
  deploy_phase "END App Docker health wait"
}

start_worker_container() {
  local image="${1:?image required}"
  local env_file="${2:?env file required}"

  echo "🚀 Starting Worker ($image)..."
  sudo docker run -d \
    --name cre_worker \
    --network "$NETWORK_NAME" \
    --health-cmd="celery -A app.celery.celery_worker:celery inspect ping || exit 1" \
    --health-interval=60s --health-timeout=30s --health-retries=3 --health-start-period=60s \
    --env-file "$env_file" \
    -e FLASK_ENV="production" \
    -e REDIS_URL="redis://redis:6379/0" \
    -e AWS_REGION="${AWS_REGION}" \
    "$image" \
    celery -A app.celery.celery_worker:celery worker --loglevel=info >/dev/null 2>&1

  deploy_phase "BEGIN Worker container start wait (sleep 5s)"
  echo "⏳ Waiting for Worker to start..."
  sleep 5

  local worker_state
  worker_state=$(sudo docker inspect --format='{{.State.Status}}' cre_worker 2>/dev/null || echo "missing")
  if [ "$worker_state" != "running" ]; then
    echo "❌ Worker container is not running! Status: $worker_state"
    dump_container_diagnostics cre_worker
    return 1
  fi

  deploy_phase "BEGIN Worker Docker health wait (up to 120s)"
  echo "⏳ Waiting for Worker to be healthy..."
  if ! timeout 120s bash -c 'until sudo docker inspect --format="{{.State.Health.Status}}" cre_worker 2>/dev/null | grep -q "healthy"; do sleep 3; done'; then
    echo "❌ Worker health check failed or timed out"
    dump_container_diagnostics cre_worker
    return 1
  fi
  deploy_phase "END Worker Docker health wait"
}

start_application_stack() {
  local image="${1:?image required}"
  local env_file="${2:?env file required}"

  ensure_app_network
  start_redis_container
  start_app_container "$image" "$env_file"
  start_worker_container "$image" "$env_file"
}

prune_docker_after_success() {
  deploy_phase "BEGIN post-success docker prune"
  echo "🗑️ Pruning unused Docker resources after successful deploy..."
  sudo docker system prune -af --volumes >/dev/null 2>&1 || true
  sudo docker builder prune -af >/dev/null 2>&1 || true
  sudo docker image prune -af >/dev/null 2>&1 || true
  sudo docker volume prune -f >/dev/null 2>&1 || true
  deploy_phase "END post-success docker prune"
}

try_rollback_on_failure() {
  if [ "$DEPLOY_SUCCEEDED" = "1" ]; then
    return 0
  fi
  if [ "$ROLLBACK_WAS_TEARDOWN" != "1" ]; then
    return 0
  fi
  load_rollback_image_ref
  if [ -z "$ROLLBACK_IMAGE" ] || [ ! -f "$ROLLBACK_ENV_FILE" ]; then
    echo "⚠️ Deploy failed after teardown but rollback snapshot is missing; manual recovery required."
    echo "   Check ECR for prior image tags/digests or /var/log/silverkey-deploy-failure-*.log on this host."
    return 0
  fi
  if ! sudo docker image inspect "$ROLLBACK_IMAGE" >/dev/null 2>&1; then
    echo "⚠️ Rollback image ref is no longer on this host ($ROLLBACK_IMAGE); manual recovery required."
    echo "   Recover from ECR using a prior git-SHA tag or image digest."
    return 0
  fi

  echo "🔄 Deploy failed after stopping the previous stack — restoring $ROLLBACK_IMAGE ..."
  set +e
  stop_app_stack
  if start_application_stack "$ROLLBACK_IMAGE" "$ROLLBACK_ENV_FILE"; then
    sudo cp "$ROLLBACK_ENV_FILE" "$DEPLOY_ENV_FILE"
    sudo chmod 600 "$DEPLOY_ENV_FILE"
    echo "✅ Rollback complete — previous stack is running again."
  else
    echo "❌ Rollback failed — manual intervention required on EC2."
  fi
  set -e
}

deploy_exit_trap() {
  local exit_code=$?
  try_rollback_on_failure
  cleanup_deploy_temp_files
  exit "$exit_code"
}

trap deploy_exit_trap EXIT

echo "🕒 $(date -u +'%Y-%m-%dT%H:%M:%SZ') Starting EC2 deployment..."
REGION="$AWS_REGION"
DB_SECRET_NAME="${DB_URL_SECRET_ID:-db_url}"
REPO="${REPO:-cre}"
if [ -z "${IMAGE_TAG:-}" ]; then
  echo "ERROR: IMAGE_TAG must be set (immutable git SHA from CI; do not use :latest)." >&2
  exit 1
fi

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

docker buildx version >/dev/null 2>&1 || (wget -qO- https://get.docker.com | sh >/dev/null 2>&1 && docker buildx create --use >/dev/null 2>&1) || true

capture_rollback_snapshot

echo "📊 Disk usage before deploy:"
df -h || true
docker system df || true

echo "🧽 Light host cleanup (containers left running until new image is ready)..."
sudo apt-get clean >/dev/null 2>&1 || true
sudo rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/* >/dev/null 2>&1 || true
sudo journalctl --vacuum-time=3d >/dev/null 2>&1 || true
sudo rm -rf ~/.cache /root/.cache /tmp/* /var/tmp/* >/dev/null 2>&1 || true

if ! aws --version 2>/dev/null | grep -q aws-cli; then
  curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
  unzip -q awscliv2.zip && sudo ./aws/install >/dev/null 2>&1 && rm -rf aws awscliv2.zip
fi

if ! command -v jq >/dev/null 2>&1; then
  sudo apt-get update -y >/dev/null 2>&1
  sudo apt-get install -y jq >/dev/null 2>&1 || true
fi

ACCOUNT_ID="${ACCOUNT_ID:?ACCOUNT_ID must be set}"
ECR_BASE="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO"
IMAGE="$ECR_BASE:$IMAGE_TAG"
if [ -n "${IMAGE_DIGEST:-}" ]; then
  STACK_IMAGE="${ECR_BASE}@${IMAGE_DIGEST}"
  echo "📦 Deploy target: $STACK_IMAGE (tag $IMAGE_TAG)"
else
  STACK_IMAGE="$IMAGE"
  echo "⚠️ IMAGE_DIGEST not set; deploying by tag only: $STACK_IMAGE"
fi

deploy_phase "BEGIN ECR login"
aws ecr get-login-password --region "$REGION" \
  | sudo docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com" >/dev/null 2>&1
deploy_phase "END ECR login"

deploy_phase "BEGIN docker pull $STACK_IMAGE (old stack still running)"
sudo docker pull "$STACK_IMAGE" 2>&1 | grep -Ev 'sha256:[0-9a-f]{64}|Pulling fs layer|Waiting|Downloading|Verifying Checksum|Download complete|Extracting' || true
deploy_phase "END docker pull"

if sudo docker image inspect "$STACK_IMAGE" >/dev/null 2>&1; then
  resolved_digest=$(sudo docker image inspect --format='{{if index .RepoDigests 0}}{{index .RepoDigests 0}}{{else}}{{.Id}}{{end}}' "$STACK_IMAGE" 2>/dev/null || true)
  echo "📦 Resolved deploy image: ${resolved_digest:-unknown}"
fi

DEPLOY_ENV_EXAMPLE="$(mktemp)"
if ! sudo docker run --rm --entrypoint cat "$STACK_IMAGE" /app/Server/.env.example >"$DEPLOY_ENV_EXAMPLE" 2>/dev/null \
  || [ ! -s "$DEPLOY_ENV_EXAMPLE" ]; then
  echo "ERROR: Could not read /app/Server/.env.example from $STACK_IMAGE (needed for required-key env validation)."
  exit 1
fi

deploy_phase "BEGIN resolve secret ids from image .env.example (# From secret: lines)"
SECRET_IDS_FILE="$(mktemp)"
if ! resolve_deploy_secret_ids_from_example "$DEPLOY_ENV_EXAMPLE" >"$SECRET_IDS_FILE"; then
  echo "ERROR: Failed to resolve secret ids from .env.example." >&2
  exit 1
fi
mapfile -t SECRET_IDS < "$SECRET_IDS_FILE"
rm -f "$SECRET_IDS_FILE"
if [ "${#SECRET_IDS[@]}" -eq 0 ]; then
  echo "ERROR: No secret ids resolved for deploy." >&2
  exit 1
fi
deploy_phase "Resolved ${#SECRET_IDS[@]} secret id(s) to merge from Secrets Manager"

ENV_BUILD=$(mktemp)
chmod 600 "$ENV_BUILD" 2>/dev/null || true
ENV_FILE="$ENV_BUILD"
export ENV_EXAMPLE_VALIDATION_PATH="$DEPLOY_ENV_EXAMPLE"
deploy_phase "BEGIN Secrets Manager merge (${#SECRET_IDS[@]} secrets)"
build_env_file "${SECRET_IDS[@]}"
deploy_phase "END Secrets Manager merge"
unset ENV_EXAMPLE_VALIDATION_PATH

sudo cp "$ENV_BUILD" "$DEPLOY_ENV_FILE"
sudo chmod 600 "$DEPLOY_ENV_FILE"
rm -f "$ENV_BUILD"
ENV_FILE="$DEPLOY_ENV_FILE"

# New image is pulled and env is validated — safe to replace the running stack.
ROLLBACK_WAS_TEARDOWN=1
stop_app_stack
start_application_stack "$STACK_IMAGE" "$ENV_FILE"

echo "📦 Syncing static frontend to /var/www/html (bounded)..."
sudo mkdir -p /var/www/html
if timeout 5s sudo docker exec cre_app test -d /app/Client/dist; then
  timeout 20s bash -c \
    'sudo docker exec cre_app sh -lc "cd /app/Client/dist && tar -cf - ." | sudo tar -C /var/www/html -xf -' \
    >/dev/null 2>&1 || echo "⚠️ Frontend export timed out or failed (continuing)"
  sudo chown -R www-data:www-data /var/www/html >/dev/null 2>&1 || true
else
  echo "⚠️ /app/Client/dist not found in container; skipping export."
fi

echo "🔍 Final container status check..."
FAILED_CONTAINERS=()

REDIS_STATE=$(sudo docker inspect --format='{{.State.Status}}' redis 2>/dev/null || echo "missing")
REDIS_HEALTH=$(sudo docker inspect --format='{{.State.Health.Status}}' redis 2>/dev/null || echo "unknown")
if [ "$REDIS_STATE" != "running" ] || [ "$REDIS_HEALTH" != "healthy" ]; then
  echo "❌ Redis is not healthy! Status: $REDIS_STATE, Health: $REDIS_HEALTH"
  FAILED_CONTAINERS+=("redis")
else
  echo "✅ Redis: $REDIS_STATE ($REDIS_HEALTH)"
fi

APP_STATE=$(sudo docker inspect --format='{{.State.Status}}' cre_app 2>/dev/null || echo "missing")
APP_HEALTH=$(sudo docker inspect --format='{{.State.Health.Status}}' cre_app 2>/dev/null || echo "unknown")
if [ "$APP_STATE" != "running" ] || [ "$APP_HEALTH" != "healthy" ]; then
  echo "❌ App is not healthy! Status: $APP_STATE, Health: $APP_HEALTH"
  dump_container_diagnostics cre_app
  FAILED_CONTAINERS+=("cre_app")
else
  echo "✅ App: $APP_STATE ($APP_HEALTH)"
fi

WORKER_STATE=$(sudo docker inspect --format='{{.State.Status}}' cre_worker 2>/dev/null || echo "missing")
WORKER_HEALTH=$(sudo docker inspect --format='{{.State.Health.Status}}' cre_worker 2>/dev/null || echo "unknown")
if [ "$WORKER_STATE" != "running" ] || [ "$WORKER_HEALTH" != "healthy" ]; then
  echo "❌ Worker is not healthy! Status: $WORKER_STATE, Health: $WORKER_HEALTH"
  dump_container_diagnostics cre_worker
  FAILED_CONTAINERS+=("cre_worker")
else
  echo "✅ Worker: $WORKER_STATE ($WORKER_HEALTH)"
fi

if [ ${#FAILED_CONTAINERS[@]} -gt 0 ]; then
  echo "❌ Deployment failed! Unhealthy containers: ${FAILED_CONTAINERS[*]}"
  exit 1
fi

DEPLOY_SUCCEEDED=1
prune_docker_after_success

echo "✅ Deployment complete! All containers are healthy."
