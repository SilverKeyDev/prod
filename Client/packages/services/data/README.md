# Data Loading Services

Data loading services for React Query integration (prefetching and background polling).

## Purpose

The `data/` directory contains services specifically designed for React Query integration:

- Initial data prefetching on login
- Background polling for real-time updates
- QueryClient integration

## Files

### `dataRoutes/*.ts`

Route definitions for prefetch and polling (`DATA_ROUTES`). Query functions use API wrappers from `packages/config/http/api` and shared guards in `apiRouteResponse.ts`.

### `apiRouteResponse.ts`

`throwUnlessApiSuccess` / `requireApiSuccessData` — consistent errors for `{ success, error?, data? }` responses.

### `initialDataLoader.ts`

Prefetches all page data on login. Called once after successful authentication to warm up the React Query cache.

### `backgroundPolling.ts`

Polls endpoints at different intervals to keep data fresh. Automatically adjusts based on page visibility and user type.

## Architecture Exception

**IMPORTANT**: These services use React Query's `QueryClient`, which is a React-specific dependency. This is an acceptable exception because:

1. These services are specifically designed for React Query integration
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

## Usage Examples

### Initial Data Loader

```typescript
import { InitialDataLoader } from "../../../packages/services/data/initialDataLoader";
import { useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();
const loader = new InitialDataLoader(queryClient);

await loader.prefetchAllData(user);
```

### Background Polling

```typescript
import { BackgroundPolling } from "../../../packages/services/data/backgroundPolling";
import { useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();
const polling = new BackgroundPolling(queryClient);

polling.start(user, pathname);
// ... later
polling.stop();
```

## Integration with Hooks

These services are typically used by hooks:

```typescript
// In hooks/data/useDataInitialization.ts
export function useDataInitialization() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;

    const loader = new InitialDataLoader(queryClient);
    loader.prefetchAllData(user);

    const polling = new BackgroundPolling(queryClient);
    polling.start(user, location.pathname);

    return () => polling.stop();
  }, [user, queryClient]);
}
```

## Polling Intervals

Background polling uses adaptive intervals:

- **Conversations (active)**: 8 seconds when on messaging page
- **Conversations (background)**: 45 seconds when elsewhere
- **Agent todos**: 1 minute
- **Agent clients**: 3 minutes
- **Saved homes**: 5 minutes
- **Paused**: When tab is hidden

## Best Practices

1. **Use in hooks only** - Don't use these services directly in components
2. **Clean up polling** - Always stop polling on unmount
3. **Handle errors gracefully** - Services log errors but don't throw
4. **Respect visibility** - Polling automatically pauses when tab is hidden

## Further Reading

- [services/README.md](../README.md) - Services package overview
- [hooks/data/README.md](../../hooks/data/README.md) - Data fetching hooks
