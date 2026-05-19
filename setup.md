# SilverKey local setup

Run **`make setup`** once on a new machine. The script walks through five steps automatically:

1. **Prerequisites** — Node 20+, pnpm 9.x, Python 3.10–3.13, AWS CLI v2 (installs via Homebrew on macOS when possible, otherwise prints exact commands)
2. **Build** — `pnpm install` + `Server/.venv`
3. **AWS SSO** — creates `Server/config/.aws-sso` from template if needed, runs `aws sso login`
4. **Secrets** — fetches `Server/.env` from AWS Secrets Manager
5. **Verify** — smoke checks Client deps, Python imports, `.env` keys, and AWS session

Skip AWS/secrets (manual `.env`):

```bash
make setup ARGS='--skip-secrets'
```

After every `git pull`: **`make refresh`**.

---

## One-time AWS config

Before the first `make setup` (with secrets), set your SSO profile:

```bash
cp Server/config/aws-sso.example Server/config/.aws-sso
# Edit AWS_PROFILE=your-dev-profile-name
```

If you omit this file, setup copies the example and stops so you can edit it. If `~/.aws/config` has exactly one SSO profile, setup uses it automatically.

---

## Prerequisites

| Tool | Version |
| ---- | ------- |
| Node.js | 20+ |
| pnpm | 9.x (`corepack prepare pnpm@9.0.0 --activate`) |
| Python | 3.10–3.13 |
| AWS CLI | v2 (for default setup) |

**For `make dev` (not part of `make setup`):** Redis, PostgreSQL (`DATABASE_URL` in `Server/.env`).

### macOS

```bash
brew install node python@3.12 awscli
corepack enable && corepack prepare pnpm@9.0.0 --activate
```

### Debian / Ubuntu

```bash
sudo apt-get update
sudo apt-get install -y python3 python3-venv python3-pip awscli
# Node 20+ from https://nodejs.org/ or NodeSource — then corepack as above
```

### Fedora

```bash
sudo dnf install -y python3 python3-pip awscli
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
| `./scripts/check-deps.sh` | Check node/pnpm/python only (no build) |

### Setup flags

| Flag | Effect |
| ---- | ------ |
| `--skip-secrets` | Skip SSO login and Secrets Manager |
| `--force-venv` | Recreate `Server/.venv` |
| `--no-install` | Do not run `brew install` / corepack fixes |
| `--ci` | Slimmer Python deps (`requirements/ci.txt`) |

---

## Troubleshooting

| Problem | Fix |
| ------- | --- |
| Placeholder `AWS_PROFILE` | Edit `Server/config/.aws-sso`, re-run `make setup` |
| SSO login failed | `aws sso login --profile <profile>` then `make setup` |
| `.venv already exists` | `make refresh` or `make setup ARGS='--force-venv'` |
| Wrong Python | `export PYTHON=python3.12` then `make setup ARGS='--force-venv'` |
| Verification: empty `DATABASE_URL` | Re-run `make secrets` or fix AWS access |
| `make dev` needs Redis | `brew install redis` or `sudo apt install redis-server` |

---

## Quality gates

```bash
cd Client && pnpm typecheck && pnpm lint && pnpm check
make lint
cd Server && . .venv/bin/activate && pytest
```

See also [README.md](README.md), [AGENTS.md](AGENTS.md), [Makefile](Makefile) (`make help`).
