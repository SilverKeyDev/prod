# Cursor MCP local config. Source from scripts/setup/setup-mcp.sh.
# shellcheck shell=bash

MCP_NO_INSTALL="${MCP_NO_INSTALL:-false}"
MCP_SETUP_DOC="${MCP_SETUP_DOC:-setup.md}"

if ! declare -f aws_setup_list_sso_profiles >/dev/null 2>&1; then
  # shellcheck source=aws-setup.sh
  source "$(dirname "${BASH_SOURCE[0]}")/aws-setup.sh"
fi

setup_mcp_log() { echo "setup-mcp: $*"; }
setup_mcp_warn_msg() { echo "setup-mcp: WARN — $*" >&2; }
setup_mcp_fail_msg() { echo "setup-mcp: FAIL — $*" >&2; }

# Run all phases; collect issues; print summary at the end (no early exit).
setup_mcp_configure() {
  local root="$1"
  local example="${root}/.cursor/mcp.example.json"
  local target="${root}/.cursor/mcp.json"
  local -a warnings=() errors=()
  local had_hard_failure=false

  setup_mcp_log "starting (install → configure → verify → summary)"

  # --- Phase 1: install optional MCP runtimes ---
  setup_mcp_log "phase 1/4: optional tools (npx, uvx)"
  setup_mcp_ensure_npx || warnings+=("npx missing — gcloud MCP will not start (install Node 20+ or: brew install node)")
  setup_mcp_ensure_uvx || warnings+=("uvx missing — aws-api MCP will not start (install uv: https://docs.astral.sh/uv/ or: brew install uv)")

  # --- Phase 2: configure local mcp.json ---
  setup_mcp_log "phase 2/4: local config"
  if [[ ! -f "$example" ]]; then
    errors+=("missing ${example} — cannot seed .cursor/mcp.json")
  else
    if [[ -f "$target" ]]; then
      setup_mcp_log "OK — mcp.json present (unchanged)"
    else
      cp "$example" "$target"
      setup_mcp_log "OK — created mcp.json from example"
    fi
  fi

  # --- Phase 3: verify config and auth prerequisites ---
  setup_mcp_log "phase 3/4: verify config and credentials"
  if [[ -f "$target" ]]; then
    setup_mcp_verify_json "$target" || errors+=("invalid JSON in .cursor/mcp.json")
    setup_mcp_verify_github_token "$target" || warnings+=("GitHub PAT still placeholder YOUR_GITHUB_PAT — edit .cursor/mcp.json")
    setup_mcp_verify_mercury_url "$target" || warnings+=("Mercury MCP URL still placeholder — paste URL from Mercury dashboard into .cursor/mcp.json")
    setup_mcp_verify_aws_session "$root" || warnings+=("AWS session not ready — aws-api MCP needs AWS_PROFILE + aws sso login (see ${MCP_SETUP_DOC})")
    setup_mcp_verify_gcloud_adc || warnings+=("gcloud application-default credentials missing — run: gcloud auth application-default login")
    setup_mcp_verify_command_smoke || warnings+=("one or more MCP command runners failed smoke check (see phase 3 logs above)")
  else
    errors+=(".cursor/mcp.json missing after configure step")
  fi

  # --- Phase 4: Cursor handoff (always printed) ---
  setup_mcp_log "phase 4/4: finish in Cursor"
  setup_mcp_print_cursor_steps

  # --- Summary (errors/warnings after all phases) ---
  echo ""
  setup_mcp_log "summary"
  if ((${#warnings[@]} > 0)); then
    setup_mcp_log "warnings (${#warnings[@]}):"
    local w
    for w in "${warnings[@]}"; do
      echo "  - $w"
    done
  fi
  if ((${#errors[@]} > 0)); then
    had_hard_failure=true
    setup_mcp_log "errors (${#errors[@]}):"
    local e
    for e in "${errors[@]}"; do
      echo "  - $e"
    done
  fi

  if [[ "$had_hard_failure" == true ]]; then
    setup_mcp_fail_msg "completed with errors — fix items above, then re-run: make setup-mcp"
    return 1
  fi
  if ((${#warnings[@]} > 0)); then
    setup_mcp_log "done with warnings — fix summary above, then re-run make setup-mcp"
    return 0
  fi
  setup_mcp_log "completed — all automated checks passed"
  return 0
}

setup_mcp_try_brew_install() {
  local pkg="$1"
  [[ "$MCP_NO_INSTALL" == true ]] && return 1
  command -v brew >/dev/null 2>&1 || return 1
  setup_mcp_log "installing ${pkg} via Homebrew…"
  if HOMEBREW_NO_AUTO_UPDATE=1 HOMEBREW_NO_ENV_HINTS=1 brew install "$pkg" >/dev/null 2>&1; then
    setup_mcp_log "OK — installed ${pkg} via brew"
    return 0
  fi
  setup_mcp_warn_msg "brew install ${pkg} failed"
  return 1
}

setup_mcp_ensure_npx() {
  if command -v npx >/dev/null 2>&1; then
    setup_mcp_log "OK — npx $(npx --version 2>/dev/null | head -1 | tr -d '\r')"
    return 0
  fi
  if command -v node >/dev/null 2>&1 && node -e 'process.exit(+process.versions.node.split(".")[0]>=20?0:1)' 2>/dev/null; then
    setup_mcp_warn_msg "node present but npx not on PATH"
    return 1
  fi
  setup_mcp_try_brew_install node || return 1
  command -v npx >/dev/null 2>&1
}

setup_mcp_ensure_uvx() {
  if command -v uvx >/dev/null 2>&1; then
    setup_mcp_log "OK — $(uvx --version 2>/dev/null | head -1 | tr -d '\r')"
    return 0
  fi
  if command -v uv >/dev/null 2>&1; then
    setup_mcp_warn_msg "uv found but uvx not on PATH"
    return 1
  fi
  setup_mcp_try_brew_install uv || return 1
  command -v uvx >/dev/null 2>&1
}

setup_mcp_verify_json() {
  local file="$1"
  local py
  py="$(command -v python3 || command -v python || true)"
  [[ -n "$py" ]] || { setup_mcp_fail_msg "python not found — cannot validate mcp.json"; return 1; }
  if "$py" -c 'import json,sys; json.load(open(sys.argv[1]))' "$file" 2>/dev/null; then
    setup_mcp_log "OK — mcp.json is valid JSON"
    return 0
  fi
  setup_mcp_fail_msg "mcp.json is not valid JSON"
  return 1
}

setup_mcp_verify_github_token() {
  local file="$1"
  if grep -q 'YOUR_GITHUB_PAT' "$file" 2>/dev/null; then
    setup_mcp_warn_msg "replace YOUR_GITHUB_PAT in .cursor/mcp.json (fine-grained PAT or Copilot token)"
    return 1
  fi
  setup_mcp_log "OK — GitHub PAT configured"
  return 0
}

setup_mcp_verify_mercury_url() {
  local file="$1"
  if grep -q 'REPLACE_WITH_URL_FROM_MERCURY_DASHBOARD' "$file" 2>/dev/null; then
    setup_mcp_warn_msg "paste Mercury MCP URL from dashboard into .cursor/mcp.json (read-only banking)"
    return 1
  fi
  setup_mcp_log "OK — Mercury MCP URL configured"
  return 0
}

setup_mcp_resolve_aws_profile() {
  local root="${1:-}"
  if [[ -n "$root" ]]; then
    # shellcheck source=aws-sso-env.sh
    source "$(dirname "${BASH_SOURCE[0]}")/aws-sso-env.sh"
    aws_sso_source_repo_config "$root"
  fi
  [[ -n "${AWS_PROFILE:-}" ]] && return 0
  local -a profiles=()
  local p
  while IFS= read -r p; do
    [[ -n "$p" ]] && profiles+=("$p")
  done < <(aws_setup_list_sso_profiles)
  if [[ ${#profiles[@]} -eq 1 ]]; then
    export AWS_PROFILE="${profiles[0]}"
    setup_mcp_log "auto-set AWS_PROFILE=${AWS_PROFILE} (only SSO profile in ~/.aws/config)"
    return 0
  fi
  if [[ ${#profiles[@]} -gt 1 ]]; then
    setup_mcp_warn_msg "multiple SSO profiles — pick one:"
    printf '    %s\n' "${profiles[@]}" >&2
    setup_mcp_warn_msg "cp Server/config/aws-sso.example Server/config/.aws-sso — or export AWS_PROFILE=<name> && aws sso login"
  else
    setup_mcp_warn_msg "no SSO profile — run: aws configure sso"
  fi
  return 1
}

setup_mcp_print_cursor_steps() {
  echo "  • Cursor → Settings → Tools & MCP: confirm servers load"
  echo "  • GitHub: token in .cursor/mcp.json (never commit)"
  echo "  • Linear / Slack: sign in when Cursor prompts"
  echo "  • Mercury: paste MCP URL from dashboard into .cursor/mcp.json (read-only)"
  echo "  • AWS API: needs AWS_PROFILE + aws sso login"
  echo "  • gcloud MCP: npx + gcloud auth application-default login"
  echo "  • Docs: ${MCP_SETUP_DOC}, .cursor/README.md"
  echo "  • Re-run: make setup-mcp"
}

setup_mcp_verify_aws_session() {
  local root="${1:-}"
  command -v aws >/dev/null 2>&1 || {
    setup_mcp_warn_msg "aws CLI missing — brew install awscli"
    return 1
  }
  setup_mcp_resolve_aws_profile "$root" || return 1
  local -a cmd=(aws sts get-caller-identity --output text --query Account)
  [[ -n "${AWS_REGION:-}" ]] && cmd+=(--region "$AWS_REGION")
  cmd+=(--profile "$AWS_PROFILE")
  local acct err
  if acct="$("${cmd[@]}" 2>&1)"; then
    setup_mcp_log "OK — AWS session (profile ${AWS_PROFILE}, account ${acct})"
    return 0
  fi
  err="$acct"
    setup_mcp_warn_msg "AWS session invalid — run: aws sso login --profile ${AWS_PROFILE}"
    setup_mcp_warn_msg "sts error: ${err}"
  return 1
}

setup_mcp_verify_gcloud_adc() {
  command -v gcloud >/dev/null 2>&1 || {
    setup_mcp_log "skip — gcloud not installed (optional unless you use gcloud MCP)"
    return 0
  }
  if gcloud auth application-default print-access-token >/dev/null 2>&1; then
    setup_mcp_log "OK — gcloud application-default credentials"
    return 0
  fi
  setup_mcp_warn_msg "run: gcloud auth application-default login"
  return 1
}

setup_mcp_verify_command_smoke() {
  local failed=false
  if command -v uvx >/dev/null 2>&1; then
    if uvx --version >/dev/null 2>&1; then
      setup_mcp_log "OK — uvx smoke check"
    else
      setup_mcp_warn_msg "uvx --version failed"
      failed=true
    fi
  fi
  if command -v npx >/dev/null 2>&1; then
    if npx --version >/dev/null 2>&1; then
      setup_mcp_log "OK — npx smoke check"
    else
      setup_mcp_warn_msg "npx --version failed"
      failed=true
    fi
  fi
  [[ "$failed" == true ]] && return 1
  return 0
}
