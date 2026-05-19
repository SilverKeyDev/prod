# AWS SSO profile + login for local setup. Source from setup-local.sh.
# shellcheck shell=bash

aws_setup_die() { echo "aws-setup: $*" >&2; exit 1; }

aws_setup_load_env() {
  local root="$1"
  if [[ -n "${AWS_ACCESS_KEY_ID:-}" ]]; then
    return 0
  fi
  if [[ -f "${root}/Server/config/.aws-sso" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "${root}/Server/config/.aws-sso"
    set +a
    echo "aws-setup: loaded Server/config/.aws-sso (profile=${AWS_PROFILE:-unset})"
    return 0
  fi
  return 0
}

aws_setup_ensure_sso_file() {
  local root="$1"
  local target="${root}/Server/config/.aws-sso"
  local example="${root}/Server/config/aws-sso.example"
  if [[ -f "$target" ]]; then
    return 0
  fi
  if [[ ! -f "$example" ]]; then
    aws_setup_die "Missing ${example}"
  fi
  cp "$example" "$target"
  echo "aws-setup: created ${target} from aws-sso.example"
  echo "aws-setup: edit AWS_PROFILE in that file, then re-run make setup" >&2
  aws_setup_die "Set AWS_PROFILE in Server/config/.aws-sso before continuing"
}

aws_setup_list_sso_profiles() {
  local config="${AWS_CONFIG_FILE:-$HOME/.aws/config}"
  [[ -f "$config" ]] || return 0
  awk '
    /^\[profile / { name=$2; sub(/\]$/, "", name); has_sso=0 }
    /^\[sso-session / { name=$2; sub(/\]$/, "", name); has_sso=1 }
    /sso_start_url|sso_session/ { if (name != "") print name }
  ' "$config" 2>/dev/null | sort -u
}

aws_setup_pick_profile() {
  local root="$1"
  aws_setup_load_env "$root"
  if [[ -n "${AWS_PROFILE:-}" && "$AWS_PROFILE" != "your-sso-profile-name" ]]; then
    echo "$AWS_PROFILE"
    return 0
  fi
  local -a profiles=()
  while IFS= read -r p; do
    [[ -n "$p" ]] && profiles+=("$p")
  done < <(aws_setup_list_sso_profiles)
  if [[ ${#profiles[@]} -eq 1 ]]; then
    export AWS_PROFILE="${profiles[0]}"
    echo "aws-setup: using sole SSO profile: ${AWS_PROFILE}"
    echo "$AWS_PROFILE"
    return 0
  fi
  if [[ ${#profiles[@]} -gt 1 ]]; then
    echo "aws-setup: multiple SSO profiles found in ~/.aws/config:" >&2
    printf '  - %s\n' "${profiles[@]}" >&2
    echo "aws-setup: set AWS_PROFILE in Server/config/.aws-sso and re-run make setup" >&2
    return 1
  fi
  echo "aws-setup: no SSO profile found. Run: aws configure sso" >&2
  echo "aws-setup: then set AWS_PROFILE in Server/config/.aws-sso" >&2
  return 1
}

aws_setup_session_ok() {
  local region="${AWS_REGION:-us-east-2}"
  local -a cmd=(aws sts get-caller-identity --region "$region" --output text --query Account)
  [[ -z "${AWS_ACCESS_KEY_ID:-}" && -n "${AWS_PROFILE:-}" ]] && cmd+=(--profile "$AWS_PROFILE")
  "${cmd[@]}" >/dev/null 2>&1
}

aws_setup_login() {
  local root="$1" picked=""
  aws_setup_ensure_sso_file "$root" || return 1
  aws_setup_load_env "$root"
  if ! picked="$(aws_setup_pick_profile "$root")"; then
    return 1
  fi
  export AWS_PROFILE="${AWS_PROFILE:-$picked}"
  export AWS_REGION="${AWS_REGION:-us-east-2}"

  if aws_setup_session_ok; then
    local acct
    acct="$(aws sts get-caller-identity --region "$AWS_REGION" --output text --query Account ${AWS_PROFILE:+--profile "$AWS_PROFILE"})"
    echo "aws-setup: AWS session already valid (account ${acct})"
    return 0
  fi

  if [[ -z "${AWS_PROFILE:-}" ]]; then
    aws_setup_die "AWS_PROFILE is not set (edit Server/config/.aws-sso)"
  fi

  echo "aws-setup: opening SSO login for profile '${AWS_PROFILE}'..."
  if ! aws sso login --profile "$AWS_PROFILE"; then
    aws_setup_die "aws sso login failed for profile '${AWS_PROFILE}'"
  fi

  if ! aws_setup_session_ok; then
    aws_setup_die "SSO login completed but sts get-caller-identity still failed"
  fi
  local acct
  acct="$(aws sts get-caller-identity --region "$AWS_REGION" --output text --query Account --profile "$AWS_PROFILE")"
  echo "aws-setup: SSO login OK (account ${acct}, region ${AWS_REGION})"
}
