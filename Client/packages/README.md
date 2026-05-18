# Packages Directory

Shared packages under `Client/packages/` implement almost all client behavior. **`apps/web`** and **`apps/mobile`** compose these packages; they stay thin (routing, providers, thin pages/screens).

## Directory structure

```
packages/
├── api/             # Small API helpers surfaced as a package (see `packages/api/`)
├── config/          # API clients, env, HTTP config, React Query setup
├── contexts/        # React Context providers
├── design-tokens/   # Tokens (colors, spacing, breakpoints)
├── email-templates/ # Email-oriented modules
├── features/        # Feature modules (search, profile, agent, …) — primary UI + feature logic
├── hooks/           # Shared React hooks (data, store, UI)
├── logger/          # Frontend logging (`packages/logger`)
├── navigation/      # Navigation adapter (paths; no react-router-dom in features)
├── schemas/         # Shared TypeScript types
├── services/        # HTTP, security, domain services
├── store/           # Zustand slices
├── types/           # Shared types barrel
├── ui/              # Shared UI primitives and design-system components
└── utils/           # Framework-agnostic utilities
```

Shared CSS for the design system lives under **`packages/ui/styles/`**; the web app wires Tailwind and global styles from `apps/web`.

## Architecture overview

```
apps/web (pages, layouts)
  -> packages/hooks/
    -> packages/api/          # canonical API barrel (also re-exported from packages/config/http/api)
      -> packages/services/http/
```

### Principles

1. **Framework boundaries:** Services, store, utils, schemas, and most of `config/` avoid React. Hooks and contexts use React; feature modules are React-oriented but stay importable from both apps.
2. **Single feature home:** Feature-specific components, hooks, API helpers, types, and utils live in **`packages/features/<name>/`** (not in fat app folders).
3. **Type safety:** Strict TypeScript; API types follow OpenAPI-generated types where applicable.

## Import paths (canonical)

- **`packages/...`** — **Preferred** for every module under `Client/packages/` (from apps or from other packages).
- **`@/...`** — **Only** for files under **`Client/apps/web/`** (e.g. `@/pages/property/SearchPage`, `@/app/layouts/...`).
- **`@/features/...`** — TypeScript alias for `packages/features/...`. **New code** should prefer **`packages/features/...`** so shared imports read the same everywhere.

Do not import API clients or business `packages/services` from page/components; use `packages/hooks`. **Canonical API path:** `packages/api` (see [shared-packages.md](../documentation/client/shared-packages.md#api-client-import-path-canonical)).

## Import rules by layer

### Apps (`apps/web/`, `apps/mobile/`)

- Can import: `packages/hooks/*`, `packages/store`, `packages/schemas`, `packages/utils`, `packages/contexts`, `packages/navigation`, `packages/ui`, `packages/features/*`, `packages/logger`, and other allowed shared packages.
- Cannot import: `packages/config/api/*` or business `packages/services/*` (use hooks).

### Hooks (`packages/hooks/`)

- Can import: `packages/api` (or `packages/config/http/api`), `packages/store/*`, `packages/schemas/*`, `packages/services/http/*`, `packages/services/security/*`.
- Cannot import: business-logic `packages/services/*` (use `packages/api`).

### Services (`packages/services/`)

- Can import: `packages/api`, `packages/services/http/*`, `packages/services/security/*`, `packages/schemas/*`.
- Cannot import: `packages/hooks/*`, `packages/store/*`.

### Config (`packages/config/`)

- Can import: `packages/services/http/*`, `packages/services/security/*`, `packages/schemas/*`.
- Cannot import: business-logic `packages/services/*`.

## Package descriptions

### `config/`

Thin API client modules and app configuration. Primary HTTP surface for hooks.

### `services/`

HTTP client, security helpers, and domain orchestration. Apps use hooks, not services directly.

### `hooks/`

Shared React hooks: React Query data hooks, store integration, UI behavior.

### `store/`

Zustand slices; updated through `packages/hooks/store/*` where integration is needed.

### `schemas/`

Shared types and schema helpers.

### `utils/`

Pure, framework-agnostic helpers. No React.

### `contexts/`

React providers (theme, i18n, etc.).

### `features/`

Feature modules consumed by thin pages/screens. Each feature exposes a barrel (`index.ts`) where applicable. Structure and allowed children are enforced (see `features/README.md` and `silverkey/package-module-allowed-children`).

### `ui/`

Shared layout primitives, buttons, text, modals, cards, and other cross-platform-oriented UI. Includes **`packages/ui/styles/`** (CSS and style helpers). Apps import via `packages/ui` or the `@/components/ui` / `@ui` aliases defined in `Client/tsconfig.base.json`.

## Patterns

### Data fetching

```typescript
// CORRECT: component uses a hook
import { useUserData } from "packages/hooks/data/user/useUserData";

function Component() {
  const { user } = useUserData();
  // ...
}

// WRONG: component imports API client
import { userApi } from "packages/config/api/user";
```

### Errors

```typescript
import { normalizeError, reportError } from "packages/utils/errorHandling";
```

### Types

```typescript
import type { SavedHome } from "packages/types";
```

## Exceptions

`packages/services/data/` may use React Query’s `QueryClient` for prefetch/polling.

## Further reading

- `AGENTS.md` (repo root) — quickstart for AI assistants
- `Client/ARCHITECTURE.md` — full client architecture
- `documentation/client/README.md` — doc index
- `documentation/client/shared-packages.md` — exhaustive package reference
- `features/README.md` — feature module layout
- `.cursor/rules/frontend/frontend-architecture.mdc` — ESLint-aligned layer rules
