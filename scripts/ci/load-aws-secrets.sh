#!/usr/bin/env bash
# Load app env from AWS Secrets Manager into GITHUB_ENV.
# Requires: AWS CLI configured, jq installed.
# Used by: ci_web, sunday_newsletter, sunday_newsletter_test
set -euo pipefail

fetch_json() {
  local id="$1"
  aws secretsmanager get-secret-value \
    --secret-id "$id" \
    --query SecretString \
    --output text 2>/dev/null || echo '{}'
}

export_if_present() {
  local json="$1" jkey="$2" envname="$3"
  local val
  val="$(jq -er --arg k "$jkey" '.[$k] // empty' <<<"$json" 2>/dev/null || true)"
  if [ -n "${val:-}" ]; then
    printf '%s=%s\n' "$envname" "$val" >> "$GITHUB_ENV"
  fi
}

db_url_json="$(fetch_json db_url)"
aws_access_json="$(fetch_json AWS_Access)"
cognito_json="$(fetch_json cognito)"
gmaps_json="$(fetch_json gmaps)"
gcal_json="$(fetch_json google_calendar)"
census_json="$(fetch_json census_api)"
mapbox_json="$(fetch_json mapbox)"
openai_json="$(fetch_json openai)"
perplexity_json="$(fetch_json perplexity)"
plaid_json="$(fetch_json plaid)"
serp_json="$(fetch_json serp)"
rapidapi_json="$(fetch_json rapidapi)"

export_if_present "$db_url_json" "DATABASE_URL" "DATABASE_URL"

export_if_present "$aws_access_json" "AWS_ACCESS_KEY_ID" "AWS_ACCESS_KEY_ID"
export_if_present "$aws_access_json" "AWS_SECRET_ACCESS_KEY" "AWS_SECRET_ACCESS_KEY"

export_if_present "$cognito_json" "AWS_COGNITO_USER_POOL_ID" "AWS_COGNITO_USER_POOL_ID"
export_if_present "$cognito_json" "AWS_COGNITO_CLIENT_ID" "AWS_COGNITO_CLIENT_ID"
export_if_present "$cognito_json" "AWS_COGNITO_CLIENT_SECRET" "AWS_COGNITO_CLIENT_SECRET"

export_if_present "$gmaps_json" "GOOGLE_MAPS_API_KEY" "GOOGLE_MAPS_API_KEY"

export_if_present "$gcal_json" "GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_ID"
export_if_present "$gcal_json" "GOOGLE_CALENDAR_SECRET" "GOOGLE_CALENDAR_SECRET"

export_if_present "$census_json" "CENSUS_API_KEY" "CENSUS_API_KEY"
export_if_present "$mapbox_json" "MAPBOX_API_KEY" "MAPBOX_API_KEY"

export_if_present "$openai_json" "OPENAI_KEY" "OPENAI_KEY"
export_if_present "$perplexity_json" "PERPLEXITY_API_KEY" "PERPLEXITY_API_KEY"

export_if_present "$plaid_json" "PLAID_SANDBOX_KEY" "PLAID_SANDBOX_KEY"
export_if_present "$plaid_json" "PLAID_SECRET" "PLAID_SECRET"
export_if_present "$plaid_json" "VITE_PLAID_CLIENT_ID" "VITE_PLAID_CLIENT_ID"

export_if_present "$serp_json" "SERP_API" "SERP_API"
export_if_present "$rapidapi_json" "RAPIDAPI_KEY" "RAPIDAPI_KEY"
