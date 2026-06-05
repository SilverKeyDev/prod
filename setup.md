# SilverKey local setup

Run **`make setup`** once on a new machine (six steps: prerequisites → build → AWS SSO → secrets → verify → Cursor MCP). Skip AWS/secrets: `make setup ARGS='--skip-secrets'`. After every `git pull`: **`make refresh`**.

Deep MCP and Cursor tuning: [`.cursor/README.md`](.cursor/README.md), [cursor-configuration-optimization.md](documentation/client/tooling/cursor-configuration-optimization.md), [cursor-agent-memory.md](documentation/client/tooling/cursor-agent-memory.md).

---

## One-time AWS config

```bash
aws configure sso
export AWS_PROFILE=your-dev-profile-name
export AWS_REGION=us-east-2
aws sso login --profile "$AWS_PROFILE"
```

**Per-repo profile (recommended):** `cp Server/config/aws-sso.example Server/config/.aws-sso` — used by `make setup`, `make secrets`, `make refresh --secrets`. Shell `export AWS_PROFILE` overrides `.aws-sso`.

---

## Prerequisites

| Tool | Version |
| ---- | ------- |
| Node.js | 20+ |
| pnpm | 9.x (`corepack prepare pnpm@9.0.0 --activate`) |
| Python | 3.10–3.13 |
| Redis | 6+ |
| libmagic | MIME validation on uploads |
| AWS CLI | v2 (unless `--skip-secrets`) |
| PostgreSQL | For `make dev` — `DATABASE_URL` in `Server/.env` |

### macOS (quick)

```bash
brew install node python@3.12 redis libmagic awscli
corepack enable && corepack prepare pnpm@9.0.0 --activate
brew services start redis   # optional
```

**Port 5000:** Disable **AirPlay Receiver** (System Settings → General → AirDrop & Handoff) if `make dev` cannot reach `/healthz`.

**iCloud-synced clones:** Prefer `~/Developer/…` — avoids duplicate `module 2.py` files; CI runs `scripts/ci/check-macos-duplicate-files.sh`.

### Linux

Debian/Ubuntu: `python3`, `python3-venv`, `redis-server`, `libmagic1`, `awscli`. Fedora: `python3`, `redis`, `file-libs`, `awscli`. Windows: **WSL2** + Linux steps.

---

## Commands

| Command | Purpose |
| ------- | ------- |
| `make setup` | Full first-time flow |
| `make setup-mcp` | Cursor MCP install/verify only |
| `make refresh` | Post-pull cache clear + deps (`ARGS='--no-clean'`, `--aggressive-clean`) |
| `make check-deps` | Prerequisite scan |
| `make secrets` | Re-fetch `Server/.env` |
| `make dev` | Web + API |
| `./scripts/setup/check-deps.sh` | Same as `make check-deps` |

### Setup flags

| Flag | Effect |
| ---- | ------ |
| `--skip-secrets` | Skip SSO + Secrets Manager |
| `--no-install` | No Homebrew/corepack installs |
| `--ci` | Slimmer Python (`requirements/ci.txt`) |

`DEPS_CMD_TIMEOUT` (default 600s) — increase for slow first `pnpm`/`corepack` runs.

---

## Cursor MCP (step 6)

- Seeds **`.cursor/mcp.json`** from [`.cursor/mcp.example.json`](.cursor/mcp.example.json) when missing; never commit real tokens.
- **`make setup-mcp`** — install `npx`/`uvx`, validate JSON, AWS/gcloud checks, print one summary (warnings do not fail full `make setup`).
- **Daily baseline:** `github`, `linear`, `slack` — enable Mercury/AWS/analytics only when needed.

```bash
make setup-mcp
MCP_NO_INSTALL=true make setup-mcp   # verify only
cp .cursor/mcp.example.json .cursor/mcp.json && make setup-mcp   # reset file
```

Finish in **Cursor → Settings → Tools & MCP** (GitHub PAT, Linear/Slack OAuth). AWS MCP shares SSO with `make secrets`.

---

## Troubleshooting (common)

| Problem | Fix |
| ------- | --- |
| Wrong/missing pnpm | `corepack prepare pnpm@9.0.0 --activate` or `brew unlink pnpm` |
| AWS profile / SSO | `export AWS_PROFILE=…`; `aws sso login`; or `Server/config/.aws-sso` |
| Broken venv | `export PYTHON=python3.12`; re-run `make setup` |
| Redis down | `brew services start redis` or `redis-server --daemonize yes` |
| `libmagic` missing | `brew install libmagic` / `apt install libmagic1` |
| macOS port 5000 | Disable AirPlay Receiver (see above) |
| MCP red in Cursor | `make setup-mcp`; fix summary; reload window |
| Empty `DATABASE_URL` | `make secrets` |

More: [scripts-guide.md](documentation/server/ops/scripts-guide.md), [README.md](README.md), [AGENTS.md](AGENTS.md).

---

## Quality gates

`make setup` sets `git config core.hooksPath scripts/githooks`.

| When | What |
| ---- | ---- |
| Commit | Prettier, ESLint, Ruff; OpenAPI drift |
| Push | Client typecheck + contract tests |
| PR (CI) | `pnpm check`, pytest, full lint |

```bash
make precommit
make openapi-verify
SKIP=1 git commit ...    # once, emergency
```

```bash
cd Client && pnpm check
make lint
cd Server && . .venv/bin/activate && pytest
```
