#!/usr/bin/env bash
# EC2 deploy step 1: Ensure Docker is installed and running.
# Env: none required.
set -euo pipefail

echo "$(date -u +'%Y-%m-%dT%H:%M:%SZ') Step 1: Ensuring Docker is installed and running..."

if ! command -v docker >/dev/null 2>&1; then
  sudo apt-get update -y >/dev/null 2>&1
  timeout 3m sudo apt-get install -y docker.io unzip curl >/dev/null 2>&1 || true
fi
sudo systemctl enable --now docker >/dev/null 2>&1 || sudo service docker start >/dev/null 2>&1 || true

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon not running; attempted to start it but failed."
  sudo journalctl -u docker -n 200 --no-pager || true
  exit 1
fi

docker buildx version >/dev/null 2>&1 || (wget -qO- https://get.docker.com | sh >/dev/null 2>&1 && docker buildx create --use >/dev/null 2>&1) || true

echo "Step 1 complete: Docker is ready."
