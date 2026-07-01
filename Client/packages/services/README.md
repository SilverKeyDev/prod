# Services Package

HTTP client, security helpers, and React Query–oriented data wiring. **Feature-owned orchestration** (documents, agent API helpers, negotiation, saved homes, maps) lives under `packages/features/<feature>/` — import those from their feature modules, not from this barrel.

## Layout

```
packages/services/
├── http/              # HttpClient, fetch helpers (apiGet, apiPost, …)
├── security/          # PII scrubbing, secure logger, error reporting, clipboard, images
├── data/              # Route tables + prefetch/polling helpers for React Query
├── index.ts           # Re-exports: auth/token helpers, HTTP config, security, error types
└── README.md
```

## Import guidance

| Need | Import from |
|------|----------------|
| `apiGet` / `apiPost` / `HttpError` / `createAbortManager` | `packages/services/http/...` (or `packages/services/http` barrel) |
| Error reporting, PII, secure logger | `packages/services/security/...` |
| `getInitialLoadRoutes`, `DATA_ROUTES`, route types | `packages/services/data/...` |
| `documentService`, `negotiationService`, search transforms, etc. | `packages/features/<feature>/...` |
| Auth constants (`UserRole`, `AUTH_CONFIG`, …) | `packages/config/auth/auth` (also re-exported from `packages/services` for convenience) |

## Architecture rules

### Allowed imports (inside `packages/services`)

- `packages/config/*` (env, HTTP API wrappers used by `data/` routes)
- `packages/features/*` only where `data/` routes must call a feature query helper (keep these edges minimal)
- `packages/logger`, `packages/utils`, `packages/types`, `packages/schemas`

### Forbidden imports

- `packages/hooks/*` or `packages/store/*`
- `apps/web/*` or `apps/mobile/*`

## `data/` routes

`data/dataRoutes/*.ts` define React Query prefetch/poll behavior. Shared success checks use [`data/apiRouteResponse.ts`](./data/apiRouteResponse.ts) (`throwUnlessApiSuccess`, `requireApiSuccessData`).

See [data/README.md](./data/README.md) for prefetch and polling entry points.

## Further reading

- [http/README.md](./http/README.md) — HTTP client
- [security/README.md](./security/README.md) — Security utilities
- [data/README.md](./data/README.md) — Data loading and polling
