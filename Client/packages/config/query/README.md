# React Query Configuration

React Query setup and configuration for the SilverKey application.

## Purpose

This directory contains React Query configuration including:

- QueryClient setup
- Query key factories
- React Query adapters

## Files

### `queryClient.ts`

Configures the React Query client with default options, error handling, and caching strategies.

### `keys.ts`

Query key factories for type-safe query key generation. Organized by domain (user, agent, homes, etc.).

### `adapters.ts`

React Query adapters for custom integrations.

## Architecture Rules

### Allowed Imports

- ✅ `services/http/*` - HTTP utilities (if needed)
- ✅ `schemas/*` - Type definitions

### Forbidden Imports

- ❌ Business logic `services/*`
- ❌ `hooks/*` or `store/*` (circular dependency)
- ❌ `apps/web/*`

## Usage Examples

### Using Query Keys

```typescript
import { queryKeys } from "../../../packages/config/query/keys";

// Generate query key
const userProfileKey = queryKeys.user.profile();

// Use in React Query
useQuery({
  queryKey: userProfileKey,
  queryFn: () => userApi.getProfile(),
});
```

### Query Key Factories

Query keys are organized hierarchically:

```typescript
queryKeys.user.profile(); // ["user", "profile"]
queryKeys.user.preferences(); // ["user", "preferences"]
queryKeys.agent.clients(); // ["agent", "clients"]
queryKeys.agent.todos(completed); // ["agent", "todos", completed]
queryKeys.homes.favorites(); // ["homes", "favorites"]
```

## Query Client Configuration

The QueryClient is configured with:

- Default stale time
- Cache time
- Retry logic
- Error handling
- DevTools integration (development only)

## Best Practices

1. **Always use query key factories** - Don't hardcode query keys
2. **Organize keys by domain** - Follow the existing structure
3. **Include parameters in keys** - For parameterized queries
4. **Use consistent naming** - Follow existing patterns

## Further Reading

- [config/README.md](../README.md) - Config package overview
- [React Query Documentation](https://tanstack.com/query/latest)
