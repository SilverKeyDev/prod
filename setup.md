# SilverKey local setup

Run **`make setup`** once on a new machine. The script walks through six steps automatically:

1. **Prerequisites** — Node 20+, pnpm 9.x, Python 3.10–3.13, Redis, libmagic (for secure file uploads), AWS CLI v2 (installs via Homebrew on macOS when possible, otherwise prints exact commands)
2. **Build** — `pnpm install` + `Server/.venv`
3. **AWS SSO** — `~/.aws/config` + `aws sso login`; optional per-repo profile pin in `Server/config/.aws-sso` (see below)
4. **Secrets** — fetches `Server/.env` from AWS Secrets Manager
5. **Verify** — smoke checks Client deps, Python imports, Redis, `.env` keys, and AWS session
6. **Cursor MCP** — installs optional MCP runtimes (`npx`, `uvx`), seeds [`.cursor/mcp.json`](.cursor/mcp.json) from [`.cursor/mcp.example.json`](.cursor/mcp.example.json) when missing, runs checks, then prints a **summary** of all warnings/errors (does not stop at the first issue). MCP errors do not fail the rest of `make setup`.

Skip AWS/secrets (manual `.env`):

```bash
make setup ARGS='--skip-secrets'
```

After every `git pull`: **`make refresh`** (clears stale dev caches, then refreshes pnpm and pip).

---

## One-time AWS config

Before the first `make setup` (with secrets), configure SSO in your terminal (writes to `~/.aws/config`, not the repo):

```bash
aws configure sso          # once — follow prompts
export AWS_PROFILE=your-dev-profile-name
export AWS_REGION=us-east-2
aws sso login --profile "$AWS_PROFILE"
```

If `~/.aws/config` has exactly one SSO profile, setup picks it automatically. With several profiles, either:

- **Recommended (per repo):** `cp Server/config/aws-sso.example Server/config/.aws-sso` and set `AWS_PROFILE` to your SilverKey SSO profile name, or
- **Shell-wide:** `export AWS_PROFILE=…` and `export AWS_REGION=us-east-2` in `~/.zshrc`

During setup, step 3 runs `aws sso login` again if the session expired.

### Optional: `Server/config/.aws-sso`

Gitignored file (copy from [`Server/config/aws-sso.example`](Server/config/aws-sso.example)). Used by `make setup`, `make secrets`, and `make refresh --secrets`. It only stores **which profile name** and **region** to use — not passwords. SSO configuration remains in `~/.aws/config` via `aws configure sso`.

```bash
cp Server/config/aws-sso.example Server/config/.aws-sso
# Edit AWS_PROFILE (from: aws configure list-profiles) and AWS_REGION in .aws-sso
aws sso login --profile "$(grep '^export AWS_PROFILE=' Server/config/.aws-sso | cut -d= -f2- | tr -d '"')"
make secrets
```

Shell `export AWS_PROFILE=…` overrides `.aws-sso` when already set in the environment.

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
| uv (`uvx`) | Optional — **aws-api** MCP in Cursor (step 6 / `make setup-mcp` can `brew install uv` on macOS) |
| gcloud CLI | Optional — only if you use the **gcloud** MCP server |

**For `make dev` (not installed by setup):** PostgreSQL — connection string in `DATABASE_URL` (`Server/.env`).

### macOS

```bash
brew install node python@3.12 redis libmagic awscli
corepack enable && corepack prepare pnpm@9.0.0 --activate
brew services start redis   # optional; setup can start redis-server if needed
# optional for Cursor aws-api MCP (or let make setup-mcp install uv):
brew install uv
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
| `make setup` | Full first-time flow (steps 1–6) |
| `make setup-mcp` | Cursor MCP only — install tools, seed/verify `.cursor/mcp.json`, print summary |
| `make refresh` | Clear stale caches + refresh deps after `git pull` |
| `make clean-caches` | Remove regenerable caches only (no install) |
| `make secrets` | Re-fetch `Server/.env` only |
| `make dev` | Web + API |
| `./scripts/check-deps.sh` | Check node/pnpm/python/redis (+ aws unless `--skip-secrets`) |
| `./scripts/setup-mcp.sh` | Same as `make setup-mcp` |

### Setup flags

| Flag | Effect |
| ---- | ------ |
| `--skip-secrets` | Skip SSO login and Secrets Manager |
| `--force-venv` | Ignored (setup always recreates `Server/.venv` if it already exists) |
| `--no-install` | Do not run `brew install` / corepack fixes |
| `--ci` | Slimmer Python deps (`requirements/ci.txt`) |

Step 1 logs each prerequisite as it runs. Long installs honor `DEPS_CMD_TIMEOUT` (default 600s); override with `DEPS_CMD_TIMEOUT=1200 make setup` if needed.

---

## Cursor MCP (step 6)

Cursor reads **`.cursor/mcp.json`** (gitignored). The repo ships **[`.cursor/mcp.example.json`](.cursor/mcp.example.json)** only — no real tokens in git.

### What the setup script does

Implementation: [`scripts/lib/setup-mcp.sh`](scripts/lib/setup-mcp.sh) (invoked by `make setup` step 6 and `make setup-mcp`).

The script always runs **all four phases**, then prints one combined **summary** (warnings and errors). It does **not** exit on the first failed check.

| Phase | Automated actions |
| ----- | ----------------- |
| **1 — Install** | Ensure `npx` (Node 20+) and `uvx` ([uv](https://docs.astral.sh/uv/)); on macOS may `brew install node` / `brew install uv` unless installs are disabled |
| **2 — Configure** | If `.cursor/mcp.json` is missing, copy from `mcp.example.json`; if it already exists, **leave it unchanged** |
| **3 — Verify** | Valid JSON; GitHub placeholder; `AWS_PROFILE` + `aws sts get-caller-identity`; gcloud application-default creds (if `gcloud` is installed); `npx` / `uvx` smoke checks |
| **4 — Summary** | List every warning and error, then exit `0` (OK or warnings only) or `1` (hard errors, e.g. invalid JSON or missing example file) |

**`make setup`:** runs the same MCP logic as step 6. If MCP reports **errors**, setup still finishes and prints `MCP step reported errors` — fix MCP separately with `make setup-mcp`.

**`make setup-mcp`:** run anytime to re-check or after editing `.cursor/mcp.json`.

```bash
make setup-mcp
# equivalent:
./scripts/setup-mcp.sh

# Do not run Homebrew installs (check/verify only):
MCP_NO_INSTALL=true make setup-mcp
```

### MCP servers in the example config

| Server | Type | What you need locally |
| ------ | ---- | --------------------- |
| **github** | Hosted URL | Replace `YOUR_GITHUB_PAT` in `.cursor/mcp.json` with a fine-grained PAT or Copilot-compatible token |
| **linear** | Hosted URL | Sign in via **Cursor → Settings → Tools & MCP** when prompted |
| **slack** | Hosted URL | Connect workspace in **Tools & MCP** when prompted |
| **aws-knowledge** | Hosted URL | No extra install (public AWS knowledge endpoint) |
| **aws-api** | `uvx awslabs.aws-api-mcp-server@latest` | `uv` / `uvx` on PATH; `export AWS_PROFILE=...` and active SSO (`aws sso login`) — same session as step 3 |
| **gcloud** | `npx @google-cloud/gcloud-mcp` | Node/`npx`; optional: `gcloud auth application-default login` |

Region for **aws-api** in the example is `us-east-1` inside `mcp.json` `env`; align with your usual `AWS_REGION` if you change it.

### Finish in Cursor (manual, after the script)

1. Open **Cursor → Settings → Tools & MCP** and confirm each server loads (green / connected).
2. Set the **GitHub** Bearer token in `.cursor/mcp.json` if the script warned about `YOUR_GITHUB_PAT`.
3. **Linear / Slack** — complete OAuth in the MCP UI when Cursor prompts you.
4. **AWS API** — ensure `AWS_PROFILE` is set in the shell where Cursor was launched, or configure credentials Cursor can see (`~/.aws/credentials` / SSO).
5. **gcloud** — only if you use that server: ADC via `gcloud auth application-default login`.
6. Reload the Cursor window if servers stay red after fixing the summary items.

### Reset or recreate `mcp.json`

| Goal | Command |
| ---- | ------- |
| Re-run checks only | `make setup-mcp` |
| Fresh file from example (overwrites local edits) | `cp .cursor/mcp.example.json .cursor/mcp.json` then `make setup-mcp` |

Never commit `.cursor/mcp.json` with real tokens. The file is gitignored.

### MCP and AWS SSO

Step 3 and MCP **aws-api** share the same AWS CLI session. Before `make setup-mcp`, in the same terminal (or your shell profile):

```bash
export AWS_PROFILE=your-dev-profile-name
export AWS_REGION=us-east-2   # optional; aws-api example uses us-east-1 in env block
aws sso login --profile "$AWS_PROFILE"
make setup-mcp
```

If you used `make setup ARGS='--skip-secrets'`, you can still configure MCP; AWS API checks will warn until `AWS_PROFILE` and SSO are set.

See also [.cursor/README.md](.cursor/README.md) and [AGENTS.md](AGENTS.md).

---

## Troubleshooting

| Problem | Fix |
| ------- | --- |
| Step 1 looks stuck (no output after header) | Setup now logs each tool (`[node]`, `[pnpm]`, …). First `pnpm`/`corepack` run may download for 1–2 min — wait for `still running…` heartbeats. Wrong pnpm (e.g. brew 11.x): `brew unlink pnpm` then re-run `make setup`, or `corepack enable && corepack prepare pnpm@9.0.0 --activate` |
| `AWS_PROFILE` not set | `export AWS_PROFILE=<profile>` then `aws sso login --profile "$AWS_PROFILE"` |
| SSO login failed | `aws sso login --profile <profile>` then `make setup` |
| No SSO profile yet | Run `aws configure sso`, then `export AWS_PROFILE=...` and re-run `make setup` |
| Wrong Python / broken venv | `export PYTHON=python3.12` then `make setup` (recreates `Server/.venv`) |
| After `git pull` only | `make refresh` (clears `.turbo`, Vite/pytest caches, etc.; keeps venv; refreshes pip/pnpm). Skip cache clear: `make refresh ARGS='--no-clean'`. Deeper clean (Expo/Playwright): `make refresh ARGS='--aggressive-clean'` |
| Invalid security token / secrets profile error | `aws sso login --profile <name>`; set profile via `Server/config/.aws-sso` or `export AWS_PROFILE=...` (not stale `~/.aws/credentials` default) |
| `Token has expired and refresh failed` | On an interactive terminal, `make secrets` runs `aws sso login` for the profile in `Server/config/.aws-sso`. If it still fails, run login manually. CI: set `AWS_SSO_NO_AUTO_LOGIN=1` and provide credentials another way. |
| `AWS profile not set` on `make secrets` | `cp Server/config/aws-sso.example Server/config/.aws-sso` or `export AWS_PROFILE=...` |
| Verification: empty `DATABASE_URL` | Re-run `make secrets` or fix AWS access |
| Redis not running after setup | `brew services start redis` or `redis-server --daemonize yes` then `redis-cli ping` |
| Step 1: redis missing | `brew install redis` (macOS) or `sudo apt install redis-server` (Debian/Ubuntu) |
| `failed to find libmagic` on `make dev` | `brew install libmagic` (macOS) or `sudo apt install libmagic1` (Debian/Ubuntu); re-run `make setup` or `make dev` |
| `make dev`: timeout on `/healthz`, port 5000 “still running” (macOS) | **AirPlay Receiver** is using port 5000 — disable it under **System Settings → General → AirDrop & Handoff → AirPlay Receiver** (see macOS section above), then re-run `make dev` |
| MCP step warnings after `make setup` | Run `make setup-mcp` and read the **summary** block; fix each bullet, then re-run |
| `setup-mcp: errors` — invalid JSON | Fix `.cursor/mcp.json` syntax or reset: `cp .cursor/mcp.example.json .cursor/mcp.json` and re-apply secrets/tokens |
| `setup-mcp: warnings` — AWS session | `export AWS_PROFILE=<profile>` then `aws sso login --profile "$AWS_PROFILE"` then `make setup-mcp` |
| `setup-mcp: warnings` — uvx missing | `brew install uv` (macOS) or [install uv](https://docs.astral.sh/uv/); or `MCP_NO_INSTALL=false make setup-mcp` to let the script try brew |
| `setup-mcp: warnings` — npx missing | Install Node 20+ (`brew install node`); ensure `npx` is on PATH |
| `setup-mcp: warnings` — gcloud ADC | `gcloud auth application-default login` (only needed for gcloud MCP) |
| MCP servers red / not loading in Cursor | Run `make setup-mcp`; fix summary items; set GitHub PAT; connect Linear/Slack in **Tools & MCP**; reload Cursor window |
| `YOUR_GITHUB_PAT` still in `.cursor/mcp.json` | Edit `.cursor/mcp.json` locally — file is gitignored; re-run `make setup-mcp` to confirm |

---

## Quality gates

```bash
cd Client && pnpm typecheck && pnpm lint && pnpm check
make lint
cd Server && . .venv/bin/activate && pytest
```

See also [README.md](README.md), [AGENTS.md](AGENTS.md), [Makefile](Makefile) (`make help`).
