# Optional repo-local AWS defaults: Server/config/.aws-sso (gitignored).
# Source from bash or POSIX sh. Shell env wins when already set before load.
#
#   cp Server/config/aws-sso.example Server/config/.aws-sso

aws_sso_env_file() {
  root="$1"
  echo "${root}/Server/config/.aws-sso"
}

aws_sso_source_repo_config() {
  root="$1"
  file="$(aws_sso_env_file "$root")"
  [ -f "$file" ] || return 0

  _saved_profile="${AWS_PROFILE:-}"
  _saved_region="${AWS_REGION:-}"
  # shellcheck disable=SC1090
  . "$file"
  [ -n "$_saved_profile" ] && AWS_PROFILE="$_saved_profile" && export AWS_PROFILE
  [ -n "$_saved_region" ] && AWS_REGION="$_saved_region" && export AWS_REGION
  return 0
}

aws_sso_is_interactive() {
  [ -t 0 ] && [ -t 1 ]
}

aws_sso_session_valid() {
  _region="$1"
  _profile="$2"
  _err_file="$3"
  if [ -n "$_err_file" ]; then
    aws sts get-caller-identity --region "$_region" --profile "$_profile" >/dev/null 2>"$_err_file"
  else
    aws sts get-caller-identity --region "$_region" --profile "$_profile" >/dev/null 2>&1
  fi
}

aws_sso_err_is_expired() {
  _file="$1"
  grep -qiE 'token has expired|refresh failed' "$_file" 2>/dev/null
}

# Ensure a valid AWS SSO session for profile/region.
# On expired token + interactive terminal: runs `aws sso login` (unless AWS_SSO_NO_AUTO_LOGIN=1).
# Profile name is whatever the caller passed (from .aws-sso, env, or CLI arg) — never hardcoded here.
aws_sso_ensure_session() {
  _region="$1"
  _profile="$2"
  _err="$(mktemp)"

  if aws_sso_session_valid "$_region" "$_profile" "$_err"; then
    rm -f "$_err"
    return 0
  fi

  if aws_sso_err_is_expired "$_err" \
    && aws_sso_is_interactive \
    && [ "${AWS_SSO_NO_AUTO_LOGIN:-}" != "1" ]; then
    printf '%s\n' "aws-sso: session expired — running: aws sso login --profile ${_profile}" >&2
    rm -f "$_err"
    if aws sso login --profile "$_profile"; then
      _err="$(mktemp)"
      if aws_sso_session_valid "$_region" "$_profile" "$_err"; then
        rm -f "$_err"
        printf '%s\n' "aws-sso: login OK (profile=${_profile})" >&2
        return 0
      fi
    fi
    _err="$(mktemp)"
    aws sts get-caller-identity --region "$_region" --profile "$_profile" >/dev/null 2>"$_err" || true
  fi

  if aws_sso_err_is_expired "$_err"; then
    if aws_sso_is_interactive; then
      printf 'Error: SSO login failed for profile=%s\n' "$_profile" >&2
    else
      printf 'Error: SSO session expired (profile=%s). Run: aws sso login --profile %s\n' "$_profile" "$_profile" >&2
    fi
  else
    cat "$_err" >&2
    printf 'Error: AWS credentials invalid for profile=%s\n' "$_profile" >&2
  fi
  rm -f "$_err"
  return 1
}
