# SilverKey local setup

Run **`make setup`** once on a new machine (six steps: prerequisites → build → AWS SSO → secrets → verify → Cursor MCP). Skip AWS/secrets: `make setup ARGS='--skip-secrets'`. After every `git pull`: **`make refresh`**.

**First:** use a supported terminal — macOS Terminal, Linux shell, or **Windows via WSL2 (Ubuntu)**. Native Windows shells (PowerShell/CMD/Git Bash) are not supported; `make setup` stops and points you to [Windows (WSL2)](#windows-wsl2--required).

Deep MCP and Cursor tuning: [`.cursor/README.md`](.cursor/README.md), [cursor-configuration-optimization.md](documentation/client/tooling/cursor-configuration-optimization.md), [cursor-agent-memory.md](documentation/client/tooling/cursor-agent-memory.md).

---

## TL;DR

1. **Set up your terminal** — macOS/Linux shell, or [Windows WSL2 (Ubuntu)](#windows-wsl2--required) (not PowerShell/CMD/Git Bash).
2. Install the [prerequisites](#prerequisites) for your platform, clone the repo, then from the repo root:

```bash
make setup    # installs/verifies tools → builds Client+Server → AWS SSO → secrets → MCP
make dev      # web (http://localhost:5173) + API (http://localhost:5000)
```

3. After every `git pull`: `make refresh`.

On Windows, complete step 1 (WSL2 + Ubuntu terminal) before installing prerequisites or running `make setup`.

**No AWS access yet?** `make setup ARGS='--skip-secrets'` — sets up everything except SSO/secrets. **Re-check tools anytime:** `make check-deps`.

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

Debian/Ubuntu: `python3`, `python3-venv`, `redis-server`, `libmagic1`, `awscli`. Fedora: `python3`, `redis`, `file-libs`, `awscli`.

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

## First run & verify

After `make setup` completes, confirm the stack runs:

```bash
make dev
```

- **Web:** open <http://localhost:5173>
- **API health:** `curl http://localhost:5000/healthz` → expect a `200` / OK response

Other entry points: `make dev-web` (web only), `make mobile` (Expo). If `/healthz` is unreachable on macOS, see the [port 5000 / AirPlay](#macos-quick) note.

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
| On Windows / "native Windows shell detected" | Use **WSL2 (Ubuntu)** — see [Windows (WSL2)](#windows-wsl2--required). Run `make setup` inside the Ubuntu terminal, not PowerShell/Git Bash. |
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
