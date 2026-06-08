#!/usr/bin/env bash
# write-ephemeral-ssh-key.sh — write EC2 SSH private key to a chmod-600 temp file for appleboy key_path.
# Env: EC2_SSH_KEY (multiline PEM). Sets EC2_SSH_KEY_FILE in GITHUB_ENV (path only; never logs key material).
set -euo pipefail
set +x

if [ -z "${EC2_SSH_KEY:-}" ]; then
  echo "ERROR: EC2_SSH_KEY is not set" >&2
  exit 1
fi

if [ -z "${GITHUB_ENV:-}" ]; then
  echo "ERROR: GITHUB_ENV is not set (run inside GitHub Actions)" >&2
  exit 1
fi

umask 077
EC2_SSH_KEY_FILE="${RUNNER_TEMP}/ec2_deploy_ssh_key"
printf '%s\n' "$EC2_SSH_KEY" >"$EC2_SSH_KEY_FILE"
chmod 600 "$EC2_SSH_KEY_FILE"
unset EC2_SSH_KEY

echo "EC2_SSH_KEY_FILE=$EC2_SSH_KEY_FILE" >>"$GITHUB_ENV"
echo "Ephemeral EC2 SSH key file ready."
