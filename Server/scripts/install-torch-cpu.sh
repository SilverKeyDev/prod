#!/usr/bin/env bash
# Install CPU-only torch without pulling the multi-GB CUDA wheel from PyPI on Linux.
#
# Preferred path: pip + https://download.pytorch.org/whl/cpu (matches runtime.txt pin).
# Fallback: direct CloudFront wheel URL when pip resolves metadata via
# download-r2.pytorch.org and TLS handshake fails (common on GitHub Actions).
#
# Usage (from repo root or Server/): bash Server/scripts/install-torch-cpu.sh
# Optional: TORCH_VERSION=2.10.0 TORCH_INDEX_URL=https://download.pytorch.org/whl/cpu
set -euo pipefail

TORCH_VERSION="${TORCH_VERSION:-2.10.0}"
TORCH_INDEX_URL="${TORCH_INDEX_URL:-https://download.pytorch.org/whl/cpu}"
TORCH_PIP_RETRIES="${TORCH_PIP_RETRIES:-3}"
TORCH_PIP_RETRY_SLEEP_SEC="${TORCH_PIP_RETRY_SLEEP_SEC:-5}"

log() {
  echo "install-torch-cpu: $*"
}

warn() {
  echo "install-torch-cpu: WARN $*" >&2
}

python_tag() {
  python -c 'import sys; print(f"cp{sys.version_info.major}{sys.version_info.minor}")'
}

install_from_pypi() {
  log "installing torch==${TORCH_VERSION} from PyPI (non-Linux or aarch64 fallback)"
  pip install --no-cache-dir "torch==${TORCH_VERSION}"
}

install_from_pytorch_index() {
  log "installing torch==${TORCH_VERSION} from ${TORCH_INDEX_URL}"
  pip install --no-cache-dir "torch==${TORCH_VERSION}" --index-url "$TORCH_INDEX_URL"
}

install_from_direct_wheel_url() {
  local wheel_url="$1"
  log "installing from direct wheel URL (bypasses download-r2 metadata): ${wheel_url}"
  pip install --no-cache-dir "$wheel_url"
}

linux_x86_64_direct_wheel_url() {
  local py_tag="$1"
  echo "${TORCH_INDEX_URL}/torch-${TORCH_VERSION}%2Bcpu-${py_tag}-${py_tag}-manylinux_2_28_x86_64.whl"
}

try_pytorch_index_with_retries() {
  local attempt=1
  while (( attempt <= TORCH_PIP_RETRIES )); do
    if install_from_pytorch_index; then
      return 0
    fi
    if (( attempt < TORCH_PIP_RETRIES )); then
      warn "PyTorch index install failed (attempt ${attempt}/${TORCH_PIP_RETRIES}); retrying in ${TORCH_PIP_RETRY_SLEEP_SEC}s"
      sleep "$TORCH_PIP_RETRY_SLEEP_SEC"
    fi
    attempt=$((attempt + 1))
  done
  return 1
}

install_linux() {
  local arch py_tag wheel_url
  arch="$(uname -m)"
  py_tag="$(python_tag)"

  if try_pytorch_index_with_retries; then
    return 0
  fi

  warn "PyTorch index install failed after ${TORCH_PIP_RETRIES} attempts; trying direct wheel URL"

  if [[ "$arch" == "x86_64" ]]; then
    wheel_url="$(linux_x86_64_direct_wheel_url "$py_tag")"
    install_from_direct_wheel_url "$wheel_url"
    return 0
  fi

  warn "no direct-wheel fallback for linux ${arch}; trying PyPI"
  install_from_pypi
}

main() {
  if [[ "$(uname -s)" != "Linux" ]]; then
    install_from_pypi
    return 0
  fi
  install_linux
}

main "$@"
