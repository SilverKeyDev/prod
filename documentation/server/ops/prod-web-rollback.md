# Prod Web Rollback

Prod web deploys use immutable ECR image tags derived from the first 12 characters of the git SHA. Rollback is a redeploy of a prior known-good SHA tag; it does not build a new image.

Until M2 redundancy lands, schedule prod deploys and rollback drills off-hours.

## One-Command Rollback

From the repo root:

```bash
scripts/deploy/rollback-prod-web.sh <prior-12-char-sha-tag>
```

Example:

```bash
scripts/deploy/rollback-prod-web.sh a1b2c3d4e5f6
```

The script dispatches `.github/workflows/ci_web.yml` with `image_tag=<prior-12-char-sha-tag>`. The workflow resolves that existing tag in ECR, pins its digest, and SSHes to EC2 to deploy that exact image.

## Finding The Prior SHA Tag

Use the previous successful **Prod Deploy - Web (EC2)** workflow run, or inspect ECR tags for repository `cre` in `us-east-2`. The deploy workflow logs the deployed tag near the start:

```text
Deploy image tag: <12-char-sha>
```

For rollback, choose the previous known-good tag, not the failed release tag.

## Non-Destructive Deploy Rules

The EC2 deploy script preserves stateful services during deploy:

- Redis is not removed by the app-container replacement path.
- Docker volumes are not pruned after successful deploy.
- The app Docker network is reused when it already exists.

The app, Celery worker, Celery beat, and optional heavy worker are stateless and may be replaced during deploy.

## Manual Workflow Equivalent

The helper script is equivalent to:

```bash
gh workflow run ci_web.yml --ref main -f image_tag=<prior-12-char-sha-tag>
```

Use the script for standard rollback so the command stays consistent.
