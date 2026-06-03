# Deploy Scripts

**Canonical prod deploy:** [`.github/workflows/ci_web.yml`](../../.github/workflows/ci_web.yml) runs [`.github/scripts/ec2-deploy.sh`](../../.github/scripts/ec2-deploy.sh) on the EC2 host via SSH. That script orchestrates Redis, app, Celery worker, Celery Beat, optional heavy worker, and frontend sync.

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
