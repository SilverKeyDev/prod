#!/usr/bin/env bash
# Verify SIL-145 QA accounts can log in. Prints role + pass/fail only (no tokens).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ACCOUNTS_FILE="${QA_TEST_ACCOUNTS_FILE:-$ROOT/documentation/runbooks/qa/test-accounts.json}"
LOCAL_OVERRIDE="${QA_TEST_ACCOUNTS_LOCAL:-$ROOT/documentation/runbooks/qa/test-accounts.local.json}"

if [[ ! -f "$ACCOUNTS_FILE" ]]; then
  echo "missing accounts file: $ACCOUNTS_FILE" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required" >&2
  exit 1
fi

API_BASE="$(jq -r '.baseUrls.api // empty' "$ACCOUNTS_FILE")"
if [[ -z "$API_BASE" ]]; then
  echo "baseUrls.api missing in $ACCOUNTS_FILE" >&2
  exit 1
fi

PASSWORD="$(jq -r '.sharedPassword // empty' "$ACCOUNTS_FILE")"
if [[ -f "$LOCAL_OVERRIDE" ]]; then
  LOCAL_PW="$(jq -r '.sharedPassword // empty' "$LOCAL_OVERRIDE")"
  if [[ -n "$LOCAL_PW" && "$LOCAL_PW" != "null" ]]; then
    PASSWORD="$LOCAL_PW"
  fi
fi

if [[ -z "$PASSWORD" || "$PASSWORD" == REPLACE_* ]]; then
  echo "sharedPassword not set (check test-accounts.json or test-accounts.local.json)" >&2
  exit 1
fi

LOGIN_PATH="$(jq -r '.signIn.apiLoginPath // "/api/v1/auth/login"' "$ACCOUNTS_FILE")"
FAIL=0

while IFS=$'\t' read -r role email; do
  [[ -z "$role" ]] && continue
  HTTP_CODE="$(curl -s -o /tmp/qa-login-body.json -w "%{http_code}" \
    -X POST "${API_BASE}${LOGIN_PATH}" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg email "$email" --arg password "$PASSWORD" '{email: $email, password: $password}')")"

  SUCCESS="$(jq -r '.success // false' /tmp/qa-login-body.json 2>/dev/null || echo false)"
  NEEDS_VERIFY="$(jq -r '.needs_verification // false' /tmp/qa-login-body.json 2>/dev/null || echo false)"

  if [[ "$HTTP_CODE" == "200" && "$SUCCESS" == "true" ]]; then
    echo "PASS $role ($email)"
  elif [[ "$NEEDS_VERIFY" == "true" ]]; then
    echo "FAIL $role ($email) — needs_verification (complete /verification first)"
    FAIL=1
  else
    MSG="$(jq -r '.message // .error // "login failed"' /tmp/qa-login-body.json 2>/dev/null || echo "login failed")"
    echo "FAIL $role ($email) — HTTP $HTTP_CODE — $MSG"
    FAIL=1
  fi
done < <(jq -r '.accounts[] | [.role, .email] | @tsv' "$ACCOUNTS_FILE")

rm -f /tmp/qa-login-body.json
exit "$FAIL"
