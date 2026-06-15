#!/usr/bin/env bash
# Deprecated: use scripts/setup/setup-local.sh or `make setup`.
echo "scripts/setup-local.sh: use make setup (this path is deprecated)" >&2
exec bash "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/setup/setup-local.sh" "$@"
