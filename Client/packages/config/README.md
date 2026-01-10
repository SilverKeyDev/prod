# Config Package

Configuration and API client wrappers for the SilverKey application.

## Purpose

The `config/` package provides thin, type-safe API client wrappers and configuration constants. This is the primary interface for making API calls throughout the application.

## Directory Structure

```
config/
├── api/          # Individual API client modules
├── query/        # React Query setup and configuration
├── auth.ts       # Authentication configuration
├── env.ts        # Environment variables
├── http.ts       # HTTP configuration constants
└── index.ts      # Centralized exports
```

## Architecture Rules

### Allowed Imports
- ✅ `services/http/*` - HTTP client utilities
- ✅ `services/security/*` - Security utilities
- ✅ `schemas/*` - Type definitions

### Forbidden Imports
- ❌ Business logic `services/*` - Config should not import business logic
- ❌ `hooks/*` or `store/*` - Config is framework-agnostic
- ❌ `apps/web/*` - Config should not know about components

## Key Files

### `api/`
Individual API client modules for each domain (user, agent, search, etc.). Each module exports typed functions for API calls.

### `query/`
React Query setup including:
- `queryClient.ts` - QueryClient configuration
- `keys.ts` - Query key factories
- `adapters.ts` - React Query adapters

### `auth.ts`
Authentication configuration including roles, permissions, and auth utilities.

### `env.ts`
Environment variable configuration and helpers.

### `http.ts`
HTTP configuration constants and utilities.

## Usage Examples

### Using API Clients

```typescript
// ✅ CORRECT: Import from config/api
import { userApi } from "../../../packages/config/api/user";

const response = await userApi.getProfile();
if (response.success) {
  // Handle success
}
```

### Using Query Keys

```typescript
// ✅ CORRECT: Use query key factories
import { queryKeys } from "../../../packages/config/query/keys";

const queryKey = queryKeys.user.profile();
```

## Common Patterns

All API clients follow a consistent pattern:
- Return `{ success: boolean, data?: T, error?: string }` responses
- Use centralized HTTP utilities from `services/http/`
- Include proper TypeScript types from `schemas/`

## Further Reading

- [api/README.md](./api/README.md) - Individual API client modules
- [query/README.md](./query/README.md) - React Query setup
