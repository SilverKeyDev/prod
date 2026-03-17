# Deploy Scripts

Scripts used by the prod deploy workflow (`.github/workflows/deploy/ci_web.yml`).

## Runner scripts (run on GitHub Actions runner)

| Script | Purpose |
|--------|---------|
| `docker-build-push.sh` | Build and push Docker image to ECR |
| `prune-buildx.sh` | Prune Buildx cache after build |
| `final-cleanup.sh` | Prune Docker, apt, caches on runner (run with `if: always()`) |

## EC2 scripts (run on EC2 host via appleboy SSH)

Sequential steps in `ec2/`:

| Step | Script | Purpose |
|------|--------|---------|
| 1 | `01-ensure-docker.sh` | Ensure Docker is installed and running |
| 2 | `02-cleanup-and-pull.sh` | Clean containers/caches, pull image, create network |
| 3 | `03-start-redis.sh` | Start Redis container, wait for healthy |
| 4 | `04-start-app.sh` | Start App container, wait for healthy |
| 5 | `05-start-worker.sh` | Start Worker container |
| 6 | `06-sync-frontend.sh` | Sync static frontend to /var/www/html |
| 7 | `07-verify-health.sh` | Final health check for all containers |

Orchestration: `ec2/run-all.sh` fetches and runs each step in sequence. Used by ci_web via curl.

## Usage

**Runner (from repo root):**
```bash
./scripts/deploy/docker-build-push.sh
./scripts/deploy/prune-buildx.sh
./scripts/deploy/final-cleanup.sh
```

**EC2 (via appleboy):** Workflow runs `run-all.sh` which curls each step. Requires `GITHUB_REPOSITORY` and `GITHUB_SHA` in env. For private repos, add `GITHUB_TOKEN`.
