# Data Loading Services

Route definitions and response guards for React Query prefetch and polling.

## Purpose

The `data/` directory holds shared configuration used by data-loading hooks:

- Prefetch route definitions (`dataRoutes/`)
- Consistent API response guards (`apiRouteResponse.ts`)

Initial prefetch and background polling logic lives in **`packages/hooks/data/`** (e.g. `useDataInitialization`).

## Files

### `dataRoutes/*.ts`

Route definitions for prefetch and polling (`DATA_ROUTES`). Query functions use API wrappers from `packages/config/http/api` and shared guards in `apiRouteResponse.ts`.

### `apiRouteResponse.ts`

`throwUnlessApiSuccess` / `requireApiSuccessData` — consistent errors for `{ success, error?, data? }` responses.

## Architecture Exception

**IMPORTANT**: Prefetch/polling hooks use React Query's `QueryClient`, which is a React-specific dependency. This is an acceptable exception because:

1. These hooks are specifically designed for React Query integration
2. They are only used by React hooks (not directly by components)
3. They provide essential data loading functionality that requires React Query

### Allowed Imports

- ✅ `@tanstack/react-query` - React Query (exception)
- ✅ `config/api/*` - API clients
- ✅ `config/query/keys.ts` - Query key factories
- ✅ `services/*` - Other services
- ✅ `schemas/*` - Type definitions

### Forbidden Imports

- ❌ `hooks/*` or `store/*` - Services should not import hooks
- ❌ `apps/web/*` - Services should not know about components

## Further Reading

- [services/README.md](../README.md) - Services package overview
- [hooks/data/README.md](../../hooks/data/README.md) - Data fetching hooks
