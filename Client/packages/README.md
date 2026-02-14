# Packages Directory

This directory contains shared packages used across the SilverKey application. All packages follow a strict layered architecture with clear separation of concerns.

## Directory Structure

```
packages/
├── config/          # API clients and configuration
├── services/        # Business logic and infrastructure services
├── hooks/           # React hooks for data fetching and state management
├── store/           # Zustand store slices for global state
├── schemas/         # TypeScript type definitions
├── utils/           # Framework-agnostic utility functions
├── contexts/        # React Context providers
└── styles/          # CSS stylesheets
```

## Architecture Overview

The packages follow a strict layered architecture:

```
Components (apps/web/)
    ↓
Hooks (packages/hooks/)
    ↓
Config/API (packages/config/api/)
    ↓
Services/HTTP (packages/services/http/)
```

### Key Principles

1. **Framework Agnostic**: Services, utils, and schemas should not depend on React
2. **Separation of Concerns**: Each layer has a specific responsibility
3. **Import Rules**: Strict rules govern what can import from where
4. **Type Safety**: All packages use TypeScript with strict type checking

## Import Rules

### Components (`apps/web/`)

- ✅ Can import from: `hooks/*`, `store/*`, `schemas/*`, `utils/*`, `contexts/*`
- ❌ Cannot import from: `config/api/*`, `services/*` (use hooks instead)

### Hooks (`packages/hooks/`)

- ✅ Can import from: `config/api/*`, `store/*`, `schemas/*`, `services/http/*`, `services/security/*`
- ❌ Cannot import from: Business logic `services/*` (use `config/api/*` instead)

### Services (`packages/services/`)

- ✅ Can import from: `config/api/*`, `services/http/*`, `services/security/*`, `schemas/*`
- ❌ Cannot import from: `hooks/*`, `store/*` (services are framework-agnostic)

### Config (`packages/config/`)

- ✅ Can import from: `services/http/*`, `services/security/*`, `schemas/*`
- ❌ Cannot import from: Business logic `services/*`

## Package Descriptions

### `config/`

Thin, type-safe API client wrappers and configuration constants. These are the primary interface for making API calls.

### `services/`

Business logic orchestration, state management, and infrastructure services. Services use `config/api/*` for all API calls.

### `hooks/`

React hooks for data fetching (React Query), store integration, and UI state management.

### `store/`

Zustand slices for application-wide state. Updated via `hooks/store/*` integration hooks.

### `schemas/`

TypeScript type definitions shared across the application.

### `utils/`

Framework-agnostic utility functions. Must not import React or any framework-specific code.

### `contexts/`

React Context providers for dependency injection and non-state configuration (theming, localization).

### `styles/`

CSS stylesheets and utility classes.

## Common Patterns

### Data Fetching

```typescript
// ✅ CORRECT: Component uses hook
import { useUserData } from "../../../packages/hooks/data/useUserData";

function Component() {
  const { user } = useUserData();
  // ...
}

// ❌ WRONG: Component uses API directly
import { userApi } from "../../../packages/config/api/user";
```

### Error Handling

```typescript
// ✅ CORRECT: Use centralized error utilities
import {
  normalizeError,
  reportError,
} from "../../../packages/utils/errorHandling";
```

### Type Definitions

```typescript
// ✅ CORRECT: Import types from schemas
import type { UserProfile } from "../../../packages/schemas/user";
```

## Exceptions

### React Query in Services

The `services/data/` directory contains services that use React Query's `QueryClient`. This is an acceptable exception as these services are specifically designed for React Query integration (data prefetching and background polling).

## Further Reading

See individual README files in each subdirectory for detailed documentation:

- [config/README.md](./config/README.md) - API clients and configuration
- [services/README.md](./services/README.md) - Business logic services
- [hooks/README.md](./hooks/README.md) - React hooks
- [store/README.md](./store/README.md) - Zustand stores
- [schemas/README.md](./schemas/README.md) - Type definitions
- [utils/README.md](./utils/README.md) - Utility functions
- [contexts/README.md](./contexts/README.md) - React Context providers
- [styles/README.md](./styles/README.md) - CSS stylesheets
