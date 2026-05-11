#!/usr/bin/env bash
# Run Prettier using the Client workspace (pnpm + repo config). Avoids pre-commit's
# nodeenv (HTTPS/SSL to fetch Node) by using the project's Node toolchain.
set -euo pipefail
_HERE="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
cd "${_HERE}/../Client" || exit 1
rel=()
for f in "$@"; do
  rel+=("${f#Client/}")
done
if [ "${#rel[@]}" -eq 0 ]; then
  exit 0
fi
exec pnpm exec prettier \
  --config packages/config/prettier/prettier.config.js \
  --ignore-path packages/config/prettier/.prettierignore \
  --write \
  "${rel[@]}"
