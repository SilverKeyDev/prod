# Vite configuration (web)

> **Status:** Shipped  
> **Last verified:** 2026-07-12  
> **Code:** `Client/apps/web/vite.config.js`, `Client/apps/web/vite.plugin.wiki.js`, `Client/apps/web/vite/`

Web app build and dev server for `Client/apps/web` (Vite + React).

## Entry points

| File | Role |
|------|------|
| `Client/apps/web/vite.config.js` | Main config: plugins, `define`/process shim, aliases, build chunks |
| `Client/apps/web/vite.config.resolve.js` | Resolve aliases into `packages/` |
| `Client/apps/web/vite.plugin.wiki.js` | Ingests `documentation/**/*.md` → `virtual:silverkey-wiki` |
| `Client/apps/web/vite.plugin.seo.js` | Static SEO files at build |
| `Client/apps/web/vite/plugin.processShim.js` | Injects `process.env` with baked `EXPO_PUBLIC_*` |
| `Client/apps/web/vite/plugin.webStubNative.js` | Stubs React Native for web |
| `Client/apps/web/vite/build.manualChunks.js` | Manual chunk split |

## Docs root for Wiki

`vite.config.js` resolves:

```js
var documentationRoot = path.resolve(root, "../documentation");
// ...
silverkeyWikiPlugin({ docsRoot: documentationRoot })
```

The wiki plugin walks that tree recursively, builds a folder/page tree plus a `pages` map, and exposes them as `virtual:silverkey-wiki`. In dev it watches `documentation/` and hot-reloads the module when markdown changes. See [](../).

## Environment

- `envPrefix: "EXPO_PUBLIC_"`
- Bake-time keys are listed in `envVars` inside `vite.config.js` and written into `.vite/process-shim.cjs`
- Prod gates: [web-bundle-env-gates.md](./web-bundle-env-gates.md)

## Dev server

Default port `5173` (`WEB_DEV_PORT` / `CLIENT_WEB_PORT`). From `Client/`: `pnpm dev:web`.

## Bundle analysis

```bash
ANALYZE=1 pnpm build:web
# → Client/dist/bundle-stats.html when visualizer runs
```

## Related

- [config-files.md](./config-files.md)
- [tsconfig.md](./tsconfig.md)
- [guides/deployment.md](../guides/deployment.md)
