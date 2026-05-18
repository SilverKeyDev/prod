#!/usr/bin/env bash
# Open the Vite dev root and /admin in Google Chrome if those URLs are not already open in Chrome.
# Respects WEB_DEV_PORT (default 5173). Set OPEN_LOCALHOST_CHROME=0 to skip (e.g. from CI).
#
# macOS: detects existing Chrome tabs. Other platforms: opens both URLs via xdg-open.

set -euo pipefail

[[ "${OPEN_LOCALHOST_CHROME:-1}" == "1" ]] || exit 0

WEB_DEV_PORT="${WEB_DEV_PORT:-5173}"
BASE="http://localhost:${WEB_DEV_PORT}"
ROOT_URL="${BASE}/"
ADMIN_URL="${BASE}/admin"

open_urls_generic() {
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "${ROOT_URL}" 2>/dev/null || true
    xdg-open "${ADMIN_URL}" 2>/dev/null || true
  else
    echo "open-localhost-chrome.sh: install xdg-open or run on macOS with Google Chrome" >&2
    exit 1
  fi
}

if [[ "$(uname)" != "Darwin" ]]; then
  open_urls_generic
  exit 0
fi

if ! osascript - "$BASE" "$ADMIN_URL" "$ROOT_URL" <<'APPLESCRIPT'
on run argv
  set base to item 1 of argv
  set adminUrl to item 2 of argv
  set rootUrl to item 3 of argv
  tell application "Google Chrome"
    activate
    set rootMissing to true
    set adminMissing to true
    repeat with w in windows
      repeat with t in tabs of w
        set u to URL of t
        if (u starts with adminUrl & "/") or (u is adminUrl) then
          set adminMissing to false
        else if (u is base) or (u is rootUrl) or ((u starts with base & "/") and not (u starts with adminUrl)) then
          set rootMissing to false
        end if
      end repeat
    end repeat
    if (count of windows) is 0 then
      make new window
    end if
    if rootMissing then
      tell window 1 to make new tab with properties {URL:rootUrl}
    end if
    if adminMissing then
      tell window 1 to make new tab with properties {URL:adminUrl}
    end if
  end tell
end run
APPLESCRIPT
then
  echo "open-localhost-chrome.sh: Google Chrome automation failed; trying open(1)..." >&2
  open -a "Google Chrome" "${ROOT_URL}" 2>/dev/null || open "${ROOT_URL}" 2>/dev/null || true
  open -a "Google Chrome" "${ADMIN_URL}" 2>/dev/null || open "${ADMIN_URL}" 2>/dev/null || true
fi
