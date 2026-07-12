# Web bundle environment gates (prod deploy)

SilverKey bakes client-visible configuration into the web bundle at **Docker build** time (`EXPO_PUBLIC_*` via Vite `process-shim.cjs`). Runtime EC2 env does **not** fix a missing bake-time value.

Canonical manifest: [`Client/config/required-bundle-env.json`](../../Client/config/required-bundle-env.json)

## CI sourcing (prod)

| Source | Role |
| ------ | ---- |
| AWS Secrets Manager | **Sole source** — `fetch-client-bundle-env.sh` merges deploy secrets (same ids as `Server/.env.example`) and exports `EXPO_PUBLIC_*` into `GITHUB_ENV` |

Local dev: `make secrets` → `Client/.env` (via `Server/scripts/secrets.sh` + `client-env-from-secrets.sh`).

## Gates (no new workflows)

| Gate | When | What it checks |
| ---- | ---- | -------------- |
| `fetch-client-bundle-env.sh` | `ci_web` before Docker build | Loads bundle keys from AWS SM into `GITHUB_ENV` |
| `assert-bundle-secrets.mjs` | `ci_web` before Docker build | Required bundle env non-empty + manifest validation (length only in logs) |
| `export-bundle-docker-build-args.mjs` | `ci_web` Docker build | Emits `--build-arg` from manifest + resolved env |
| `verify-web-bundle-env.mjs` | `Dockerfile.web` after `build:web` | Required keys inlined in shim / dist |
| `prod-deploy-smoke.sh` | Manual post-deploy | `GET /livez`, `/healthz`, `/api/maps/script` on prod URL |

Maps-specific setup: [`google-maps-web-setup.md`](../guides/google-maps-web-setup.md).

## Adding a required bake-time variable

1. Add to [`Client/apps/web/vite.config.js`](../../Client/apps/web/vite.config.js) `envVars`.
2. Add `ARG` / `ENV` in [`Dockerfile.web`](../../Dockerfile.web).
3. Add the key to the appropriate AWS Secrets Manager JSON secret (and run `make secrets` locally).
4. Add an entry to [`required-bundle-env.json`](../../Client/config/required-bundle-env.json) with `"dockerBuildArg": true` and `"required": true` as needed.

## Local verification

```bash
make secrets
cd Client
pnpm build:web
VERIFY_CLIENT_BUNDLE_ENV=1 node scripts/verify-web-bundle-env.mjs
```

## Tests

Vitest (no secrets): [`Client/scripts/lib/bundle-env-manifest.test.mjs`](../../Client/scripts/lib/bundle-env-manifest.test.mjs).
