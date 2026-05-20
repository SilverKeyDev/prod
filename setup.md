# SilverKey local setup

Run **`make setup`** once on a new machine. The script walks through five steps automatically:

1. **Prerequisites** — Node 20+, pnpm 9.x, Python 3.10–3.13, Redis, libmagic (for secure file uploads), AWS CLI v2 (installs via Homebrew on macOS when possible, otherwise prints exact commands)
2. **Build** — `pnpm install` + `Server/.venv`
3. **AWS SSO** — uses your `~/.aws/config` profile and runs `aws sso login` in the terminal (no repo aws-sso files created)
4. **Secrets** — fetches `Server/.env` from AWS Secrets Manager
5. **Verify** — smoke checks Client deps, Python imports, Redis, `.env` keys, and AWS session

Skip AWS/secrets (manual `.env`):

```bash
make setup ARGS='--skip-secrets'
```

After every `git pull`: **`make refresh`**.

---

## One-time AWS config

Before the first `make setup` (with secrets), configure SSO in your terminal (writes to `~/.aws/config`, not the repo):

```bash
aws configure sso          # once — follow prompts
export AWS_PROFILE=your-dev-profile-name
export AWS_REGION=us-east-2
aws sso login --profile "$AWS_PROFILE"
```

If `~/.aws/config` has exactly one SSO profile, setup picks it automatically. With several profiles, export `AWS_PROFILE` before `make setup`. During setup, step 3 runs `aws sso login` again if the session expired.

---

## Prerequisites

| Tool | Version |
| ---- | ------- |
| Node.js | 20+ |
| pnpm | 9.x (`corepack prepare pnpm@9.0.0 --activate`) |
| Python | 3.10–3.13 |
| Redis | 6+ (`redis-server`, `redis-cli`; setup starts it on port 6379 if installed but stopped) |
| libmagic | System library for `python-magic` (MIME validation on uploads; macOS: Homebrew `libmagic`) |
| AWS CLI | v2 (for default setup) |

**For `make dev` (not installed by setup):** PostgreSQL — connection string in `DATABASE_URL` (`Server/.env`).

### macOS

```bash
brew install node python@3.12 redis libmagic awscli
corepack enable && corepack prepare pnpm@9.0.0 --activate
brew services start redis   # optional; setup can start redis-server if needed
```

**Before `make dev` (macOS only):** The API binds to port **5000**, which macOS **AirPlay Receiver** also uses by default. If AirPlay keeps the port, `make dev` can pass the TCP check but fail waiting for `http://127.0.0.1:5000/healthz` (you may see `WARN: Some processes on port 5000 may still be running`).

Turn off AirPlay Receiver once:

1. Open **System Settings → General → AirDrop & Handoff** (on some macOS versions: **Sharing**).
2. Disable **AirPlay Receiver**.

Confirm port 5000 is free: `lsof -i :5000` should not list `ControlCenter`. Then `curl -fsS http://127.0.0.1:5000/healthz` should succeed after the backend is running.

### Debian / Ubuntu

```bash
sudo apt-get update
sudo apt-get install -y python3 python3-venv python3-pip redis-server libmagic1 awscli
sudo systemctl start redis-server   # or: redis-server --daemonize yes
# Node 20+ from https://nodejs.org/ or NodeSource — then corepack as above
```

### Fedora

```bash
sudo dnf install -y python3 python3-pip redis file-libs awscli
sudo systemctl start redis
# Node 20+ from nodejs.org — then corepack
```

### Windows

Use **WSL2** with Linux steps above.

---

## Commands

| Command | Purpose |
| ------- | ------- |
| `make setup` | Full first-time flow (steps 1–5) |
| `make refresh` | Refresh deps after `git pull` |
| `make secrets` | Re-fetch `Server/.env` only |
| `make dev` | Web + API |
| `./scripts/check-deps.sh` | Check node/pnpm/python/redis (+ aws unless `--skip-secrets`) |

### Setup flags

| Flag | Effect |
| ---- | ------ |
| `--skip-secrets` | Skip SSO login and Secrets Manager |
| `--force-venv` | Ignored (setup always recreates `Server/.venv` if it already exists) |
| `--no-install` | Do not run `brew install` / corepack fixes |
| `--ci` | Slimmer Python deps (`requirements/ci.txt`) |

Step 1 logs each prerequisite as it runs. Long installs honor `DEPS_CMD_TIMEOUT` (default 600s); override with `DEPS_CMD_TIMEOUT=1200 make setup` if needed.

---

## Troubleshooting

| Problem | Fix |
| ------- | --- |
| Step 1 looks stuck (no output after header) | Setup now logs each tool (`[node]`, `[pnpm]`, …). First `pnpm`/`corepack` run may download for 1–2 min — wait for `still running…` heartbeats. Wrong pnpm (e.g. brew 11.x): `brew unlink pnpm` then re-run `make setup`, or `corepack enable && corepack prepare pnpm@9.0.0 --activate` |
| `AWS_PROFILE` not set | `export AWS_PROFILE=<profile>` then `aws sso login --profile "$AWS_PROFILE"` |
| SSO login failed | `aws sso login --profile <profile>` then `make setup` |
| No SSO profile yet | Run `aws configure sso`, then `export AWS_PROFILE=...` and re-run `make setup` |
| Wrong Python / broken venv | `export PYTHON=python3.12` then `make setup` (recreates `Server/.venv`) |
| After `git pull` only | `make refresh` (keeps existing venv, refreshes pip/pnpm) |
| `your-sso-profile-name` / secrets profile error | Remove legacy `Server/config/.aws-sso` if present; use terminal SSO only (`export AWS_PROFILE=...`, `aws sso login`) |
| Verification: empty `DATABASE_URL` | Re-run `make secrets` or fix AWS access |
| Redis not running after setup | `brew services start redis` or `redis-server --daemonize yes` then `redis-cli ping` |
| Step 1: redis missing | `brew install redis` (macOS) or `sudo apt install redis-server` (Debian/Ubuntu) |
| `failed to find libmagic` on `make dev` | `brew install libmagic` (macOS) or `sudo apt install libmagic1` (Debian/Ubuntu); re-run `make setup` or `make dev` |
| `make dev`: timeout on `/healthz`, port 5000 “still running” (macOS) | **AirPlay Receiver** is using port 5000 — disable it under **System Settings → General → AirDrop & Handoff → AirPlay Receiver** (see macOS section above), then re-run `make dev` |

---

## Quality gates

```bash
cd Client && pnpm typecheck && pnpm lint && pnpm check
make lint
cd Server && . .venv/bin/activate && pytest
```

See also [README.md](README.md), [AGENTS.md](AGENTS.md), [Makefile](Makefile) (`make help`).
