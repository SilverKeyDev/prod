# SilverKey Client

TypeScript/React: **web** (`apps/web`) and **mobile** (`apps/mobile`). Shared logic in **`packages/`**; apps stay thin.

## Quick start

From repo root: `make setup` then `make dev-web` (or `cd Client && pnpm dev:web`). Full machine setup: [setup.md](../setup.md).

## Mobile (Expo / Metro)

Not started by `make dev-web`. Run:

```bash
cd Client && pnpm dev:mobile   # then i / a for simulator
```

Expo web uses Metro (e.g. port 8081). Set `EXPO_PUBLIC_API_BASE_URL=http://localhost:5000` so API calls hit Flask, not Metro. Cache issues: `pnpm dev:mobile -- --clear`.

## Testing

```bash
pnpm test          # watch
pnpm test:run      # CI
pnpm test:coverage
```

Coverage thresholds in `vitest.config.ts`. Place `*.test.ts` next to source. Details: [documentation/runbooks/qa/](../documentation/runbooks/qa/README.md).

## OpenAPI types

Edit repo **`openapi/`**, then `pnpm generate:api-types` or `make openapi`. Do not edit `packages/types/api.generated.ts`.

- [openapi-workflow.md](../documentation/guides/openapi-workflow.md)
- [openapi-workflow.mdc](../.cursor/rules/shared/openapi-workflow.mdc)

## Where to read more

| Topic | Doc |
| ----- | --- |
| Architecture | [thin-app-architecture.md](../documentation/architecture/thin-app-architecture.md), [Client/ARCHITECTURE.md](ARCHITECTURE.md) |
| Packages | [packages/README.md](packages/README.md) |
| Lint & UI | [LINTING.md](../documentation/reference/linting.md) |
| Platform files | [platform-file-extensions.mdc](../.cursor/rules/frontend/platform-file-extensions.mdc) |
| Doc index | [documentation/README.md](../documentation/README.md) |
