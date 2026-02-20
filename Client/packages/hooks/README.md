# Hooks Package

React hooks for data fetching, store integration, and UI state management.

## Purpose

The `hooks/` package contains React hooks that provide:

- Data fetching with React Query
- Store integration with Zustand
- UI state management
- Reusable React logic

## Directory Structure

```
hooks/
├── data/      # Data fetching hooks (React Query)
├── store/      # Store integration hooks (Zustand)
└── ui/         # UI state management hooks
```

## Architecture Rules

### Allowed Imports

- ✅ `config/api/*` - API clients (primary interface for data hooks)
- ✅ `store/*` - Zustand stores
- ✅ `schemas/*` - Type definitions
- ✅ `services/http/*` - HTTP utilities (if needed)
- ✅ `services/security/*` - Security utilities (if needed)

### Forbidden Imports

- ❌ Business logic `services/*` - Use `config/api/*` instead
- ❌ `apps/web/*` - Hooks should not import components

## Hook Categories

### Data Hooks (`hooks/data/`)

React Query hooks for data fetching. These hooks use `config/api/*` directly.

### Store Hooks (`hooks/store/`)

Integration hooks that connect React Query data to Zustand stores.

### UI Hooks (`hooks/ui/`)

Pure UI state management hooks (localStorage, modals, toasts, etc.).

## Usage Examples

### Data Fetching Hook

```typescript
// ✅ CORRECT: Component uses data hook
import { useUserData } from "../../../packages/hooks/data/useUserData";

function Component() {
  const { user, isLoading } = useUserData();
  // ...
}
```

### Store Integration Hook

```typescript
// ✅ CORRECT: Component uses store integration hook
import { useSavedHomesStoreIntegration } from "../../../packages/hooks/store/useSavedHomesStoreIntegration";

function Component() {
  const { savedHomes, saveHome } = useSavedHomesStoreIntegration();
  // ...
}
```

### UI Hook

```typescript
// ✅ CORRECT: Component uses UI hook
import { useLocalStorage } from "../../../packages/hooks/ui";

function Component() {
  const { value, setValue } = useLocalStorage("key", defaultValue);
  // ...
}
```

## Best Practices

1. **Use hooks in components** - Don't use API clients directly in components
2. **Create hooks for reusable logic** - Extract common patterns into hooks
3. **Use appropriate hook category** - Data, store, or UI
4. **Follow naming conventions** - `use` prefix, descriptive names

## Further Reading

- [data/README.md](./data/README.md) - Data fetching hooks
- [store/README.md](./store/README.md) - Store integration hooks
- [ui/README.md](./ui/README.md) - UI state hooks
