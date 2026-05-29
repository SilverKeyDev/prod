# HTTP Services

Low-level HTTP client implementation and utilities.

## Purpose

The `http/` directory contains the HTTP client implementation that provides:

- HTTP request/response handling
- Authentication token management
- Error handling
- Retry logic
- Request/response interceptors

## Layout

| Module | Role |
| ------ | ---- |
| `client/` | `HttpClient`, response parsing, auth recovery, session logout |
| `client-instance.ts` | Configured singleton `httpClient` |
| `apiRequest.ts` / `apiMethods.ts` | Feature-facing `apiGet` / `apiPost` helpers |
| `apiErrors.ts` | Auth error logging and notification (no store import) |
| `fileTransfer.ts` | Upload/download helpers |
| `index.ts` | Public barrel for feature `api/*.ts` modules |

## Usage

```typescript
// Feature API modules
import { apiGet, apiPost } from "packages/services/http";

const profile = await apiGet<UserResponse>("/api/v1/user/profile");
```

```typescript
// Direct client (hooks/integration only when appropriate)
import { httpClient } from "packages/services/http/client-instance";

const response = await httpClient.get("/api/v1/user/profile");
```

## Architecture rules

- Prefer `apiGet` / `apiPost` from this package in `packages/features/*/api/` and `packages/api/`.
- Do not import `packages/store` from HTTP modules (auth state clears via `authenticationError` events + BroadcastChannel).
- Config bridges (`packages/config/http/abort.ts`, `packages/config/auth/authErrors.ts`) may import subpaths such as `packages/services/http/apiErrors`.

## Further reading

- [services/README.md](../README.md) — services package overview
