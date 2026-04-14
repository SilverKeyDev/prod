#!/usr/bin/env bash
# _secrets-env.sh — fetch and merge AWS Secrets Manager secrets into $ENV_FILE
# Expects: REGION, DB_SECRET_NAME, ACCOUNT_ID, ENV_FILE to be set by caller
#
# Secret *names* to merge should match Server/secrets.sh / config/.env.example:
# lines like "# From secret: my_secret (json)" define which Secrets Manager ids to fetch.

# Read .env.example text from stdin; print unique secret ids (same convention as Server/secrets.sh).
secret_names_from_env_example_stream() {
  grep -E '^#[[:space:]]*From secret:[[:space:]]+' \
    | sed -E 's/^#[[:space:]]*From secret:[[:space:]]+([^ (]+).*/\1/' \
    | sort -u
}

# Paginated list of all secret names in REGION (matches Server/secrets.sh list_secret_names).
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
  for id in "${secret_ids[@]}"; do
    merge_sm_secret_into_env "$id"
  done
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
}
