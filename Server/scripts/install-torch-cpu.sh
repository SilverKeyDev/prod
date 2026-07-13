#!/usr/bin/env bash
# install-torch-cpu.sh
# Installs PyTorch CPU-only build for Docker environments without GPU.
# Used in backend Docker build to avoid pulling the large CUDA-enabled torch package.
set -euo pipefail

pip install --no-cache-dir \
  torch \
  --index-url https://download.pytorch.org/whl/cpu \
  --quiet \
  --disable-pip-version-check
