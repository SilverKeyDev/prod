#!/usr/bin/env bash
# _secrets-env.sh — fetch and merge AWS Secrets Manager secrets into $ENV_FILE
# Expects: REGION, DB_SECRET_NAME, ACCOUNT_ID, ENV_FILE to be set by caller
# Optional: ENV_EXAMPLE_VALIDATION_PATH — if set to a Server/.env.example file,
#           build_env_file() fails unless every KEY= in that template has a non-empty value in $ENV_FILE
#           (same keys as Server/app/utils/config_validator.py).
#
# Secret *names* to merge should match Server/scripts/secrets.sh / .env.example:
# lines like "# From secret: my_secret (json)" define which Secrets Manager ids to fetch.
# EC2 deploy (.github/scripts/ec2-deploy.sh) merges only those ids (plus DB_SECRET_NAME), not every secret in the region.

# Read .env.example text from stdin; print unique secret ids (same convention as Server/scripts/secrets.sh).
secret_names_from_env_example_stream() {
  grep -E '^#[[:space:]]*From secret:[[:space:]]+' \
    | sed -E 's/^#[[:space:]]*From secret:[[:space:]]+([^ (]+).*/\1/' \
    | sort -u
}

# Paginated list of all secret names in REGION (matches Server/scripts/secrets.sh list_secret_names).
list_secretsmanager_secret_names() {
  local next="" page
  while :; do
    if [ -z "$next" ]; then
      page="$(aws secretsmanager list-secrets --region "$REGION" --max-results 100 --output json)" || return 1
    else
      page="$(aws secretsmanager list-secrets --region "$REGION" --max-results 100 --next-token "$next" --output json)" || return 1
    fi
    echo "$page" | jq -r '.SecretList[]?.Name // empty'
    next="$(echo "$page" | jq -r '.NextToken // empty')"
    [ -z "$next" ] && break
  done
}

fetch_secret_raw() {
  aws secretsmanager get-secret-value \
    --secret-id "$1" --region "$REGION" \
    --query SecretString --output text 2>/dev/null || true
}

log_secret_fetch_failure() {
  local id="$1"
  echo "--- aws secretsmanager get-secret-value (diagnostic, secret-id=$id region=$REGION) ---"
  aws secretsmanager get-secret-value \
    --secret-id "$id" --region "$REGION" \
    --query SecretString --output text 2>&1 || true
  echo "--- end diagnostic ---"
}

merge_sm_secret_into_env() {
  local id="$1"
  local raw
  raw="$(fetch_secret_raw "$id")"
  raw="${raw//$'\r'/}"
  [ -z "$raw" ] && return 0

  if jq -e 'type == "object"' <<<"$raw" >/dev/null 2>&1; then
    # Database secret is often stored as key/value with field name db_url (not DATABASE_URL).
    if [ "$id" = "$DB_SECRET_NAME" ]; then
      local _du
      _du="$(jq -r '
        [
          .DATABASE_URL, .database_url, .db_url, .url,
          .connection_string, .connectionString, .uri, .URI
        ] | map(select(. != null and (. | type == "string") and (. != ""))) | first // empty
      ' <<<"$raw")"
      if [ -n "$_du" ] && [ "$_du" != "null" ]; then
        printf 'DATABASE_URL=%s\n' "$_du" >> "$ENV_FILE"
      fi
    fi
    jq -r 'to_entries[] | select(.value | type == "string" or type == "number" or type == "boolean") | "\(.key)=\(.value)"' <<<"$raw" >> "$ENV_FILE" 2>/dev/null || true
    return 0
  fi

  if jq -e 'type == "string"' <<<"$raw" >/dev/null 2>&1; then
    local val
    val="$(jq -r '.' <<<"$raw")"
    case "$id" in
      "$DB_SECRET_NAME") printf 'DATABASE_URL=%s\n' "$val" >> "$ENV_FILE" ;;
    esac
    return 0
  fi

  case "$id" in
    "$DB_SECRET_NAME") printf 'DATABASE_URL=%s\n' "$raw" >> "$ENV_FILE" ;;
  esac
}

# Secret ids referenced by Server/.env.example only ("# From secret: name ...").
# Ensures DB_SECRET_NAME is included. Prints one secret name per line (sorted, unique).
resolve_deploy_secret_ids_from_example() {
  local example_file="$1"
  local tmp
  tmp="$(mktemp)"
  if [ ! -f "$example_file" ] || [ ! -s "$example_file" ]; then
    echo "ERROR: .env.example file missing or empty: $example_file" >&2
    rm -f "$tmp"
    return 1
  fi
  if ! secret_names_from_env_example_stream <"$example_file" | sort -u >"$tmp"; then
    rm -f "$tmp"
    return 1
  fi
  if [ ! -s "$tmp" ]; then
    echo "ERROR: No '# From secret:' entries found in $example_file (cannot build deploy env)." >&2
    rm -f "$tmp"
    return 1
  fi
  if ! grep -Fxq "$DB_SECRET_NAME" "$tmp" 2>/dev/null; then
    printf '%s\n' "$DB_SECRET_NAME" >>"$tmp"
  fi
  sort -u "$tmp"
  rm -f "$tmp"
}

# Same key extraction as Server/app/utils/config_validator.py (KEY= lines only).
required_env_keys_from_example_file() {
  local f="$1"
  [ -f "$f" ] || return 1
  sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' "$f" \
    | grep -v '^#' \
    | grep -v '^$' \
    | sed -n 's/^\([A-Za-z_][A-Za-z0-9_]*\)[[:space:]]*=.*/\1/p'
}

# True if env-file has KEY= with a non-empty value (after trim / simple quote strip).
env_file_has_nonempty_value() {
  local file="$1" key="$2"
  local line val
  line="$(grep "^${key}=" "$file" 2>/dev/null | tail -n 1 || true)"
  [ -z "$line" ] && return 1
  val="${line#*=}"
  val="${val%$'\r'}"
  val="${val#"${val%%[![:space:]]*}"}"
  val="${val%"${val##*[![:space:]]}"}"
  case "$val" in
    \"*\") val="${val#\"}"; val="${val%\"}" ;;
    \'*\') val="${val#\'}"; val="${val%\'}" ;;
  esac
  [ -n "$val" ]
}

# Fail if $ENV_FILE is missing any key required by Server/.env.example (non-empty value).
validate_env_file_against_example() {
  local envf="$1" exf="$2"
  local missing=()
  local key
  while IFS= read -r key; do
    [ -z "$key" ] && continue
    if ! env_file_has_nonempty_value "$envf" "$key"; then
      missing+=("$key")
    fi
  done < <(required_env_keys_from_example_file "$exf" | sort -u)

  if [ ${#missing[@]} -gt 0 ]; then
    echo "ERROR: Missing or empty required environment variables (from .env.example): ${missing[*]}" >&2
    echo "Fix: ensure AWS secrets include these keys and the instance role can read them." >&2
    return 1
  fi
  return 0
}

# If merge flattened JSON to db_url=... (or similar) but not DATABASE_URL=, copy for the app.
ensure_database_url_alias() {
  grep -q '^DATABASE_URL=' "$ENV_FILE" 2>/dev/null && return 0
  local line val key
  for key in db_url database_url url URI uri; do
    line="$(grep -E "^${key}=" "$ENV_FILE" 2>/dev/null | head -1 || true)"
    [ -z "$line" ] && continue
    val="${line#*=}"
    [ -z "$val" ] && continue
    printf 'DATABASE_URL=%s\n' "$val" >> "$ENV_FILE"
    return 0
  done
}

build_env_file() {
  local secret_ids=("$@")
  local id
  if [ "${DEPLOY_LOG_TIMING:-}" = "1" ]; then
    echo "🕒 $(date -u +'%Y-%m-%dT%H:%M:%SZ') build_env_file: GetSecretValue merge starting (${#secret_ids[@]} secret(s))"
  fi
  for id in "${secret_ids[@]}"; do
    merge_sm_secret_into_env "$id"
  done
  if [ "${DEPLOY_LOG_TIMING:-}" = "1" ]; then
    echo "🕒 $(date -u +'%Y-%m-%dT%H:%M:%SZ') build_env_file: GetSecretValue merge finished (${#secret_ids[@]} secret(s))"
  fi
  ensure_database_url_alias

  if ! grep -q '^DATABASE_URL=' "$ENV_FILE"; then
    echo "ERROR: DATABASE_URL missing after merging Secrets Manager."
    echo "Fix: ensure secret ${DB_SECRET_NAME} is readable (instance role secretsmanager:GetSecretValue) and uses SecretString (not binary-only). Expected formats:"
    echo "  - JSON object with DATABASE_URL, db_url, database_url, url, or connection_string, or"
    echo "  - plaintext connection string, or"
    echo "  - JSON string (quoted URL)."
    if [ -z "$(fetch_secret_raw "$DB_SECRET_NAME")" ]; then
      echo "Hint: get-secret-value for ${DB_SECRET_NAME} returned empty (check IAM GetSecretValue on arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:${DB_SECRET_NAME}*, secret name/region, or SecretString vs SecretBinary)."
      log_secret_fetch_failure "$DB_SECRET_NAME"
    fi
    exit 1
  fi

  if [ -n "${ENV_EXAMPLE_VALIDATION_PATH:-}" ] && [ -f "$ENV_EXAMPLE_VALIDATION_PATH" ]; then
    validate_env_file_against_example "$ENV_FILE" "$ENV_EXAMPLE_VALIDATION_PATH" || exit 1
  fi
}
