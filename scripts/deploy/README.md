# Deploy Scripts

**Canonical prod deploy:** [`.github/workflows/ci_web.yml`](../../.github/workflows/ci_web.yml) runs [`.github/scripts/ec2-deploy.sh`](../../.github/scripts/ec2-deploy.sh) on the EC2 host via SSH. That script preserves Redis, replaces stateless app/worker containers, and syncs the frontend.

**Prod rollback:** redeploy a prior immutable SHA tag with:

```bash
scripts/deploy/rollback-prod-web.sh <prior-12-char-sha-tag>
```

See [documentation/server/ops/prod-web-rollback.md](../../documentation/server/ops/prod-web-rollback.md).

## Scaling env vars (EC2 deploy)

Passed by `ec2-deploy.sh` to app/worker/beat containers — see [documentation/server/ops/scaling-playbook.md](../../documentation/server/ops/scaling-playbook.md).

## Local prod-parity

Compose stack under [`prod-parity/`](./prod-parity/) — app, Redis, Celery worker, and Beat (mirrors EC2 container layout).

```bash
make prod-parity-build
make prod-parity
# or: docker compose -f scripts/deploy/prod-parity/docker-compose.yml up
```

Requires `Server/.env` with `DATABASE_URL` and required keys.

## Load testing

See [scripts/load/README.md](../load/README.md) — local/staging only.
