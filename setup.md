# SilverKey local setup

Run **`make setup`** once on a new machine (prerequisites → Client + Server env → verify). For full-stack backend work, run **`make setup-dev`** next (AWS SSO → secrets with prod `DATABASE_URL` → verify). After every `git pull`: **`make refresh`**.

**First:** use a supported terminal — macOS Terminal, Linux shell, or **Windows via WSL2 (Ubuntu)**. Native Windows shells (PowerShell/CMD/Git Bash) are not supported; `make setup` stops and points you to [Windows (WSL2)](#windows-wsl2--required).

Deep MCP and Cursor tuning: [`.cursor/README.md`](.cursor/README.md), [cursor-configuration-optimization.md](documentation/client/tooling/cursor-configuration-optimization.md), [cursor-agent-memory.md](documentation/client/tooling/cursor-agent-memory.md).

---

## TL;DR

1. **Set up your terminal** — macOS/Linux shell, or [Windows WSL2 (Ubuntu)](#windows-wsl2--required) (not PowerShell/CMD/Git Bash).
2. Install the [prerequisites](#prerequisites) for your platform, clone the repo, then from the repo root:

```bash
make setup       # prereqs → Client + Server venv
make setup-dev   # AWS SSO → secrets (prod DATABASE_URL)
make dev         # web (http://localhost:5173) + API (http://localhost:5000)
```

3. After every `git pull`: `make refresh`.

On Windows, complete step 1 (WSL2 + Ubuntu terminal) before installing prerequisites or running `make setup`.

**No AWS access yet?** `make setup` alone is enough for lint, typecheck, and `make dev-web`. **Re-check tools anytime:** `make check-deps`.

---

## One-time AWS config

```bash
aws configure sso
export AWS_PROFILE=your-dev-profile-name
export AWS_REGION=us-east-2
aws sso login --profile "$AWS_PROFILE"
```

**Per-repo profile (recommended):** `cp Server/config/aws-sso.example Server/config/.aws-sso` — used by `make setup-dev`, `make secrets`, `make refresh --secrets`. Shell `export AWS_PROFILE` overrides `.aws-sso`.

---

## Prerequisites

| Tool | Version |
| ---- | ------- |
| Node.js | 20–22 (CI uses **22**; run `nvm use` — see [`.nvmrc`](.nvmrc)) |
| pnpm | 9.x (`corepack prepare pnpm@9.0.0 --activate`) |
| Python | 3.10–3.13 (prefer **3.12** for ML wheels; see troubleshooting) |
| Redis | 6+ (prerequisite scan; verify warns on `make setup`, required on `make setup-dev`) |
| libmagic | MIME validation on uploads |
| AWS CLI | v2 (for `make setup-dev` / `make secrets`) |
| Docker | Optional — for local Docker Postgres (`make db-up`, `make dev-db-init`) |

### macOS (quick)

**Apple Silicon (M-series) is fully supported** — same Homebrew/corepack flow; `/opt/homebrew` is the normal prefix.

```bash
brew install node python@3.12 redis libmagic awscli
corepack enable && corepack prepare pnpm@9.0.0 --activate
nvm use   # optional; lands on Node 22 per .nvmrc (matches CI)
brew services start redis   # optional
```

**Port 5000:** Disable **AirPlay Receiver** (System Settings → General → AirDrop & Handoff) if `make dev` cannot reach `/healthz`.

**iCloud-synced clones:** Prefer `~/Developer/…` — avoids duplicate `module 2.py` files; CI runs `scripts/ci/check-macos-duplicate-files.sh`.

### Linux

Debian/Ubuntu: `python3`, `python3-venv`, `redis-server`, `libmagic1`, `awscli`. Fedora: `python3`, `redis`, `file-libs`, `awscli`.

### Alpine / busybox / minimal CI images

`make secrets` runs `Server/scripts/secrets.sh` via **`sh`** (bash is not required). You need **AWS CLI v2**, **`sh`**, and **`python3` or `jq`** for JSON parsing. Dotenv-format secrets use POSIX awk only.

### Headless SSO (Codespaces, SSH, CI)

Before `make secrets`, authenticate with:

```bash
aws sso login --profile "$AWS_PROFILE" --use-device-code
```

Or export valid **`AWS_ACCESS_KEY_ID`** + **`AWS_SESSION_TOKEN`** (or role creds) in the environment. Set **`AWS_SSO_NO_AUTO_LOGIN=1`** in CI/non-TTY environments to suppress browser auto-login attempts.

### Windows (WSL2) — required

**You cannot run setup in PowerShell, CMD, or Git Bash.** The toolchain is Unix-based (bash setup scripts, GNU `make`, a Python venv, Redis, the `libmagic` system library). Those don't run reliably on native Windows — that's the confusing errors people hit. **WSL2 gives you a real Ubuntu Linux on Windows**, so the exact same commands your macOS/Linux teammates use just work. `make setup` will hard-stop with these steps if it detects a native Windows shell.

**1. One-time — in an _admin_ PowerShell, then reboot:**

```powershell
wsl --install   # installs WSL2 + Ubuntu by default
```

Reboot, open **Ubuntu** from the Start menu, and create your Linux username/password.

**2. Inside the Ubuntu (WSL) terminal — install prerequisites:**

```bash
sudo apt update
sudo apt install -y build-essential git python3 python3-venv \
  redis-server libmagic1 awscli
# Node 20+ via nvm; corepack provides pnpm 9:
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
exec bash && nvm install 20 && corepack enable
```

**3. Clone _inside_ the Linux home dir (not `C:\` / `/mnt/c/...`) and run setup:**

```bash
cd ~ && git clone <repo-url> && cd <repo>
make setup
```

> **Gotcha:** Clone into `~` (the WSL filesystem), **not** a Windows path under `/mnt/c`. Windows-mounted paths are slow and cause line-ending and file-permission issues. Open the repo in Cursor/VS Code via the **WSL** extension ("Connect to WSL").

---

## Commands

| Command | Purpose |
| ------- | ------- |
| `make setup` | Prereqs + Client + Server venv |
| `make setup-dev` | AWS SSO + secrets (prod `DATABASE_URL`) + backend verify |
| `make setup-mcp` | Cursor MCP install/verify only |
| `make refresh` | Post-pull cache clear + deps (`ARGS='--secrets'`, `--reset-db`, `--no-clean`, `--aggressive-clean`) |
| `make check-deps` | Prerequisite scan |
| `make secrets` | Re-fetch `Server/.env` |
| `make db-up` | Start isolated local Postgres |
| `make db-health` | Check local Postgres readiness |
| `make db-down` | Stop local Postgres and clear the local dev DB volume |
| `make db-reset` | Delete and recreate the local Postgres dev volume |
| `make dev-db-init` | Local Docker only: reset volume + local `DATABASE_URL` + migrations |
| `make dev` | Web + API |
| `./scripts/setup/check-deps.sh` | Same as `make check-deps` |

### Setup flags

| Flag | Effect |
| ---- | ------ |
| `--force-venv` | Recreate `Server/.venv` from scratch |
| `--no-install` | No Homebrew/corepack installs |
| `--ci` | Slimmer Python (`requirements/ci.txt`) |

`SETUP_REQUIRE_REDIS=1` — enforce Redis during verify (set automatically by `make setup-dev`). Default `make setup` warns and continues if Redis is unreachable.

`DEPS_CMD_TIMEOUT` (default 600s) — increase for slow first `pnpm`/`corepack` runs.

---

## First run & verify

After `make setup` (and `make setup-dev` for full-stack), confirm the stack runs:

```bash
make dev
```

- **Web:** open <http://localhost:5173>
- **API health:** `curl http://localhost:5000/healthz` → expect a `200` / OK response

`make secrets` fetches all AWS secrets into `Server/.env`, including `DATABASE_URL` from Secrets Manager (e.g. `db_url`). For isolated local Docker Postgres instead, use `USE_LOCAL_DATABASE=1 make secrets` or `make dev-db-init`.

`make setup-dev` runs `make secrets` only (no Docker reset, no migrations). For local Docker reset + migrations:

```bash
make dev-db-init
make dev-backend
```

For post-pull dependency refreshes, local DB reset is opt-in:

```bash
make refresh ARGS='--secrets --reset-db'
```

Other entry points: `make dev-web` (web only), `make mobile` (Expo). If `/healthz` is unreachable on macOS, see the [port 5000 / AirPlay](#macos-quick) note.

---

## Cursor MCP (optional)

- Seeds **`.cursor/mcp.json`** from [`.cursor/mcp.example.json`](.cursor/mcp.example.json) when missing; never commit real tokens.
- **`make setup-mcp`** — install `npx`/`uvx`, validate JSON, AWS/gcloud checks, print one summary (warnings do not fail `make setup`).
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
| On Windows / "native Windows shell detected" | Use **WSL2 (Ubuntu)** — see [Windows (WSL2)](#windows-wsl2--required). Run `make setup` inside the Ubuntu terminal, not PowerShell/Git Bash. |
| Wrong/missing pnpm | `corepack prepare pnpm@9.0.0 --activate` or `brew unlink pnpm` |
| AWS profile / SSO | `export AWS_PROFILE=…`; `aws sso login`; headless: `aws sso login --use-device-code`; or `Server/config/.aws-sso`; CI: `AWS_SSO_NO_AUTO_LOGIN=1` |
| Broken venv | `export PYTHON=python3.12`; `make setup ARGS='--force-venv'` |
| torch / ML on ARM Linux | Setup may warn and skip torch; install manually if you need sentence-transformers |
| Redis down (core setup) | Verify warns; install/start Redis before `make setup-dev` or `make dev` |
| Redis down (backend) | `brew services start redis` or `redis-server --daemonize yes` |
| Local Postgres down | `make db-up`; then `make db-health` |
| Need a clean local DB | `make dev-db-init` (deletes only the local Docker Postgres volume) |
| `libmagic` missing | `brew install libmagic` / `apt install libmagic1` |
| macOS port 5000 | Disable AirPlay Receiver (see above) |
| MCP red in Cursor | `make setup-mcp`; fix summary; reload window |
| Empty `DATABASE_URL` | `make secrets` (requires `db_url` in Secrets Manager); local Docker: `USE_LOCAL_DATABASE=1 make secrets` |

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
