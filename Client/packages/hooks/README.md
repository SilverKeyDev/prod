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

## Virtual import paths (TypeScript)

`Client/tsconfig.base.json` maps some **`packages/hooks/data/...` paths to feature packages** so older imports stay stable and auth/chat hooks stay next to their feature APIs:

| Import prefix | Resolves to |
|---------------|-------------|
| `packages/hooks/data/auth/*` | `packages/features/homeauth/hooks/data/*` |
| `packages/hooks/data/chat/*` | `packages/features/messaging/hooks/data/*` |

There is **no** `packages/hooks/data/auth` folder on disk for those modules; the compiler resolves the alias. Example: `import { useUserData } from "packages/hooks/data/auth/useUserData"` loads the re-export in `features/homeauth/hooks/data/useUserData.ts`, which forwards to the canonical implementation in `packages/hooks/data/user/useUserData.ts`.

## Shared hooks vs feature hooks

- **Put new data hooks in `packages/hooks/data/...`** when they are cross-feature, use `packages/config/http/api` (or the established HTTP API surface), and should stay framework-adjacent without pulling a single feature’s `api/` tree.
- **Keep hooks under `packages/features/<feature>/hooks/`** when they orchestrate that feature’s `api/`, store, and UI together (e.g. search page composition, documents signing). The feature `index.ts` can export them for consumers.
- **User profile and preferences** (`useUserData`, `useUserPreferences`): canonical logic lives in **`packages/hooks/data/user/useUserData.ts`**. Prefer importing from `packages/hooks/data/user/useUserData` or the **`packages/hooks/data/auth/useUserData`** alias above—do not add parallel copies under other features.
- **Barrel `packages/hooks/data/index.ts`** may re-export a small set of symbols implemented in a feature when that is the agreed public surface (e.g. `usePropertyDetails` from search). Implementation files remain under `packages/features/search/`.

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
// ✅ CORRECT: Component uses data hook (canonical path)
import { useUserData } from "packages/hooks/data/user/useUserData";

function Component() {
  const { userProfile, userProfileLoading } = useUserData();
  // ...
}
```

### Store Integration Hook

```typescript
// ✅ CORRECT: Component uses store integration hook
import { useSavedHomesStoreIntegration } from "packages/hooks/store";

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
