#!/usr/bin/env bash
# Build and push Docker image to ECR.
# Requires: REGION, REPO, IMAGE_TAG, VITE_GOOGLE_MAPS_ID, VITE_GOOGLE_CLIENT_ID, VITE_PLAID_CLIENT_ID in env.
# Run from repo root after ECR login.
set -euo pipefail

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "ACCOUNT_ID=$ACCOUNT_ID" >> "$GITHUB_ENV"

IMAGE_TAG="${IMAGE_TAG:-latest}"
REGION="${REGION:-us-east-2}"
REPO="${REPO:-cre}"

BASE_REF="$ACCOUNT_ID.dkr.ecr.${REGION}.amazonaws.com/$REPO"
IMAGE_REF="$BASE_REF:$IMAGE_TAG"
CACHE_REF="$BASE_REF:buildcache"
WEB_PROD_REF="$BASE_REF:web-prod"

docker buildx prune -af >/dev/null 2>&1 || true

export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain
docker buildx build \
  --platform linux/amd64 \
  -f Dockerfile.web \
  --build-arg VITE_GOOGLE_MAPS_ID="${VITE_GOOGLE_MAPS_ID:-}" \
  --build-arg VITE_GOOGLE_CLIENT_ID="${VITE_GOOGLE_CLIENT_ID:-}" \
  --build-arg VITE_PLAID_CLIENT_ID="${VITE_PLAID_CLIENT_ID:-}" \
  --tag "$IMAGE_REF" \
  --tag "$WEB_PROD_REF" \
  --cache-from type=registry,ref="$CACHE_REF" \
  --cache-to type=registry,ref="$CACHE_REF",mode=max \
  --push \
  . 2>&1 | grep -Ev 'sha256:[0-9a-f]{64}|writing layer|Verifying Checksum|Download complete|Extracting|Pulling fs layer|Waiting' || true
