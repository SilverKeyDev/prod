# Services Package

Business logic orchestration, state management, and infrastructure services.

## Purpose

The `services/` package contains business logic services that orchestrate API calls and manage application state. Services are typically class-based singletons that use `config/api/*` for all API calls.

## Directory Structure

```
services/
├── http/           # Low-level HTTP client implementation
├── security/       # Security utilities (PII scrubbing, error reporting)
├── data/           # Data loading services (React Query integration)
├── agent.ts        # Agent service
├── agentDashboard.ts
├── auth.ts         # Authentication service
├── chats.ts        # Chat service
├── documents.ts    # Document service
├── googleCalendar.ts
├── googleMaps.ts
├── negotiation.ts  # Negotiation service
├── plaid.ts        # Plaid integration service
├── reports.ts      # Reports service
├── savedHomes.ts   # Saved homes service
├── scheduling.ts   # Scheduling service
└── index.ts        # Centralized exports
```

## Architecture Rules

### Allowed Imports
- ✅ `config/api/*` - API clients (primary interface)
- ✅ `services/http/*` - HTTP utilities
- ✅ `services/security/*` - Security utilities
- ✅ `schemas/*` - Type definitions

### Forbidden Imports
- ❌ `hooks/*` or `store/*` - Services are framework-agnostic
- ❌ `apps/web/*` - Services should not know about components

## Key Principles

1. **Use API Clients**: Services MUST use `config/api/*` for all API calls
2. **Framework Agnostic**: Services should not depend on React (except `data/` subdirectory)
3. **Business Logic**: Services contain business logic orchestration
4. **Singleton Pattern**: Most services are class-based singletons

## Usage Examples

### Using a Service

```typescript
// ✅ CORRECT: Import service
import { agentService } from "../../../packages/services/agent";

const clients = await agentService.fetchClients();
```

### Service Pattern

Services typically follow this pattern:

```typescript
export class MyService {
  async fetchData() {
    const response = await myApi.getData(); // Uses config/api
    if (!response.success) {
      throw new Error(response.error);
    }
    // Business logic here
    return response.data;
  }
}

export const myService = new MyService();
```

## Special Cases

### `services/data/`
Contains services that use React Query's `QueryClient`. This is an acceptable exception as these services are specifically designed for React Query integration (data prefetching and background polling).

See [data/README.md](./data/README.md) for details.

## Further Reading

- [http/README.md](./http/README.md) - HTTP client implementation
- [security/README.md](./security/README.md) - Security utilities
- [data/README.md](./data/README.md) - Data loading services
