# Deploy Scripts

**Canonical prod deploy:** [`.github/workflows/ci_web.yml`](../../.github/workflows/ci_web.yml) runs [`.github/scripts/ec2-deploy.sh`](../../.github/scripts/ec2-deploy.sh) on the EC2 host via SSH. That script orchestrates Redis, app, Celery worker, Celery Beat, optional heavy worker, and frontend sync.

## Scaling env vars (EC2 deploy)

Passed by `ec2-deploy.sh` to app/worker/beat containers — see [documentation/server/ops/scaling-playbook.md](../../documentation/server/ops/scaling-playbook.md).

## Local prod-parity

Compose stack under [`prod-parity/`](./prod-parity/) — app, Redis, Celery worker, and Beat (mirrors EC2 container layout).

**Prerequisites:**

- `Server/.env` with `DATABASE_URL` and required server keys (`make setup`)
- `Client/.env` with bundle build args (`make secrets` or copy from `Client/.env.example`) — same `EXPO_PUBLIC_*` keys CI passes to `Dockerfile.web`

**Interactive (foreground):**

```bash
make prod-parity-build
make prod-parity
```

**Automated smoke (build → boot → health checks → tear down):**

```bash
make prod-parity-smoke
# reuse image: SKIP_BUILD=1 make prod-parity-smoke
```

Smoke waits for the app container healthcheck (`/livez`), then curls `/livez` and `/readyz` (DB + Redis). Run before merging `Dockerfile.web` or deploy-script changes.

On `build`, [`prod-parity/compose.sh`](./prod-parity/compose.sh) passes every `Client/.env` entry as a Docker `--build-arg` (no hardcoded keys in compose YAML). `up` uses `Client/.env` only for compose interpolation.

**Docker Desktop (Apple Silicon):** prod-parity images are `linux/arm64`. If the app dies with exit **132** while loading routes (SIGILL), it is usually `cryptography` 47+ — not torch. Pin is documented in `Server/requirements/runtime.txt`; rebuild after changing it (`make prod-parity-build`).

## Load testing

See [scripts/load/README.md](../load/README.md) — local/staging only.
