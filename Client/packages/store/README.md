# Store Package

Zustand store slices for application-wide state management.

## Purpose

The `store/` package contains Zustand store slices that manage global application state:

- Authentication state
- User data
- Saved homes
- Documents
- Reports
- UI state
- Feature flags
- And more

## Directory Structure

```
store/
├── index.ts        # Centralized exports (public API)
├── README.md
├── middleware/     # Store middleware (devtools, persist, resettable)
└── slices/         # Domain slice folders
    ├── auth/
    ├── user/
    ├── ui/
    ├── search/
    ├── documents/
    ├── featureFlags/
    ├── negotiation/
    ├── reports/
    ├── maps/
    ├── notifications/
    ├── scheduling/
    ├── saved/
    └── feed/
```

## Architecture Rules

### Allowed Imports

- ✅ `schemas/*` - Type definitions

### Forbidden Imports

- ❌ `hooks/*` - Stores should not import hooks
- ❌ `config/api/*` - Stores should not make API calls
- ❌ `services/*` - Stores should not use services
- ❌ `apps/web/*` - Stores should not know about components

## Store Pattern

Stores follow a consistent pattern:

```typescript
import { create } from "zustand";
import type { UserProfile } from "../schemas/user";

type AuthState = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  setUser: (user: UserProfile | null) => void;
};

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
}));
```

## Usage Examples

### Using a Store

```typescript
// ✅ CORRECT: Use store hook in component
import { useAuthStore } from "../../../packages/store";

function Component() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  // ...
}
```

### Using Store Selectors

```typescript
// ✅ CORRECT: Use selector for specific state
import { useAuthStore } from "../../../packages/store";

function Component() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // ...
}
```

### Using Store Actions

```typescript
// ✅ CORRECT: Use action from store
import { useSavedHomesStore } from "../../../packages/store";

function Component() {
  const saveHome = useSavedHomesStore((s) => s.saveHome);

  const handleSave = () => {
    saveHome(homeId);
  };
  // ...
}
```

## Store Integration

Stores are updated via integration hooks in `hooks/store/*`:

```typescript
// In hooks/store/useSavedHomesStoreIntegration.ts
import { useSavedHomesData } from "../data/useSavedHomesData";
import { useSavedHomesStore } from "../../store";

export function useSavedHomesStoreIntegration() {
  const { data } = useSavedHomesData();
  const setSavedHomes = useSavedHomesStore((s) => s.setSavedHomes);

  useEffect(() => {
    if (data) {
      setSavedHomes(data);
    }
  }, [data, setSavedHomes]);

  return {
    savedHomes: useSavedHomesStore((s) => s.savedHomes),
    saveHome: useSavedHomesStore((s) => s.saveHome),
  };
}
```

## Middleware

The `middleware/` directory contains store middleware:

- `devtools.ts` - Redux DevTools integration
- `persistSafe.ts` - Safe persistence middleware
- `resettable.ts` - Store reset functionality

## Best Practices

1. **Don't mutate store directly** - Use actions and setters
2. **Use selectors** - Select only the state you need
3. **Update via hooks** - Use integration hooks to sync React Query data
4. **Keep stores focused** - One store per domain
5. **Use TypeScript types** - From `schemas/*`

## Further Reading

- [middleware/README.md](./middleware/README.md) - Store middleware
- [hooks/store/README.md](../hooks/store/README.md) - Store integration hooks
