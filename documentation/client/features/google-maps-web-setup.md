# Google Maps (web): Map ID vs API key

SilverKey uses **two separate** Google Maps credentials for the web app. Mixing them up causes maps to load while **Advanced Markers** fail with a console warning about an invalid Map ID.

## Credentials

| Variable | Where set | Purpose |
| -------- | --------- | ------- |
| `EXPO_PUBLIC_GOOGLE_MAPS_ID` | `Client/.env` (local); GitHub secret `EXPO_PUBLIC_GOOGLE_MAPS_ID` at **Docker image build** ([`ci_web.yml`](../../.github/workflows/ci_web.yml)) | Google Cloud **Map ID** (Map Management). Required for vector styling and Advanced Markers. |
| `GOOGLE_MAPS_API_KEY` | EC2 / Server runtime ([`Server/app/routes/maps.py`](../../Server/app/routes/maps.py)) | Loads the Maps JavaScript API via `GET /api/maps/script`. Never shipped in the client bundle. |

**Do not** put the JavaScript API key in `EXPO_PUBLIC_GOOGLE_MAPS_ID`. Use the **Map ID** string from Google Cloud Console → Maps → Map Management.

Use the same GCP project (or compatible pairing) for the Map ID baked at build time and the API key on the server.

## Local development

1. Copy [`Client/.env.example`](../../Client/.env.example) to `Client/.env`.
2. Set `EXPO_PUBLIC_GOOGLE_MAPS_ID=<your-cloud-map-id>`.
3. Run the web app; optional: `cd Client && pnpm verify:web:maps` after `pnpm build:web` with the same env var set.

## Production deploy

1. **GitHub repository secret:** `EXPO_PUBLIC_GOOGLE_MAPS_ID` = Cloud Map ID (not the JS API key).
2. Run workflow **Prod Deploy - Web (EC2)** ([`ci_web.yml`](../../.github/workflows/ci_web.yml)). The workflow fails early if the secret is empty; the Docker build fails if the ID is not inlined into the bundle.
3. **EC2 / Server:** `GOOGLE_MAPS_API_KEY` must be set for `/api/maps/script` (script load). This alone does not fix Advanced Markers.

After deploy, rebuild is required when changing the Map ID (value is compile-time in `Client/dist`).

## Verify

### Build / bundle

```bash
cd Client
EXPO_PUBLIC_GOOGLE_MAPS_ID="<your-map-id>" pnpm build:web
VERIFY_MAPS_MAP_ID=1 pnpm verify:web:maps
```

Inspect the Vite shim (optional):

```bash
cat node_modules/.vite/process-shim.cjs | head
```

### Browser (production)

1. Enable `mapRendering` in [`Client/packages/logger/config/logger.config.json`](../../../Client/packages/logger/config/logger.config.json) or via admin logger config.
2. Open the search map; look for **Web Maps Cloud Map ID diagnostics** in logs (`configured: true`, `instanceMapIdPresent: true`).
3. In DevTools, after the map loads: `map.getMapId?.()` should return a non-empty string.
4. Console should not show: *The map is initialized without a valid Map ID*.

## Tests

Vitest does **not** use GitHub secrets. See `packages/config/env.test.ts`, `packages/utils/maps/**/*.test.ts`, and `packages/features/search/utils/googleMaps/webMapsBuildPipeline.test.ts`.

## Related code

- Env: [`Client/packages/config/env.ts`](../../Client/packages/config/env.ts)
- Vite shim: [`Client/apps/web/vite.config.js`](../../Client/apps/web/vite.config.js)
- Map options: [`Client/packages/features/search/utils/googleMaps/buildWebGoogleMapOptions.ts`](../../Client/packages/features/search/utils/googleMaps/buildWebGoogleMapOptions.ts)
- Post-build gate: [`Client/scripts/verify-web-maps-map-id.mjs`](../../Client/scripts/verify-web-maps-map-id.mjs)
