#!/usr/bin/env bash
# EC2 deploy step 2: Clean up containers/caches, pull new image.
# Env: AWS_REGION, IMAGE_TAG, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY.
set -euo pipefail

REGION="${AWS_REGION:-us-east-2}"
REPO="cre"
IMAGE_TAG="${IMAGE_TAG:-latest}"
NETWORK_NAME="cre_network"

echo "$(date -u +'%Y-%m-%dT%H:%M:%SZ') Step 2: Cleaning up and pulling image..."

echo "Disk usage before cleanup:"
df -h || true
docker system df || true

for name in cre_app cre_worker redis; do
  sudo docker rm -f "$name" >/dev/null 2>&1 || true
done
sudo docker system prune -af --volumes >/dev/null 2>&1 || true
sudo docker builder prune -af >/dev/null 2>&1 || true
sudo docker image prune -af >/dev/null 2>&1 || true
sudo docker volume prune -f >/dev/null 2>&1 || true

sudo apt-get clean >/dev/null 2>&1 || true
sudo rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/* >/dev/null 2>&1 || true
sudo journalctl --vacuum-time=3d >/dev/null 2>&1 || true
sudo rm -rf ~/.cache /root/.cache /tmp/* /var/tmp/* >/dev/null 2>&1 || true

echo "Disk usage after cleanup:"
df -h || true
docker system df || true

if ! aws --version 2>/dev/null | grep -q aws-cli; then
  curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
  unzip -q awscliv2.zip && sudo ./aws/install >/dev/null 2>&1 && rm -rf aws awscliv2.zip
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region "$REGION")
IMAGE="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO:$IMAGE_TAG"

aws ecr get-login-password --region "$REGION" \
  | sudo docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com" >/dev/null 2>&1

sudo docker pull "$IMAGE" 2>&1 | grep -Ev 'sha256:[0-9a-f]{64}|Pulling fs layer|Waiting|Downloading|Verifying Checksum|Download complete|Extracting' || true

sudo docker network rm "$NETWORK_NAME" >/dev/null 2>&1 || true
sudo docker network create "$NETWORK_NAME" >/dev/null 2>&1

echo "IMAGE=$IMAGE" > /tmp/ec2-deploy.env
echo "NETWORK_NAME=$NETWORK_NAME" >> /tmp/ec2-deploy.env
echo "Step 2 complete: Image pulled, network ready."
