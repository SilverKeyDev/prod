# Frontend Architecture Documentation

## Overview

The SilverKey frontend follows a strict layered architecture with clear separation of concerns. This document describes the architecture, data flow, and best practices.

## Monorepo Shape

- **Apps**: `apps/web` (and future `apps/mobile`). Each app is a deployable entry point.
- **Shared code**: All shared code lives under `packages/*`. There is no top-level `shared/` folder.
- **Path aliases**: Cross-layer and cross-package imports **must** use path aliases, not relative parent imports (`../` or `../../`).
  - From `apps/web`: use `@/` for app-local paths (e.g. `@/app/`, `@/components/`, `@/pages/`, `@/features/`) and `packages/*` for shared code (e.g. `packages/hooks/`, `packages/store/`, `packages/schemas/`, `packages/utils/`, `packages/contexts/`, `packages/navigation/`, `packages/config/`, `packages/logger`).
  - From `packages/*`: use `packages/*` for other packages (e.g. `packages/config/`, `packages/store/`, `packages/schemas/`, `packages/navigation/`).
- **Layer rules**: Imports must still follow the existing layer rules (e.g. components → hooks only; no direct `config/api` or `services` from `apps/web`). See layer descriptions below.

## Architecture Diagram

```mermaid
graph TD
    Components[Components<br/>apps/web/] --> Hooks[Hooks<br/>packages/hooks/]
    Hooks --> ConfigAPI[Config/API<br/>packages/config/api/]
    ConfigAPI --> ServicesHTTP[Services/HTTP<br/>packages/services/http/]
    Hooks --> Store[Store<br/>packages/store/]
    Store --> StoreHooks[Store Integration Hooks<br/>packages/hooks/store/]
    StoreHooks --> Hooks

    style Components fill:#e1f5ff
    style Hooks fill:#fff4e1
    style ConfigAPI fill:#e8f5e9
    style ServicesHTTP fill:#fce4ec
    style Store fill:#f3e5f5
    style StoreHooks fill:#fff4e1
```

## Layer Descriptions

### 1. Components Layer (`apps/web/`)

**Purpose**: React components and pages - the UI layer.

**Responsibilities**:

- Render UI
- Handle user interactions
- Compose hooks for data and state
- No direct API calls or business logic

**Allowed Imports**:

- `packages/hooks/*` - All hooks
- `packages/store/*` - Store selectors (read-only)
- `packages/schemas/*` - Type definitions
- `packages/utils/*` - Utility functions
- `packages/contexts/*` - React contexts
- `packages/navigation/*` - Navigation adapter (for programmatic navigation and link props)

**Forbidden Imports**:

- ❌ `packages/config/api/*` - Use hooks instead
- ❌ `packages/services/*` - Use hooks instead
- ❌ `react-router-dom` / `react-router` - Use the navigation adapter (`packages/navigation`) only; root route config (`app/routes`, `main.tsx`) may still use react-router for setup.

**Example**:

```typescript
// ✅ CORRECT
import { useSavedHomesData } from "packages/hooks/data/useSavedHomesData";
import { useAuthStore } from "packages/store";

export default function SavedPage() {
  const { savedHomes, saveHome } = useSavedHomesData();
  const user = useAuthStore((s) => s.user);
  // ...
}

// ❌ WRONG
import { userApi } from "packages/config/api/user";
import { agentService } from "packages/services/agent";
```

### 2. Hooks Layer (`packages/hooks/`)

**Purpose**: React hooks for data fetching, store integration, and UI state.

#### 2.1 Data Hooks (`hooks/data/*`)

**Purpose**: React Query hooks for data fetching.

**Responsibilities**:

- Fetch data using React Query
- Use `config/api/*` for API calls
- Transform and cache data
- Handle loading and error states

**Allowed Imports**:

- `packages/config/api/*` - API clients
- `packages/store/*` - Store selectors (read-only)
- `packages/schemas/*` - Type definitions
- `packages/services/http/*` - HTTP utilities (if needed)
- `packages/services/security/*` - Security utilities (if needed)

**Forbidden Imports**:

- ❌ `packages/services/*` (business logic services) - Use `config/api` instead

**Example**:

```typescript
// ✅ CORRECT
import { userApi } from "../../config/api/user";
import { useQuery } from "@tanstack/react-query";

export const useSavedHomesData = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["savedHomes"],
    queryFn: () => userApi.getFavoriteHomes(),
  });
  return { savedHomes: data ?? [], isLoading, error };
};

// ❌ WRONG
import { savedHomesService } from "../../services/savedHomes";
```

#### 2.2 Store Integration Hooks (`hooks/store/*`)

**Purpose**: Hooks that integrate data hooks with Zustand stores.

**Responsibilities**:

- Sync data from hooks to stores
- Provide unified interface for components
- Handle store updates

**Allowed Imports**:

- `packages/hooks/data/*` - Data hooks
- `packages/store/*` - Store slices
- `packages/schemas/*` - Type definitions

**Example**:

```typescript
// ✅ CORRECT
import { useSecureAuth } from "../data/useSecureAuth";
import { useAuthStore } from "../../store";

export function useAuthStoreIntegration() {
  const { user, isAuthenticated } = useSecureAuth();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    setUser(user);
  }, [user, setUser]);
}
```

#### 2.3 UI Hooks (`hooks/ui/*`)

**Purpose**: Pure UI state management hooks.

**Responsibilities**:

- Manage UI-specific state (modals, toasts, etc.)
- No API calls or business logic

**Example**:

```typescript
// ✅ CORRECT
export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  return { isOpen, open, close };
}
```

### 3. Config/API Layer (`packages/config/api/`)

**Purpose**: Thin, type-safe API client wrappers.

**Responsibilities**:

- Define API endpoints
- Type request/response data
- Use HTTP utilities for actual requests
- Handle API-specific transformations

**Allowed Imports**:

- `packages/services/http/*` - HTTP client utilities
- `packages/services/security/*` - Security utilities
- `packages/schemas/*` - Type definitions

**Forbidden Imports**:

- ❌ `packages/services/*` (business logic) - Only HTTP/security utilities
- ❌ `packages/hooks/*` - No React dependencies
- ❌ `packages/store/*` - No state management

**Example**:

```typescript
// ✅ CORRECT
import { apiPost, apiGet } from "../../services/http/compatibility";
import type { LoginData, AuthResponse } from "../../schemas/api";

export const authApi = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    return apiPost<AuthResponse>("/api/v1/auth/login", data);
  },
  getProfile: async (): Promise<AuthResponse> => {
    return apiGet<AuthResponse>("/api/v1/user/profile");
  },
};
```

### 4. Services Layer (`packages/services/`)

**Purpose**: Business logic orchestration and infrastructure services.

#### 4.1 Business Logic Services

**Responsibilities**:

- Orchestrate complex business logic
- Coordinate multiple API calls
- Manage service-level state
- Provide singleton instances

**Allowed Imports**:

- `packages/config/api/*` - API clients
- `packages/services/http/*` - HTTP utilities
- `packages/services/security/*` - Security utilities
- `packages/schemas/*` - Type definitions

**Forbidden Imports**:

- ❌ `packages/hooks/*` - Services are framework-agnostic
- ❌ `packages/store/*` - Pass state as parameters instead
- ❌ `packages/apps/web/*` - No component dependencies

**Example**:

```typescript
// ✅ CORRECT
import { agentApi } from "../config/api/agent";
import { createAbortManager } from "./http";

export class AgentService {
  private abortManager = createAbortManager();

  async fetchClients() {
    const response = await agentApi.getClients();
    // Business logic here
    return response.clients ?? [];
  }
}

// ❌ WRONG
import { useAgentClients } from "../hooks/data/useAgentClients";
import { useAuthStore } from "../store";
```

#### 4.2 HTTP Services (`services/http/*`)

**Purpose**: Low-level HTTP client implementation.

**Responsibilities**:

- Handle HTTP requests/responses
- Manage retries and timeouts
- Handle authentication
- Error handling

**Example**:

```typescript
// ✅ CORRECT
export class HttpClient {
  async request<T>(endpoint: string, options: HttpClientOptions): Promise<T> {
    // HTTP implementation
  }
}
```

#### 4.3 Security Services (`services/security/*`)

**Purpose**: Security utilities and logging.

**Responsibilities**:

- PII masking
- Secure logging
- Error reporting
- Security event tracking

### 5. Store Layer (`packages/store/`)

**Purpose**: Global state management with Zustand.

**Responsibilities**:

- Define application state structure
- Provide state selectors and setters
- Persistence middleware
- DevTools integration

**Allowed Imports**:

- `packages/schemas/*` - Type definitions

**Forbidden Imports**:

- ❌ `packages/config/api/*` - No API calls in store
- ❌ `packages/services/*` - No business logic in store
- ❌ `packages/hooks/*` - Store is framework-agnostic

### 6. Navigation Adapter (`packages/navigation/`)

**Purpose**: Single abstraction for navigation so that features and shared hooks do not depend on `react-router-dom` directly. This allows a second implementation for React Native later without changing feature code.

**Who must use it**:

- **`apps/web/features/**`** – All feature code must use `useNavigation()`, `linkProps()`, `pathFor()`, `ROUTES`, and `useInRouterContext()` from `packages/navigation` only.
- **`packages/hooks/**`** – All hooks that perform navigation or read location/search params must use the navigation adapter only.

**Who may keep using react-router-dom**:

- **Root route setup**: `apps/web/app/routes.tsx`, `apps/web/app/routes/*`, `apps/web/main.tsx` (e.g. `Routes`, `Route`, `BrowserRouter`, `Navigate`, `Outlet`).
- **App shell**: Layouts, guards, and providers under `apps/web/app/` may continue to use `useLocation`, `Link`, `Navigate` from react-router-dom until migrated; new code in features/hooks must use the adapter.

**Adapter API** (from `packages/navigation`):

- `useNavigation()` – Returns `{ navigate, replace, navigateToPath, goBack, getCurrentRoute, getSearchParams, setSearchParams, linkProps }`.
- `pathFor(route, params?)` – Build path string for a named route.
- `ROUTES` – Route path constants (re-exported from `packages/schemas/app/nav`).
- `useInRouterContext()` – Whether the component is inside a router (re-exported for hooks that need it).

**Example**:

```typescript
// ✅ CORRECT (in features or hooks)
import { useNavigation, ROUTES } from "packages/navigation";

function MyFeature() {
  const { navigate, linkProps } = useNavigation();
  return (
    <button onClick={() => navigate("DASHBOARD")}>Go</button>
    <a {...linkProps("SAVED")}>Saved</a>
  );
}

// ❌ WRONG (in features or hooks)
import { useNavigate, Link } from "react-router-dom";
```

**Enforcement**: ESLint `no-restricted-imports` blocks `react-router-dom` and `react-router` in `apps/web/features/**` and `packages/hooks/**`.

**Example** (Store Layer):

```typescript
// ✅ CORRECT
import { create } from "zustand";
import type { UserProfile } from "../schemas/user";

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  setUser: (user: UserProfile | null) => set({ user }),
}));
```

## Data Flow

### Fetching Data

```
Component
  ↓ calls hook
Data Hook (useQuery)
  ↓ calls API
Config/API (authApi.login)
  ↓ uses HTTP
Services/HTTP (HttpClient)
  ↓ makes request
Backend API
```

### Updating Store

```
Component
  ↓ calls hook
Store Integration Hook
  ↓ uses data hook
Data Hook (fetches data)
  ↓ updates store
Store (Zustand)
  ↓ notifies
Component (re-renders)
```

### Example: Saving a Home

```typescript
// 1. Component calls hook
const { saveHome } = useSavedHomesData();

// 2. Hook uses mutation
const saveHomeMutation = useMutation({
  mutationFn: async (property) => {
    // 3. Hook calls API
    return await userApi.addFavoriteHome({ home: property });
  },
});

// 4. API uses HTTP client
export const userApi = {
  addFavoriteHome: async (data) => {
    return apiPost("/api/v1/user/favorite-homes/add", data);
  },
};

// 5. HTTP client makes request
// 6. Store is updated via hook's onSuccess
```

## Common Patterns

### Pattern 1: Creating a Data Hook

```typescript
// packages/hooks/data/useAgentTodos.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { agentApi } from "../../config/api/agent";
import { queryKeys } from "../../config/query/keys";

export const useAgentTodos = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.agent.todos(),
    queryFn: () => agentApi.getTodos(),
  });

  const createTodo = useMutation({
    mutationFn: (data: CreateTodoRequest) => agentApi.createTodo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agent.todos() });
    },
  });

  return {
    todos: data ?? [],
    isLoading,
    error,
    createTodo: createTodo.mutateAsync,
  };
};
```

### Pattern 2: Using a Hook in Component

```typescript
// apps/web/pages/DashboardPage.tsx
import { useAgentTodos } from "packages/hooks/data/useAgentTodos";

export default function DashboardPage() {
  const { todos, isLoading, createTodo } = useAgentTodos();

  const handleCreate = async () => {
    await createTodo({ title: "New Todo" });
  };

  return (
    <div>
      {isLoading ? "Loading..." : todos.map(todo => <div key={todo.id}>{todo.title}</div>)}
    </div>
  );
}
```

### Pattern 3: Store Integration Hook

```typescript
// packages/hooks/store/useAgentTodosStoreIntegration.ts
import { useAgentTodos } from "../data/useAgentTodos";
import { useAgentStore } from "../../store/agent.slice";

export function useAgentTodosStoreIntegration() {
  const { todos, isLoading } = useAgentTodos();
  const setTodos = useAgentStore((s) => s.setTodos);

  useEffect(() => {
    setTodos(todos);
  }, [todos, setTodos]);

  return { todos, isLoading };
}
```

## Migration Guide

### Migrating Component Using API Directly

**Before**:

```typescript
import { userApi } from "../../../packages/config/api/user";

function Component() {
  useEffect(() => {
    userApi.getProfile().then(setUser);
  }, []);
}
```

**After**:

```typescript
import { useUserData } from "packages/hooks/data/useUserData";

function Component() {
  const { user } = useUserData();
}
```

### Migrating Hook Using Service

**Before**:

```typescript
import { agentService } from "../../services/agent";

export const useAgentClients = () => {
  const [clients, setClients] = useState([]);
  useEffect(() => {
    agentService.fetchClients().then(setClients);
  }, []);
  return { clients };
};
```

**After**:

```typescript
import { agentApi } from "../../config/api/agent";
import { useQuery } from "@tanstack/react-query";

export const useAgentClients = () => {
  const { data } = useQuery({
    queryKey: ["agent", "clients"],
    queryFn: () => agentApi.getClients(),
  });
  return { clients: data?.clients ?? [] };
};
```

## Best Practices

1. **Always use hooks in components** - Never import `config/api` or `services` directly
2. **Hooks use config/api** - Data hooks should use `config/api/*`, not `services/*`
3. **Services are framework-agnostic** - Services should not import hooks or React-specific code
4. **Store is updated via hooks** - Components should not mutate store directly
5. **Type-only imports are OK** - Importing types from `config/api` is allowed
6. **Create hooks for missing functionality** - If a hook doesn't exist, create it

## Platform file conventions

For code that differs by platform (web vs React Native), use a single convention:

- **Default:** Use **`.tsx`** / **`.ts`** for files under `apps/web/`. Use **`.web.tsx`** / **`.web.ts`** only when the file **will not be mapped** to mobile: **(1)** it uses a web-only package or API (e.g. `react-dom`, `react-router-dom`, `window`/`document`, `HTMLInputElement`, `@headlessui/react`, `react-virtuoso`), or **(2)** it is desktop/large-screen-only layout and mobile has a different implementation. If mobile can do the same with the same file, the file must not have the `.web` extension. See `MOBILE_MIGRATION_DESKTOP_FILES.md` for the canonical list and reasons.
- **Web-only** (will not be mapped): use `.web.ts`, `.web.tsx` (e.g. `Sidebar.web.tsx`, `sidebarNav.web.ts`).
- **React Native–only**: use `.native.ts`, `.native.tsx` (e.g. `Sidebar.native.tsx`). Do **not** use `.mobile.*`; we standardize on `.native.*` to match common RN usage.
- **Shared or default web**: no suffix; the same file is used by both platforms or is the default implementation (mobile can add `.native.*` later).

Bundlers (e.g. Vite, Metro) resolve imports so that `import './Sidebar'` picks `Sidebar.web.tsx` for web and `Sidebar.native.tsx` for native when both exist.

**Enforcement:**

- **`node tools/check-platform-imports.mjs`** (run via `pnpm lint:platform-imports` from `Client/`):
  - Warns when a file is only imported by `.web.*` or only by `.native.*` files but does not have the matching platform extension; such files should be renamed to `.web.*` or `.native.*`.
  - Fails if the same logical component has both `.mobile.*` and `.native.*` (mixed convention); use `.native.*` only for React Native.
- This script runs in CI as part of the Client lint workflow (see `.github/workflows/client-lint.yml`).
- **ESLint** `silverkey/platform-allowed-imports`: `.web.*` files must not import React Native-only packages; `.native.*` files must not import web-only packages (e.g. `react-dom`, `react-router-dom`). Shared packages are allowed on both.

See also `Client/tools/LINTING.md` for how to run the check locally.

## Design Tokens

The single source of truth for design tokens is **`packages/design-tokens`**. Tailwind theme and ThemeContext consume this package so that colors, spacing, typography, and breakpoints stay in sync.

- **Consumers** must use token helpers or Tailwind theme; do not use literal hex colors or raw numeric spacing in UI code (enforced by ESLint in `apps/web/components/**` and `apps/web/features/**`).
- **Token helpers**: `spacing(n)` (or `spacingToken(n)`), `color(path)`, `breakpoint(name)` from `packages/design-tokens`.
- **Tailwind**: Use theme classes (e.g. `text-brand-accent`, `p-2`, `gap-4`) instead of arbitrary values like `p-[13px]` or hex in class names.
- **Literal hex** is allowed only in `packages/design-tokens` (e.g. `tokens/colors.ts`). Everywhere else use `color()` or Tailwind color classes.
- **Raw spacing**: Avoid `margin: 8`, `padding: 13`, or Tailwind arbitrary spacing like `p-[13px]`; use `spacing(2)`, `p-2`, or other token-based classes.

See `packages/design-tokens/README.md` for the package API.

## Related Documentation

- [Architecture Violations Report](../ARCHITECTURE_VIOLATIONS.md) - List of current violations
- [Cursor Rules](../.cursor/rules/frontend-architecture.mdc) - Strict architecture rules
