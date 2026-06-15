#!/usr/bin/env bash
# Run pre-commit hooks for manual use (make precommit). Surfaces hook warnings/errors
# but does not fail the Make target — same hooks as git commit (also non-blocking).
set -u

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

PC_CMD=()
for pc in "$REPO_ROOT/Server/.venv/bin/pre-commit" "$REPO_ROOT/Server/venv/bin/pre-commit"; do
  if [ -x "$pc" ]; then
    PC_CMD=("$pc")
    break
  fi
done

if [ "${#PC_CMD[@]}" -eq 0 ]; then
  for py in "$REPO_ROOT/Server/.venv/bin/python3" "$REPO_ROOT/Server/.venv/bin/python"; do
    if [ -x "$py" ] && "$py" -m pre_commit version >/dev/null 2>&1; then
      PC_CMD=("$py" -m pre_commit)
      break
    fi
  done
fi

if [ "${#PC_CMD[@]}" -eq 0 ]; then
  if command -v pre-commit >/dev/null 2>&1; then
    PC_CMD=(pre-commit)
  elif python3 -m pre_commit version >/dev/null 2>&1; then
    PC_CMD=(python3 -m pre_commit)
  fi
fi

if [ "${#PC_CMD[@]}" -eq 0 ]; then
  echo "error: pre-commit not found. Run: make setup   (or: pip install pre-commit in Server/.venv — see Server/requirements/dev.txt)" >&2
  exit 127
fi

STATUS=0
"${PC_CMD[@]}" run --all-files "$@" || STATUS=$?

if [ "$STATUS" -eq 127 ]; then
  exit 127
fi

if [ "$STATUS" -ne 0 ]; then
  echo "" >&2
  echo "pre-commit: hooks finished with issues or auto-fixes (exit $STATUS). Review output above; full gate: make lint" >&2
fi

exit 0
