# Web bundle environment gates (prod deploy)

SilverKey bakes client-visible configuration into the web bundle at **Docker build** time (`EXPO_PUBLIC_*` via Vite `process-shim.cjs`). Runtime EC2 env does **not** fix a missing bake-time value.

Canonical manifest: [`Client/config/required-bundle-env.json`](../../Client/config/required-bundle-env.json)

## Gates (no new workflows)

| Gate | When | What it checks |
| ---- | ---- | -------------- |
| `assert-github-bundle-secrets.mjs` | `ci_web` before Docker build | Required GitHub secrets are non-empty (length only in logs) |
| `verify-web-bundle-env.mjs` | `Dockerfile.web` after `build:web` | Required keys inlined in shim / dist |
| `prod-deploy-smoke.sh` | `ci_web` after EC2 deploy | `GET /livez`, `/healthz`, `/api/maps/script` on prod URL |

Maps-specific setup: [`google-maps-web-setup.md`](../features/google-maps-web-setup.md).

## Adding a required bake-time variable

1. Add to [`Client/apps/web/vite.config.js`](../../Client/apps/web/vite.config.js) `envVars`.
2. Add `ARG` / `ENV` in [`Dockerfile.web`](../../Dockerfile.web).
3. Wire CI: GitHub **secret** or **variable** (PostHog `phc_` key uses a repository variable — see `ci_web.yml`) plus `--build-arg` in [`.github/workflows/ci_web.yml`](../../.github/workflows/ci_web.yml).
4. Add an entry to [`required-bundle-env.json`](../../Client/config/required-bundle-env.json) with `"required": true`.

## Local verification

```bash
cd Client
EXPO_PUBLIC_GOOGLE_MAPS_ID="<cloud-map-id>" pnpm build:web
VERIFY_CLIENT_BUNDLE_ENV=1 pnpm verify:web:bundle
```

`pnpm verify:web:maps` is an alias for the same verifier.

## Tests

Vitest (no secrets): [`Client/scripts/lib/bundle-env-manifest.test.mjs`](../../Client/scripts/lib/bundle-env-manifest.test.mjs).
