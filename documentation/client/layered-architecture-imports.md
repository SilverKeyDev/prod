# Client layered imports and package roles

Long-form reference for **import rules** and **package responsibilities**. The active Cursor rule is [`.cursor/rules/frontend/frontend-architecture.mdc`](../../.cursor/rules/frontend/frontend-architecture.mdc) (short pointer + examples). This document holds the detailed matrix and layer descriptions.

See also: [Client/ARCHITECTURE.md](../../Client/ARCHITECTURE.md), [documentation/client/thin-app-architecture.md](thin-app-architecture.md).

## Directory roles

### 1. `packages/config/` — configuration and API clients

**Purpose:** Thin, type-safe API client wrappers and configuration constants.

**Contains:**

- `config/api/*` — API client functions (e.g. `authApi`, `userApi`, `searchApi`)
- `config/http.ts` — HTTP configuration constants
- `config/env.ts` — environment variables
- `config/query/*` — React Query setup

**Rules:**

- MUST only import from `services/http/*` and `services/security/*`
- MUST NOT import from `services/*` (business logic services)
- MUST NOT import from `hooks/*` or `store/*`
- MUST NOT import from `apps/web/*` or feature components

**Example:**

```typescript
// ✅ CORRECT: config/api/auth.ts
import { apiPost, apiGet } from "../../services/http/compatibility";
import { log } from "../../services/security/secureLogger";

export const authApi = {
  login: async (data: LoginData) => {
    return apiPost<AuthResponse>("/api/v1/auth/login", data);
  },
};

// ❌ WRONG: Importing business logic service
import { agentService } from "../../services/agent"; // FORBIDDEN
```

### 2. `packages/services/` — business logic and infrastructure

**Purpose:** Business logic orchestration, state management, and infrastructure services.

**Contains:**

- Business logic services (e.g. `AgentService`, `ChatService`, `NegotiationService`)
- `services/http/*` — low-level HTTP client implementation
- `services/security/*` — security utilities

**Rules:**

- Services MUST use `config/api/*` for all API calls
- Services MUST NOT import from `hooks/*` or `store/*` directly
- Services MUST NOT import from `apps/web/*` or `packages/features/*` (UI)
- Services can import from `services/http/*` and `services/security/*`
- Services are typically class-based singletons

### 3. `packages/hooks/` — React hooks (no JSX)

**Purpose:** Shared React hooks for data fetching, store integration, and UI state.

**Rules:**

- `hooks/data/*` MUST use `config/api/*` directly, never business `services/*` (except `services/http` utilities)
- `hooks/store/*` can use `hooks/data/*` and `store/*`
- `hooks/ui/*` should be pure UI state (no API calls)
- Hooks MUST NOT import from `apps/web/*` or feature components
- Hooks MUST NOT import business logic services
- Hook files MUST be `.ts`, not `.tsx` (no JSX)

### 4. `packages/store/` — global state

**Purpose:** Zustand slices for application-wide state.

**Rules:**

- Store slices define state structure and basic setters
- Store is updated via `hooks/store/*` integration hooks
- Components should NOT mutate store directly (use hooks)

### 5. `packages/features/<feature>/` — feature UI and feature-local code

**Purpose:** Feature modules: components, feature hooks, utils, and types colocated per feature (see `Client/ARCHITECTURE.md`).

**Rules:**

- Feature UI MUST compose `packages/ui` primitives and shared hooks; MUST NOT import `config/api/*` or `services/*` directly in components — use hooks
- Cross-feature imports are constrained by ESLint (`eslint-plugin-silverkey`); prefer shared `packages/utils` or `packages/hooks` when multiple features need the same thing

### 6. `apps/web/` and `apps/mobile/` — thin composition

**Purpose:** Routes, pages/screens, and wiring only — **no** business logic or standalone utilities in `apps/web/components` or `apps/web/features` trees (use `packages/`).

**Rules:**

- Pages/screens MUST use hooks, not `config/api/*` or business `services/*` directly
- Do NOT add standalone `.ts` logic under `apps/web/components/` or `apps/web/features/`; use `packages/utils/`, `packages/hooks/`, or `packages/schemas/`

## Import rules summary

### Allowed imports (typical)

| From                          | Can import                                                                                                                                                |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/*`, `apps/mobile/*` | `hooks/*`, `store/*` (selectors/hooks per state-boundaries rule), `schemas/*`, `utils/*`, `contexts/*`, `packages/features/*`, `packages/ui/*`            |
| `packages/features/*`         | `hooks/*`, `store/*`, `schemas/*`, `utils/*`, `contexts/*`, `packages/ui/*`, sibling paths within feature and other features **only where ESLint allows** |
| `hooks/data/*`                | `config/api/*`, `store/*`, `schemas/*`, `services/http/*`, `services/security/*`                                                                          |
| `hooks/store/*`               | `hooks/data/*`, `store/*`, `schemas/*`                                                                                                                    |
| `hooks/ui/*`                  | `utils/*` (no API calls)                                                                                                                                  |
| `config/api/*`                | `services/http/*`, `services/security/*`, `schemas/*`                                                                                                     |
| `services/*`                  | `config/api/*`, `services/http/*`, `services/security/*`, `schemas/*`                                                                                     |
| `store/*`                     | `schemas/*`                                                                                                                                               |

### Forbidden imports

- ❌ UI (apps or `packages/features`) → `config/api/*` or business `services/*` (use hooks)
- ❌ Hooks → business `services/*` (use `config/api/*`)
- ❌ Services → `hooks/*` or `store/*`
- ❌ Config → business `services/*` (only HTTP/security utilities)

## Common violations and fixes

### Component using API directly

Use a data hook that calls `config/api/*`.

### Component using service directly

Same: add or use a hook; hooks call `config/api/*`, not class services.

### Service importing hooks or store

Pass data as parameters or use `config/api/*` for server-side/session validation patterns.

## Exceptions

- `services/http/*` and `services/security/*` can be imported by `config/api/*`
- `store/*` can be imported by `hooks/store/*`
- Type-only imports from `schemas/*` are allowed where TypeScript permits
- Utility functions from `utils/*` can be imported broadly subject to architecture linters
