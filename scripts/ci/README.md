# CI Scripts

Shared scripts used by multiple GitHub Actions workflows. Run from repo root.

Deploy-specific scripts (build, EC2, cleanup) live in [scripts/deploy/](../deploy/).

## Scripts

| Script | Purpose | Used by | Prerequisites |
|--------|---------|---------|---------------|
| `load-aws-secrets.sh` | Load app env from AWS Secrets Manager into `$GITHUB_ENV` | ci_web, sunday_newsletter, sunday_newsletter_test | AWS CLI configured, jq |
| `free-disk-runner.sh` | Free disk space on GitHub runner | ci_web, sunday_newsletter | None |
| `run-email-orchestrator.sh` | Run email listings orchestrator, append to step summary | sunday_newsletter, sunday_newsletter_test | DATABASE_URL, PYTHONPATH=Server |

## Usage

**free-disk-runner.sh**
- `./scripts/ci/free-disk-runner.sh --aggressive` — ci_web: buildx prune, swapoff, hostedtoolcache
- `./scripts/ci/free-disk-runner.sh --minimal` — newsletter: dotnet, ghc, android only

**run-email-orchestrator.sh**
- Pass `TEST_EMAIL` in env for test workflow (single recipient).
