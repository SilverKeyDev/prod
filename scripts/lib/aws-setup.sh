# AWS SSO login for local setup (terminal / ~/.aws/config only).
# shellcheck shell=bash

aws_setup_die() { echo "aws-setup: $*" >&2; exit 1; }

aws_setup_load_env() {
  export AWS_REGION="${AWS_REGION:-us-east-2}"
  return 0
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

aws_setup_is_tty() {
  [[ -t 0 && -t 1 ]]
}

aws_setup_print_sso_help() {
  cat >&2 <<'EOF'
aws-setup: Connect AWS SSO from your terminal:

  1. Configure SSO once (interactive):
       aws configure sso

  2. Set your profile for this shell (use the profile name from step 1):
       export AWS_PROFILE=your-dev-profile
       export AWS_REGION=us-east-2

  3. Log in:
       aws sso login --profile "$AWS_PROFILE"

  Then re-run: make setup

Docs: setup.md (One-time AWS config)
EOF
}

aws_setup_run_configure_sso() {
  echo "aws-setup: No SSO profile in ~/.aws/config — starting interactive setup..."
  echo "aws-setup: (aws configure sso — follow the prompts in your terminal)"
  if ! aws configure sso; then
    echo "aws-setup: aws configure sso did not complete" >&2
    return 1
  fi
  echo "aws-setup: SSO profile saved to ~/.aws/config"
  return 0
}

aws_setup_pick_profile() {
  local root="$1"
  aws_setup_load_env "$root"

  if [[ -n "${AWS_PROFILE:-}" ]]; then
    echo "$AWS_PROFILE"
    return 0
  fi

  local -a profiles=()
  while IFS= read -r p; do
    [[ -n "$p" ]] && profiles+=("$p")
  done < <(aws_setup_list_sso_profiles)

  if [[ ${#profiles[@]} -eq 0 ]]; then
    echo "aws-setup: no SSO profile in ~/.aws/config" >&2
    if aws_setup_is_tty; then
      if aws_setup_run_configure_sso; then
        profiles=()
        while IFS= read -r p; do
          [[ -n "$p" ]] && profiles+=("$p")
        done < <(aws_setup_list_sso_profiles)
      else
        aws_setup_print_sso_help
        return 1
      fi
    else
      aws_setup_print_sso_help
      return 1
    fi
  fi

  if [[ ${#profiles[@]} -eq 1 ]]; then
    export AWS_PROFILE="${profiles[0]}"
    echo "aws-setup: using SSO profile from ~/.aws/config: ${AWS_PROFILE}"
    echo "$AWS_PROFILE"
    return 0
  fi

  echo "aws-setup: multiple SSO profiles in ~/.aws/config:" >&2
  printf '  - %s\n' "${profiles[@]}" >&2
  echo "aws-setup: pick one and re-run setup:" >&2
  echo "  export AWS_PROFILE=<profile-name>" >&2
  echo "  aws sso login --profile \"\$AWS_PROFILE\"" >&2
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
  aws_setup_load_env "$root"
  export AWS_REGION="${AWS_REGION:-us-east-2}"

  if ! picked="$(aws_setup_pick_profile "$root")"; then
    return 1
  fi
  export AWS_PROFILE="${AWS_PROFILE:-$picked}"

  if aws_setup_session_ok; then
    local acct
    acct="$(aws sts get-caller-identity --region "$AWS_REGION" --output text --query Account --profile "$AWS_PROFILE")"
    echo "aws-setup: AWS session already valid (profile=${AWS_PROFILE}, account ${acct})"
    return 0
  fi

  echo "aws-setup: logging in via terminal (profile=${AWS_PROFILE})..."
  echo "aws-setup: running: aws sso login --profile ${AWS_PROFILE}"
  if ! aws sso login --profile "$AWS_PROFILE"; then
    echo "aws-setup: login failed. Try manually:" >&2
    echo "  aws sso login --profile ${AWS_PROFILE}" >&2
    aws_setup_die "aws sso login failed for profile '${AWS_PROFILE}'"
  fi

  if ! aws_setup_session_ok; then
    aws_setup_die "SSO login finished but sts get-caller-identity still failed (check AWS_PROFILE and region)"
  fi
  local acct
  acct="$(aws sts get-caller-identity --region "$AWS_REGION" --output text --query Account --profile "$AWS_PROFILE")"
  echo "aws-setup: SSO login OK (profile=${AWS_PROFILE}, account ${acct}, region ${AWS_REGION})"
  echo "aws-setup: tip: export AWS_PROFILE=${AWS_PROFILE} AWS_REGION=${AWS_REGION} in your shell profile"
}
