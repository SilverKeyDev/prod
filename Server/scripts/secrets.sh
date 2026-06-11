#!/usr/bin/env sh
# Fetch AWS Secrets Manager items and rewrite Server/.env for local dev.
# Usage (from repo root):
#   bash Server/scripts/secrets.sh [region] [profile]
#
# Behavior:
# - Profile/region: optional [profile] arg, then shell AWS_* env, then Server/config/.aws-sso
#   (copy aws-sso.example → .aws-sso; gitignored). SSO still lives in ~/.aws/config.
# - Expired SSO on an interactive terminal: runs `aws sso login` automatically (same as make setup).
#   Set AWS_SSO_NO_AUTO_LOGIN=1 to only print the command (CI / non-TTY).
# - Lists every secret in the account for the chosen region (paginated); no hardcoded names.
# - Each secret may be:
#     (a) flat JSON object -> expands to KEY=VALUE lines
#     (b) dotenv text -> KEY=VALUE lines (even if \n-escaped in SecretString)
#     (c) scalar -> falls back to SECRET_NAME=<value>
# - Rewrites ./.env (real values) and ./.env.example (same keys, empty placeholder values)
# - Moves EXPO_PUBLIC_* keys into ../../Client/.env and Client/.env.example (see scripts/lib/client-env-from-secrets.sh)

set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT="$(cd "$SERVER_DIR/.." && pwd)"
cd "$SERVER_DIR" || exit 1

# shellcheck source=../../scripts/lib/aws-sso-env.sh
. "$ROOT/scripts/lib/aws-sso-env.sh"
aws_sso_source_repo_config "$ROOT"

REGION="${1:-${AWS_REGION:-us-east-2}}"
PROFILE="${2:-${AWS_PROFILE:-}}"
LOCAL_DATABASE_URL="${LOCAL_DATABASE_URL:-postgresql://silverkey:silverkey@localhost:5432/silverkey_dev}"
ALLOW_SHARED_DATABASE_URL="${ALLOW_SHARED_DATABASE_URL:-0}"

log() { printf '%s\n' "$*" >&2; }
die() { printf 'Error: %s\n' "$*" >&2; exit 1; }
have_cmd() { command -v "$1" >/dev/null 2>&1; }

# ---- parsing helpers ----

# jq JSON -> KEY=VALUE lines (flat object)
json_to_env_lines() {
  if have_cmd jq; then
    jq -r 'if type=="object" then to_entries[]|"\(.key)=\"\(.value|tostring)\"" else empty end'
  else
    python3 - <<'PY'
import sys,json
try:
    obj=json.load(sys.stdin)
except Exception:
    sys.exit(0)
if isinstance(obj, dict):
    for k,v in obj.items():
        print(f'{k}="{v}"')
PY
  fi
}

# Extract SecretString or SecretBinary from AWS response
extract_secret_payload() {
  if have_cmd jq; then
    jq -r 'if .SecretString then .SecretString
           elif .SecretBinary then .SecretBinary
           else empty end'
  else
    python3 - <<'PY'
import sys,json
j=json.load(sys.stdin)
if j.get('SecretString') is not None:
    print(j['SecretString'])
elif j.get('SecretBinary') is not None:
    print(j['SecretBinary'])
PY
  fi
}

looks_like_json_object() {
  case "$1" in
    \{*) return 0 ;;
    *)   return 1 ;;
  esac
}

# Turn backslash escapes (\n, \t, \x..) into real characters; strip CR
unescape_backslashes() {
  # Use printf %b which interprets backslash escapes; then remove \r
  # shellcheck disable=SC2059
  printf '%b' "$1" | tr -d '\r'
}

# Detect if text appears to be dotenv lines (at least one KEY=VALUE)
looks_like_dotenv() {
  printf '%s' "$1" | grep -Eq '^[A-Za-z_][A-Za-z0-9_]*='
}

env_file_value() {
  key="$1"
  file="$2"
  [ -f "$file" ] || return 0
  awk -F= -v key="$key" '
    $1 == key {
      val = substr($0, index($0, "=") + 1)
    }
    END {
      gsub(/^"/, "", val)
      gsub(/"$/, "", val)
      print val
    }
  ' "$file"
}

is_database_secret_name() {
  case "$1" in
    db_url|database_url|DATABASE_URL|*/db_url|*/db|*/database|*/database/*|*silverkey*database*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

is_local_database_url() {
  case "$1" in
    *localhost*|*127.0.0.1*|*::1*|*silverkey-dev-postgres*|*postgres:5432*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

# KEY="value" lines -> KEY="" for a safe template (same keys, no secrets)
env_lines_to_example_template() {
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    key="${line%%=*}"
    printf '%s\n' "${key}=\"\""
  done
}

# List all secret names (paginated). Uses jq when available; otherwise Python + AWS CLI.
list_secret_names() {
  if have_cmd jq; then
    next=""
    while :; do
      if [ -z "$next" ]; then
        page="$(aws secretsmanager list-secrets $AWS_ARGS --max-results 100 --output json)" || return 1
      else
        page="$(aws secretsmanager list-secrets $AWS_ARGS --max-results 100 --next-token "$next" --output json)" || return 1
      fi
      echo "$page" | jq -r '.SecretList[]?.Name // empty'
      next="$(echo "$page" | jq -r '.NextToken // empty')"
      [ -z "$next" ] && break
    done
  else
    SECRETS_LIST_REGION="$REGION" SECRETS_LIST_PROFILE="${PROFILE:-}" python3 - <<'PY'
import json
import os
import subprocess

region = os.environ["SECRETS_LIST_REGION"]
profile = os.environ.get("SECRETS_LIST_PROFILE") or ""
cmd_base = [
    "aws",
    "secretsmanager",
    "list-secrets",
    "--region",
    region,
    "--max-results",
    "100",
    "--output",
    "json",
]
if not os.environ.get("AWS_ACCESS_KEY_ID") and profile:
    cmd_base.extend(["--profile", profile])
token = None
while True:
    cmd = list(cmd_base)
    if token:
        cmd.extend(["--next-token", token])
    out = subprocess.check_output(cmd, text=True)
    data = json.loads(out)
    for item in data.get("SecretList") or []:
        name = item.get("Name")
        if name:
            print(name)
    token = data.get("NextToken")
    if not token:
        break
PY
  fi
}

# ---- credentials (~/.aws/config SSO; profile from env, .aws-sso, or arg) ----
have_cmd aws || die "aws CLI not found."

if [ -z "${PROFILE:-}" ]; then
  die "AWS profile not set. Copy Server/config/aws-sso.example to Server/config/.aws-sso, or export AWS_PROFILE, or: make secrets PROFILE=<name>"
fi

AWS_ARGS="--region $REGION"
if [ -z "${AWS_ACCESS_KEY_ID:-}" ] && [ -n "${PROFILE:-}" ]; then
  AWS_ARGS="$AWS_ARGS --profile $PROFILE"
fi

if ! aws_sso_ensure_session "$REGION" "$PROFILE"; then
  exit 1
fi

# ---- assemble fresh .env ----
tmp_env="$(mktemp)"
tmp_example="$(mktemp)"
tmp_names="$(mktemp)"
trap 'rm -f "$tmp_env" "$tmp_example" "$tmp_names"' EXIT

stamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
{
  echo "# Auto-generated by Server/scripts/secrets.sh on $stamp"
  echo "# Region: $REGION"
  echo
} > "$tmp_env"
{
  echo "# Regenerated by Server/scripts/secrets.sh on $stamp (placeholder values only — run bash Server/scripts/secrets.sh for real credentials)"
  echo "# Region: $REGION"
  echo
} > "$tmp_example"

existing_database_url="$(env_file_value DATABASE_URL .env || printf '')"
database_url_to_write="$LOCAL_DATABASE_URL"
if [ -n "$existing_database_url" ]; then
  if is_local_database_url "$existing_database_url"; then
    database_url_to_write="$existing_database_url"
    log "Preserving local DATABASE_URL from existing Server/.env."
  else
    log "Ignoring existing non-local DATABASE_URL for local dev. Set ALLOW_SHARED_DATABASE_URL=1 to fetch a shared DB secret explicitly."
  fi
fi

if ! list_secret_names > "$tmp_names"; then
  die "Failed to list secrets (check region, credentials, and secretsmanager:ListSecrets permission)"
fi
if [ ! -s "$tmp_names" ]; then
  die "No secrets found in region $REGION"
fi

for SECRET_ID in $(sort -u "$tmp_names"); do
  if [ "$ALLOW_SHARED_DATABASE_URL" != "1" ] && is_database_secret_name "$SECRET_ID"; then
    log "Skipping database secret for local dev: $SECRET_ID"
    continue
  fi

  log "Fetching secret: $SECRET_ID"
  if ! out="$(aws secretsmanager get-secret-value --secret-id "$SECRET_ID" $AWS_ARGS 2>/dev/null)"; then
    die "Failed to fetch $SECRET_ID (check name, region, credentials)"
  fi

  raw_payload="$(printf '%s' "$out" | extract_secret_payload)"
  [ -n "$raw_payload" ] || die "Secret $SECRET_ID payload empty"

  # Try base64-decode if it looks like binary; ignore errors
  payload="$raw_payload"
  if ! looks_like_json_object "$payload"; then
    if printf '%s' "$payload" | base64 -d >/dev/null 2>&1; then
      payload="$(printf '%s' "$payload" | base64 -d || printf '%s' "$payload")"
    fi
  fi

  # Convert \n sequences into real newlines and strip CR
  payload="$(unescape_backslashes "$payload")"

  if looks_like_json_object "$payload"; then
    lines="$(printf '%s' "$payload" | json_to_env_lines || printf '')"
    [ -n "$lines" ] || die "Secret $SECRET_ID parsed to no key/values (ensure flat JSON)"
    {
      echo "# From secret: $SECRET_ID (json)"
      printf '%s\n\n' "$lines"
    } >> "$tmp_env"
    {
      echo "# From secret: $SECRET_ID (json)"
      printf '%s\n' "$lines" | env_lines_to_example_template
      echo
    } >> "$tmp_example"
  elif looks_like_dotenv "$payload"; then
    normalized="$(
      printf '%s\n' "$payload" | awk 'NF && $0 !~ /^[[:space:]]*#/ {
        if (match($0, /^([^=]+)=(.*)$/, arr)) {
          key = arr[1]
          val = arr[2]
          gsub(/^["'\'']|["'\'']$/, "", val)
          print key "=\"" val "\""
        } else {
          print
        }
      }'
    )"
    {
      echo "# From secret: $SECRET_ID (dotenv)"
      printf '%s\n' "$normalized"
      echo
    } >> "$tmp_env"
    {
      echo "# From secret: $SECRET_ID (dotenv)"
      printf '%s\n' "$normalized" | env_lines_to_example_template
      echo
    } >> "$tmp_example"
  else
    key="$(printf '%s' "$SECRET_ID" | tr ' ' '_' )"
    {
      echo "# From secret: $SECRET_ID (scalar)"
      echo "${key}=\"${payload}\""
      echo
    } >> "$tmp_env"
    {
      echo "# From secret: $SECRET_ID (scalar)"
      echo "${key}=\"\""
      echo
    } >> "$tmp_example"
  fi
done

if ! grep -q '^DATABASE_URL=' "$tmp_env"; then
  {
    echo "# Local dev database (not fetched from shared/prod Secrets Manager)"
    echo "DATABASE_URL=\"$database_url_to_write\""
    echo
  } >> "$tmp_env"
  {
    echo "# Local dev database (placeholder only)"
    echo "DATABASE_URL=\"\""
    echo
  } >> "$tmp_example"
fi

# ---- split EXPO_PUBLIC_* to Client, then rewrite Server .env files ----
# shellcheck source=../../scripts/lib/client-env-from-secrets.sh
. "$ROOT/scripts/lib/client-env-from-secrets.sh"
split_client_public_env_from_server "$tmp_env" "$tmp_example" "$ROOT/Client" "$REGION" "$stamp"

mv "$tmp_env" .env
mv "$tmp_example" .env.example
chmod 600 .env || true
chmod 644 .env.example || true
log "Wrote fresh .env and .env.example."
