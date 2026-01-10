# HTTP Services

Low-level HTTP client implementation and utilities.

## Purpose

The `http/` directory contains the HTTP client implementation that provides:
- HTTP request/response handling
- Authentication token management
- Error handling
- Retry logic
- Request/response interceptors

## Files

### `client.ts`
Core HTTP client class with retry logic, error handling, and request/response interceptors.

### `client-instance.ts`
Configured HTTP client instance (singleton).

### `config.ts`
HTTP configuration and utilities.

### `compatibility.ts`
Compatibility layer providing functions that match the legacy API structure. This is the primary interface used by `config/api/*` modules.

### `index.ts`
Centralized exports.

## Architecture Rules

### Allowed Imports
- ✅ `utils/*` - Utility functions
- ✅ `schemas/*` - Type definitions
- ✅ `config/env.ts` - Environment configuration

### Forbidden Imports
- ❌ Business logic `services/*`
- ❌ `hooks/*` or `store/*`
- ❌ `apps/web/*`

## Usage Examples

### Using Compatibility Layer

```typescript
// ✅ CORRECT: Use compatibility functions in config/api
import { apiGet, apiPost } from "../../../packages/services/http/compatibility";

const response = await apiGet<UserResponse>("/api/v1/user/profile");
```

### Using HTTP Client Directly

```typescript
// ✅ CORRECT: Use configured client instance
import { httpClient } from "../../../packages/services/http/client-instance";

const response = await httpClient.get("/api/v1/user/profile");
```

## Key Features

### Authentication
- Automatic token injection from sessionStorage
- Token refresh handling
- Authentication error handling

### Error Handling
- Network error detection
- HTTP status code handling
- Error normalization

### Retry Logic
- Configurable retry attempts
- Exponential backoff
- Retry condition functions

## Best Practices

1. **Use compatibility layer** in `config/api/*` modules
2. **Don't use HTTP client directly** in components or hooks
3. **Handle errors properly** using error utilities
4. **Use TypeScript types** for request/response types

## Further Reading

- [services/README.md](../README.md) - Services package overview
