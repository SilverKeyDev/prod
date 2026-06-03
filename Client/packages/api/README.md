# API Clients

Individual API client modules for each domain in the SilverKey application.

## Purpose

Each API client module provides type-safe, domain-specific functions for making API calls. These are thin wrappers around the HTTP client that provide:

- Type safety with TypeScript
- Consistent response formats
- Error handling
- Domain-specific abstractions

## Available API Clients

- `agent.ts` - Agent-related API calls (clients, conversations, todos)
- `auth.ts` - Authentication API calls (login, signup, logout)
- `chatbot.ts` - Chatbot API calls
- `dashboard.ts` - Dashboard data API calls
- `googleCalendar.ts` - Google Calendar integration
- `maps.ts` - Maps API calls
- `offer.ts` - Offer and negotiation API calls
- `preferences.ts` - User preferences API calls
- `plaid.ts` - Plaid financial integration
- `report.ts` - Report generation and management
- `research.ts` - Property research API calls
- `search.ts` - Property search API calls
- `feed/feed.ts` - Feed/reels API calls
- `secureUpload.ts` - Secure file upload API calls
- `user.ts` - User profile and data API calls

## Architecture Rules

### API types

- Define API request/response types in `packages/schemas` (e.g. `schemas/api/user.ts`), not inline in config/api.
- In config/api modules, `import type { ... } from "../../../schemas/..."` and re-export if needed for backward compatibility.

### Allowed Imports

- ✅ `services/http/*` - HTTP client utilities
- ✅ `services/security/*` - Security utilities
- ✅ `schemas/*` - Type definitions

### Forbidden Imports

- ❌ Business logic `services/*`
- ❌ `hooks/*` or `store/*`
- ❌ `apps/web/*`

## Response Format

All API clients return a consistent response format:

```typescript
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  // Domain-specific fields may be included
};
```

## Usage Examples

### Basic API Call

```typescript
import { log } from "packages/logger";
import { userApi } from "../../../packages/config/api/user";

const response = await userApi.getProfile();
if (response.success && response.user) {
  log.info('API', 'Profile loaded', { userId: response.user?.id });
} else {
  log.error('API', 'Profile request failed', { error: response.error });
}
```

### With Error Handling

```typescript
import { userApi } from "../../../packages/config/api/user";
import { normalizeError } from "../../../packages/utils/errorHandling";

try {
  const response = await userApi.getProfile();
  if (!response.success) {
    throw new Error(response.error ?? "Failed to fetch profile");
  }
  // Use response.user
} catch (error) {
  const normalizedError = normalizeError(error);
  // Handle error
}
```

## Common Patterns

### Query Parameters

```typescript
// API clients handle query parameters internally
const response = await searchApi.searchProperties({
  location: "San Francisco",
  minPrice: 500000,
  maxPrice: 1000000,
});
```

### File Uploads

```typescript
import { secureUploadApi } from "../../../packages/config/api/secureUpload";

const file = new File([...], "document.pdf");
const response = await secureUploadApi.upload(file);
```

## Type Safety

All API clients use TypeScript types from `schemas/`:

```typescript
import type { UserProfile } from "../../../packages/schemas/user";

// userApi.getProfile() returns UserProfile
const response = await userApi.getProfile();
// response.user is typed as UserProfile | undefined
```

## Best Practices

1. **Always check `success`** before accessing data
2. **Use error handling utilities** from `utils/errorHandling`
3. **Import types from schemas** for type safety
4. **Don't use API clients directly in components** - use hooks instead

## Further Reading

- [config/README.md](../README.md) - Config package overview
- [query/README.md](../query/README.md) - React Query setup
