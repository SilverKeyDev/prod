#!/usr/bin/env bash
# Remove regenerable dev/build caches (safe after git pull).
# Usage:
#   bash scripts/lib/clean-caches.sh [--aggressive]
#   source scripts/lib/clean-caches.sh && clean_dev_caches "$ROOT" [true|false]
set -euo pipefail

_clean_removed=0

_clean_log() {
  echo "clean-caches: $*"
}

_clean_rm_path() {
  local path="$1"
  if [[ ! -e "$path" && ! -L "$path" ]]; then
    return 0
  fi
  if rm -rf "$path" 2>/dev/null; then
    _clean_removed=$((_clean_removed + 1))
    _clean_log "removed ${path#"$ROOT"/}"
  else
    _clean_log "warn: could not remove ${path#"$ROOT"/}" >&2
  fi
}

_clean_find_dirs() {
  local label="$1"
  local quiet="${2:-false}"
  shift 2
  local count=0
  local warn=0
  while IFS= read -r -d '' dir; do
    if rm -rf "$dir" 2>/dev/null; then
      count=$((count + 1))
      _clean_removed=$((_clean_removed + 1))
      if [[ "$quiet" != true ]]; then
        _clean_log "removed ${dir#"$ROOT"/}"
      fi
    else
      warn=$((warn + 1))
      if [[ "$quiet" != true ]]; then
        _clean_log "warn: could not remove ${dir#"$ROOT"/}" >&2
      fi
    fi
  done < <(find "$@" -print0 2>/dev/null || true)
  if [[ "$count" -eq 0 && "$warn" -eq 0 ]]; then
    _clean_log "no ${label}"
  elif [[ "$quiet" == true ]]; then
    _clean_log "removed ${count} ${label}"
    if [[ "$warn" -gt 0 ]]; then
      _clean_log "warn: could not remove ${warn} ${label}" >&2
    fi
  fi
}

clean_dev_caches() {
  local root="${1:?root directory required}"
  local aggressive="${2:-false}"

  ROOT="$(cd "$root" && pwd)"
  _clean_removed=0

  _clean_log "clearing default caches (use --no-clean on refresh to skip)"

  # Client — task runner, Vite prebundle, tests, TypeScript incremental
  _clean_rm_path "$ROOT/Client/.turbo"
  _clean_rm_path "$ROOT/Client/coverage"
  _clean_rm_path "$ROOT/Client/node_modules/.vite"
  _clean_find_dirs "Client dist/" false "$ROOT/Client/apps" "$ROOT/Client/packages" \
    -type d -name dist -not -path '*/node_modules/*'
  _clean_find_dirs "Client *.tsbuildinfo" false "$ROOT/Client" \
    -name '*.tsbuildinfo' -not -path '*/node_modules/*'

  # NativeWind css-interop (same as scripts/run/run-ios.sh)
  local nw_cache="$ROOT/Client/node_modules/react-native-css-interop/.cache"
  if [[ -d "$nw_cache" ]]; then
    rm -f "$nw_cache"/*.js "$nw_cache"/*.map 2>/dev/null || true
    _clean_log "cleared NativeWind css-interop cache"
  fi

  # Server — pytest, mypy, ruff, coverage
  _clean_rm_path "$ROOT/Server/.pytest_cache"
  _clean_rm_path "$ROOT/Server/.mypy_cache"
  _clean_rm_path "$ROOT/Server/.ruff_cache"
  _clean_rm_path "$ROOT/Server/htmlcov"
  _clean_rm_path "$ROOT/Server/.webassets-cache"
  _clean_find_dirs "Server __pycache__ directories" true "$ROOT/Server" \
    -type d -name __pycache__ -not -path '*/.venv/*'
  for cov in "$ROOT/Server/.coverage" "$ROOT/Server"/.coverage.*; do
    [[ -e "$cov" ]] || continue
    _clean_rm_path "$cov"
  done

  # Repo root — ad-hoc CI reporter drops
  _clean_rm_path "$ROOT/junit.xml"
  for junit in "$ROOT"/junit-*.xml; do
    [[ -e "$junit" ]] || continue
    _clean_rm_path "$junit"
  done

  if [[ "$aggressive" == true ]]; then
    _clean_log "aggressive: Expo, Playwright, and extra Python artifacts"
    _clean_rm_path "$ROOT/Client/.expo"
    _clean_rm_path "$ROOT/Client/.expo-shared"
    _clean_rm_path "$ROOT/test-results"
    _clean_rm_path "$ROOT/playwright-report"
    _clean_rm_path "$ROOT/blob-report"
    _clean_rm_path "$ROOT/playwright/.cache"
    _clean_rm_path "$ROOT/Server/coverage.xml"
    _clean_rm_path "$ROOT/Server/.hypothesis"
    _clean_find_dirs "Server .pyc files" true "$ROOT/Server" \
      -name '*.pyc' -not -path '*/.venv/*'
  fi

  if [[ "$_clean_removed" -eq 0 ]]; then
    _clean_log "nothing to remove (already clean)"
  else
    _clean_log "done ($_clean_removed path(s))"
  fi
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
  AGGRESSIVE=false
  for arg in "$@"; do
    case "$arg" in
      --aggressive) AGGRESSIVE=true ;;
      -h | --help)
        echo "Usage: $0 [--aggressive]"
        echo "  Removes regenerable dev caches under Client/, Server/, and repo root."
        echo "  --aggressive  Also remove .expo, Playwright output, and extra Python artifacts."
        exit 0
        ;;
      *)
        echo "Unknown option: $arg" >&2
        echo "Usage: $0 [--aggressive]" >&2
        exit 1
        ;;
    esac
  done
  clean_dev_caches "$ROOT" "$AGGRESSIVE"
fi
