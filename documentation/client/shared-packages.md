# Shared Packages — Exhaustive Reference

This document is the **exhaustive** reference for all **shared packages** in the SilverKey Client monorepo. Shared packages live under `Client/packages/` (and the top-level `Client/logger/`) and are consumed by one or more apps (`apps/web`, and when present `apps/mobile`). They contain no app-specific UI; they provide logic, types, configuration, and shared primitives.

---

## Table of Contents

1. [Overview and Principles](#overview-and-principles)
2. [Package Inventory](#package-inventory)
3. [Per-Package Exhaustive Reference](#per-package-exhaustive-reference)
4. [Dependency Graph and Import Rules](#dependency-graph-and-import-rules)
5. [Consumers and Usage](#consumers-and-usage)
6. [Workspace and Build](#workspace-and-build)

---

## Overview and Principles

### What Counts as a Shared Package

- **Location:** `Client/packages/<name>/` or (for logger) `Client/logger/`.
- **Consumed by:** `apps/web`, and when applicable `apps/mobile`, and optionally other packages.
- **No app-specific UI:** Shared packages do not contain pages, app routes, or app-only layouts; they may contain shared UI primitives only if the project adopts a shared `packages/ui` (see [shared-ui-package.md](./shared-ui-package.md)).

### Core Principles

1. **Single source of truth** — Types, API clients, store, and utilities live in packages so both web and mobile (and future apps) reuse the same logic.
2. **Layered architecture** — Strict import rules: components → hooks → config/api → services/http; no bypassing layers.
3. **Framework boundaries** — Packages are either framework-agnostic (no React) or React-only (hooks, contexts); no React Native–specific code in shared packages unless using platform extensions (`.web.*` / `.native.*`).
4. **No direct app imports** — Shared packages must not import from `apps/web/*` or `apps/mobile/*`.

---

## Package Inventory

| Package | Path | Purpose | React? | RN-safe? |
|--------|------|---------|--------|----------|
| **config** | `packages/config/` | API clients, env, HTTP config, React Query | No* | Yes |
| **services** | `packages/services/` | Business logic, HTTP, security | No** | Yes |
| **hooks** | `packages/hooks/` | Data, store, UI hooks | Yes | Yes |
| **store** | `packages/store/` | Zustand slices, middleware | No | Yes |
| **schemas** | `packages/schemas/` | TypeScript types, Zod-style defs | No | Yes |
| **utils** | `packages/utils/` | Framework-agnostic utilities | No | Yes |
| **contexts** | `packages/contexts/` | React Context providers | Yes | Yes*** |
| **navigation** | `packages/navigation/` | Route paths, adapter (no router-dom in features) | No | Yes |
| **design-tokens** | `packages/design-tokens/` | Colors, spacing, breakpoints, typography | No | Yes |
| **styles** | `packages/styles/` | CSS / Tailwind utilities | N/A (CSS) | Web-only |
| **logger** | `Client/logger/` | Centralized logging, PII scrubbing | No | Yes |

\* React Query lives in `config/query/`; the rest of config is non-React.  
\** `services/data/` uses React Query's `QueryClient` for prefetch/polling; otherwise services are framework-agnostic.  
\*** Contexts use React but no DOM; mobile can consume the same contexts or provide its own provider shell.

**Note:** `packages/ui/` may exist as a placeholder or future shared UI package; see [shared-ui-package.md](./shared-ui-package.md).

---

## Per-Package Exhaustive Reference

### 1. `packages/config/`

**Purpose:** Thin, type-safe API client wrappers and configuration. Primary interface for all HTTP/API calls.

**Contents (summary):**

- **`config/api/`** — Domain API modules: `auth/`, `user`, `search/`, `calendar/googleCalendar/`, `documents/`, `agent/`, `feed/`, `chat/`, `core/`, `standalone/`, `offer`, `secureUpload`, `maps`, `googleCalendar`, `chatbot`, `index`.
- **`config/query/`** — `queryClient.ts`, `keys.ts`, `adapters.ts` (React Query setup).
- **Root:** `auth.ts`, `env.ts`, `http.ts`, `vite-env.d.ts`, `index.ts`.

**File types:** All `.ts`. No `.tsx` in config (React Query is configured here but no JSX).

**Allowed imports:** `packages/services/http/*`, `packages/services/security/*`, `packages/schemas/*`.

**Forbidden imports:** Business logic `services/*`, `hooks/*`, `store/*`, `apps/*`.

**Consumers:** `packages/hooks/*` (primary), `packages/services/*`, and indirectly apps via hooks.

---

### 2. `packages/services/`

**Purpose:** Business logic orchestration and infrastructure (HTTP client, security, domain services).

**Contents (summary):**

- **`services/http/`** — `client/` (HttpClient, request/response helpers), `compatibility/` (apiGet, apiPost, upload/download, auth helpers), `compatibility/helpers/`, `compatibility/core/`, `compatibility/auth/`.
- **`services/security/`** — Secure logging, error reporting, PII, clipboard security, error utils.
- **`services/data/`** — Data loading, background polling, React Query integration (exception: uses QueryClient).
- **Domain services:** `agent.ts`, `agentDashboard.ts`, `auth.ts`, `chats.ts`, `documents/`, `googleCalendar.ts`, `googleMaps.ts`, `negotiation/`, `reports/`, `savedHomes.ts`, `scheduling.ts`, `search/` (incl. googleMaps), `plaid.ts`, etc.

**File types:** All `.ts`. No React components; no hooks.

**Allowed imports:** `packages/config/api/*`, `packages/services/http/*`, `packages/services/security/*`, `packages/schemas/*`.

**Forbidden imports:** `packages/hooks/*`, `packages/store/*`, `apps/*`.

**Consumers:** `packages/config/*` (HTTP/security only), and optionally server or tooling; apps use hooks → config/api, not services directly.

---

### 3. `packages/hooks/`

**Purpose:** React hooks for data fetching (React Query), store integration (Zustand), and UI state.

**Contents (summary):**

- **`hooks/data/`** — Data hooks per domain: `auth/`, `calendar/`, `chat/`, `documents/`, `feed/`, `negotiation/`, `search/` (compare, isochrone, map, page, property, results, saved, useMapMarkers), `user/`, plus `useDataPolling.ts`, `useGoogleMaps.ts`, etc.
- **`hooks/store/`** — Store integration: `auth/`, `calendar/`, `documents/`, `featureFlags/`, `filters/`, `map/`, `negotiation/`, `performance/`, `search/`, `session/`, `ui/`.
- **`hooks/ui/`** — UI hooks: `auth/`, `clipboard/`, `core/`, `documents/`, `feed/`, `profile/`, `responsive/`, `scroll/`, `toast/`, plus `useContainerWidth.ts`, etc.

**File types:** All `.ts`. No `.tsx` in hooks (hooks do not render JSX).

**Allowed imports:** `packages/config/api/*`, `packages/store/*`, `packages/schemas/*`, `packages/services/http/*`, `packages/services/security/*`.

**Forbidden imports:** Business logic `packages/services/*` (use config/api); `apps/*`.

**Consumers:** `apps/web/*` (and when present `apps/mobile/*`); components must use hooks, not config/api or services directly.

---

### 4. `packages/store/`

**Purpose:** Zustand store slices and middleware for global application state.

**Contents (summary):**

- **`store/slices/`** — `auth/`, `documents/`, `featureFlags/`, `feed/`, `maps/`, `negotiation/`, `notifications/`, `reports/`, `saved/`, `scheduling/`, `search/`, `ui/`, `user/`.
- **`store/middleware/`** — DevTools, persist, resettable, etc.
- **`store/index.ts`** — Public API (barrel).

**File types:** All `.ts`. No React; Zustand is framework-agnostic.

**Allowed imports:** `packages/schemas/*` only.

**Forbidden imports:** `packages/config/*`, `packages/services/*`, `packages/hooks/*`, `apps/*`.

**Consumers:** `packages/hooks/store/*` (integration hooks), `apps/web/*` and `apps/mobile/*` via selectors (e.g. `useAuthStore(s => s.user)`).

---

### 5. `packages/schemas/`

**Purpose:** Centralized TypeScript type definitions and Zod-style schemas for API, domain, and app.

**Contents (summary):**

- **`schemas/api/`** — API types, user schema.
- **`schemas/app/`** — `auth/user`, `nav/`, `ui/` (screens, button, icons).
- **`schemas/calendar/`**, **`schemas/content/`** (feed, documents), **`schemas/finance/`** (billing, offers, metrics), **`schemas/integrations/`** (chat, checklists, google-maps), **`schemas/property/`**, **`schemas/scheduling/`**, **`schemas/search/`**, **`schemas/user/`**, **`schemas/agent/`**, **`schemas/plaid.ts`**, **`schemas/propertyDetails.ts`**, **`schemas/index.ts`**.

**File types:** All `.ts`. Types only; no runtime React or framework code.

**Allowed imports:** Other `schemas/*` files; third-party type definitions.

**Forbidden imports:** `config/*`, `services/*`, `hooks/*`, `store/*`, `apps/*`.

**Consumers:** All other packages and apps (type-only imports).

---

### 6. `packages/utils/`

**Purpose:** Framework-agnostic utility functions (no React, no DOM/RN-specific code).

**Contents (summary):**

- **`utils/core/`** — `array/`, `date/`, `dom/`, `errorHandling/`, `format/`, `platform/`, `routing/`, `storage/`, `typeGuards/`, `ui/` (e.g. inputStyles), `verification/`.
- **`utils/domain/`** — `auth/`, `calendar/`, `compareHomes/`, `documents/`, `feed/`, `layout/`, `messaging/`, `profile/`, `saved/`, `search/`.

**File types:** All `.ts`. No `.tsx`; no React.

**Allowed imports:** Other `utils/*`; `schemas/*` (type-only); third-party libs.

**Forbidden imports:** `react`, `config/*`, `services/*`, `hooks/*`, `apps/*`.

**Consumers:** `packages/hooks/*`, `packages/contexts/*`, `packages/services/*` (if needed), `apps/web/*` and `apps/mobile/*`.

---

### 7. `packages/contexts/`

**Purpose:** React Context providers for theming, localization, and dependency injection (non-state config).

**Contents (summary):**

- **Provider components:** e.g. `ThemeContext.tsx`, `LocalizationContext.tsx`, `ServiceContext.tsx` (if present); `FeedReelsContext.context.ts` + types; `SearchRefreshContext.context.ts`.
- **Hooks and types:** `useFeedReelsContext.ts`, `useSearchRefresh.ts`, `FeedReelsContext.types.ts`.
- **Translations:** `translations/` (stringsPart1a, 1b, 2a, 2b, 3, index).
- **`contexts/index.ts`** — Barrel.

**File types:** Mix of `.ts` and `.tsx`. Only provider components are `.tsx`; rest `.ts`.

**Allowed imports:** `packages/hooks/*`, `packages/schemas/*`, `packages/utils/*`.

**Forbidden imports:** `packages/config/api/*`, `packages/services/*`, `apps/*`.

**Consumers:** `apps/web/*` (and when present `apps/mobile/*`) at app shell / root; feature code uses hooks/contexts from here.

---

### 8. `packages/navigation/`

**Purpose:** Navigation adapter — route paths, types, and a single API (`useNavigation`, `pathFor`, `ROUTES`, `linkProps`, `useInRouterContext`) so features and hooks do not depend on `react-router-dom` directly. Enables a React Native navigation implementation later.

**Contents (summary):**

- **`paths.ts`**, **`types.ts`**, **`routerContext.ts`**, **`useNavigation.ts`**, **`index.ts`**.

**File types:** All `.ts`. No JSX; adapter only.

**Allowed imports:** `packages/schemas/*` (e.g. app/nav for ROUTES); no `react-router-dom` in this package (adapter wraps it at app level).

**Forbidden imports:** `apps/*`; direct `react-router-dom` in exported API (app shell may still use it for setup).

**Consumers:** `apps/web/features/**`, `packages/hooks/**` (for navigation/location); root route setup in `apps/web/app/` may still use react-router-dom.

---

### 9. `packages/design-tokens/`

**Purpose:** Single source of truth for design tokens (colors, spacing, typography, breakpoints). Consumed by Tailwind and ThemeContext.

**Contents (summary):**

- **`tokens/`** — `colors.ts`, `breakpoints.ts`, etc.
- **`helpers.ts`**, **`index.ts`** — API: `color(path)`, `spacing(n)`, `spacingToken(n)`, `breakpoint(name)`, raw token objects.

**File types:** All `.ts`. No React.

**Allowed imports:** No internal package dependencies; optional third-party for color/theme utils.

**Forbidden imports:** `hooks/*`, `config/*`, `apps/*`.

**Consumers:** `apps/web` (Tailwind config, ThemeContext, components via theme/tokens); when present, `apps/mobile` can use same tokens for styling.

---

### 10. `packages/styles/`

**Purpose:** CSS stylesheets and Tailwind utility classes (web styling).

**Contents:** CSS/PostCSS/Tailwind files (exact layout may vary).

**File types:** `.css`, config files. No TypeScript/React in styles themselves.

**Platform:** **Web-only.** React Native does not use CSS; mobile uses its own styling (StyleSheet, etc.).

**Consumers:** `apps/web` build (Tailwind/PostCSS pipeline).

---

### 11. `Client/logger/`

**Purpose:** Centralized logging with category-based filtering and PII scrubbing (frontend).

**Contents (summary):**

- **`logger.ts`** — Main logger (debug, info, warn, error, security).
- **`pii.ts`** — PII scrubbing (emails, phones, tokens, etc.).
- **`categories.ts`** — Log categories.
- **`logger.config.json`** — Config.
- **`index.ts`** — Public API.

**File types:** All `.ts`. No React.

**Allowed imports:** No dependency on other Client packages (or minimal); PII and categories are self-contained.

**Consumers:** All packages and apps that need frontend logging (use `logger` from `Client/logger`).

---

## Dependency Graph and Import Rules

### Allowed Dependency Flow (summary)

```
apps/web (components)
  → packages/hooks, packages/store, packages/schemas, packages/utils, packages/contexts, packages/navigation, packages/design-tokens, logger

packages/hooks
  → packages/config, packages/store, packages/schemas, packages/services/http, packages/services/security

packages/contexts
  → packages/hooks, packages/schemas, packages/utils

packages/config
  → packages/services/http, packages/services/security, packages/schemas

packages/services
  → packages/config, packages/services/http, packages/services/security, packages/schemas

packages/store
  → packages/schemas only

packages/schemas
  → (other schemas or externals only)

packages/utils
  → packages/schemas (type-only), other utils

packages/navigation
  → packages/schemas

packages/design-tokens
  → (none or minimal)
```

### Forbidden Imports (all packages)

- No package may import from `apps/web/*` or `apps/mobile/*`.
- Components (apps) must not import `packages/config/api/*` or business `packages/services/*` directly; they use `packages/hooks/*`.
- Hooks must not import business logic `packages/services/*`; they use `packages/config/api/*`.
- Services and config must not import `packages/hooks/*` or `packages/store/*`.
- Store must not import config, services, or hooks.

---

## Consumers and Usage

| Consumer | Uses |
|----------|------|
| **apps/web** | hooks, store, schemas, utils, contexts, navigation, design-tokens, logger. Does **not** import config/api or services directly from components. |
| **apps/mobile** (when present) | Same shared packages as web for logic; UI will use RN components; navigation adapter can have a native implementation. |
| **packages/hooks** | config/api, store, schemas, services/http, services/security. |
| **packages/services** | config/api, services/http, services/security, schemas. |
| **packages/config** | services/http, services/security, schemas. |

---

## Workspace and Build

- **Monorepo tooling:** Client uses pnpm; filters include `@silverkey/web`, `@silverkey/mobile` (when present). Packages are not all published; many are internal (e.g. `packages/config` has no `package.json` in the list; only `design-tokens` and `eslint-plugin-silverkey` have their own `package.json`). Resolution is typically via workspace or path (e.g. `packages/config`, `packages/hooks`).
- **TypeScript:** Shared packages are included in the app tsconfig (e.g. `tsconfig.app.json`) so that `packages/*` and `logger` are type-checked together with the app.
- **Linting:** ESLint and architecture rules enforce the import boundaries above (see `Client/ARCHITECTURE.md` and `.cursor/rules/frontend/frontend-architecture.mdc`).

---

## Related Documentation

- [typescript-files.md](./typescript-files.md) — Where `.ts` files live and their roles.
- [shared-ui-package.md](./shared-ui-package.md) — Optional shared `packages/ui` for cross-platform primitives.
- [react-vs-react-native-packages.md](./react-vs-react-native-packages.md) — React vs React Native–specific code and platform extensions.
- **Client/ARCHITECTURE.md** — Full frontend architecture and layer descriptions.
- **Client/packages/README.md** — High-level package overview and import rules.
