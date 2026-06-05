# Shared Packages — Exhaustive Reference

This document is the **exhaustive** reference for all **shared packages** in the SilverKey Client monorepo. Shared packages live under `Client/packages/` and are consumed by one or more apps (`apps/web`, and when present `apps/mobile`). They contain no app-specific routes; they provide logic, types, configuration, shared UI (`packages/ui`), and feature modules (`packages/features`).

---

## Table of Contents

1. [Overview and Principles](#overview-and-principles)
2. [Package Inventory](#package-inventory)
3. [Large feature modules: subdirectory map](#large-feature-modules-subdirectory-map)
4. [Per-Package Exhaustive Reference](#per-package-exhaustive-reference)
5. [Dependency Graph and Import Rules](#dependency-graph-and-import-rules)
6. [Consumers and Usage](#consumers-and-usage)
7. [Workspace and Build](#workspace-and-build)

---

## Overview and Principles

### What Counts as a Shared Package

- **Location:** `Client/packages/<name>/` (including `packages/logger/`).
- **Consumed by:** `apps/web`, and when applicable `apps/mobile`, and optionally other packages.
- **No app-specific UI:** Shared packages do not contain pages, app routes, or app-only layouts. Shared UI primitives and design-system components live in **`packages/ui/`** (see also [shared-ui-package.md](../platform/shared-ui-package.md)).

### Core Principles

1. **Single source of truth** — Types, API clients, store, and utilities live in packages so both web and mobile (and future apps) reuse the same logic.
2. **Layered architecture** — Strict import rules: components → hooks → `packages/api` → services/http; no bypassing layers.
3. **Framework boundaries** — Packages are either framework-agnostic (no React) or React-only (hooks, contexts); no React Native–specific code in shared packages unless using platform extensions (`.web.*` / `.native.*`).
4. **No direct app imports** — Shared packages must not import from `apps/web/*` or `apps/mobile/*`.

### API client import path (canonical)

**Use `packages/api`** (and subpaths such as `packages/api/admin`) for API clients and shared API types. That package is the implementation barrel: it re-exports domain clients from `packages/features/*/api/` and generated contract types.

**`packages/config/http/api`** re-exports the same surface for backward compatibility. Prefer **`packages/api`** in new code so features, hooks, and services share one path. Importing from `packages/config` or `packages/config/http/api` is equivalent but discouraged for new edits.

**Do not use `packages/config/api`** — there is no `packages/config/api/` tree; older docs referred to that name. ESLint blocks `packages/config/api/*` in feature **components** (non-`api/` paths); feature **`api/`** modules and hooks may call clients via `packages/api`.

| Layer | API imports |
| ----- | ----------- |
| `packages/features/*/api/` | `packages/api` or feature-local `api/` modules |
| `packages/features/*` (hooks, utils, components) | `packages/api` for clients/types; prefer hooks in components for runtime calls |
| `packages/hooks/` | `packages/api` (or `packages/config/http/api` only when touching legacy lines) |
| `apps/*` | No direct API clients — use `packages/hooks` |

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
| **ui** | `packages/ui/` | Design-system components, primitives, `packages/ui/styles/` (web CSS) | Yes | Yes**** |
| **features** | `packages/features/` | Feature-level modules (saved, agent, search, etc.) | Yes | Yes |
| **types** | `packages/types/` | API/generated and shared type barrel | No | Yes |
| **api** | `packages/api/` | Canonical API client barrel (re-exports feature `api/` modules and contract types) | No | Yes |
| **logger** | `packages/logger/` | Centralized logging, PII scrubbing | No | Yes |

**Feature module structure:** Each subfolder under `packages/features/<name>/` may only contain: `api/`, `components/`, `hooks/`, `store/`, `types/`, `utils/`, and `index.ts` (barrel). Enforced by ESLint rule `silverkey/package-module-allowed-children`. See `Client/packages/features/README.md` and `.cursor/rules/shared/package-feature-structure.mdc`.

**Cross-feature imports:** Hub features (dashboard, saved, agent, checklists, search, messaging) compose other features through public barrels and documented subpaths—not forbidden. Policy, tiers, and audit edge matrix: [cross-feature-composition.md](./cross-feature-composition.md).

\* React Query lives in `config/query/`; the rest of config is non-React.
\** `services/data/` uses React Query's `QueryClient` for prefetch/polling; otherwise services are framework-agnostic.
\*** Contexts use React but no DOM; mobile can consume the same contexts or provide its own provider shell.
\**** `packages/ui` uses `.web` / `.native` where needed; CSS files are web-oriented.

**Note:** Email templates may live under `packages/email-templates/`. See [shared-ui-package.md](../platform/shared-ui-package.md) for design-system rationale.

---

## Feature module inventory

All feature folders under `Client/packages/features/` (see also [`Client/packages/features/README.md`](../../../Client/packages/features/README.md)):

| Module | Role |
|--------|------|
| `admin` | Super-admin and dev persona UI |
| `agent` | Agent workspace, clients, messaging chrome |
| `brokerage` | Brokerage workspace shell |
| `calendar` | Calendar and events |
| `checklists` | Transaction checklists |
| `compare` | Property comparison |
| `dashboard` | Dashboard shell composition |
| `documents` | Documents, agreements, DocuSign |
| `feed` | Feed and reels |
| `homeauth` | Auth, landing, onboarding entry |
| `integrationPartner` | Integration-partner workspace shell |
| `messaging` | Threads and messaging shell |
| `negotiate` | Negotiation UI |
| `partners` | Partner marketplace (RESPA-scoped) |
| `profile` | Profile, preferences, onboarding registry |
| `propertyDetails` | Property detail modal |
| `saved` | Saved homes |
| `search` | Search map/list/filters |
| `seller` | Seller workspace shell |
| `workspace` | Workspace switcher and placeholders |

Not every module needs every allowed subfolder (`api/`, `store/`, etc.) — see [feature-module-folder-and-layering-audit.md](../../internal/component-audit/feature-module-folder-and-layering-audit.md).

## Large feature modules: subdirectory map

Large features accumulate many files. When using `@` / search in the repo, start from these subtrees (each lives under `Client/packages/features/<name>/`).

### `search/`

| Subtree | Role |
|--------|------|
| `api/` | Search and research API helpers |
| `components/` | Shell UI: `header/`, `layout/`, `list/`, `map/`, `filters/`, `reels/`, `cards/`, `share/`, top-level `SearchScreen*.tsx` |
| `hooks/data/` | `page/`, `map/`, `results/`, `property/`, `saved/`, `isochrone/`, `useMapMarkers/` |
| `hooks/store/` | Search view / store integration |
| `hooks/ui/` | Mobile header and other UI-only search hooks |
| `store/` | Search slice and cache helpers |
| `utils/` | `filters/`, `googleMaps/`, `map/`, `transform/`, `outcomes/` |

### `profile/`

| Subtree | Role |
|--------|------|
| `api/` | Profile-related API |
| `components/` | `sections/`, `settings/`, `profileScreen/`, `onboard/`, `account/`, `layout/`, etc. |
| `hooks/data/` | Profile and favorites data |
| `utils/` | Onboarding helpers, financials, `agentPublicProfile/`, `public/`, etc. |

### `calendar/`

| Subtree | Role |
|--------|------|
| `api/` | Calendar and scheduling queries |
| `components/` | `shell/`, `view/`, `timeGrid/`, `agenda/`, `eventForm/`, `scheduling/` |
| `hooks/data/` | `core/`, `createEvent/`, `google/`, etc. |
| `hooks/store/` | Google calendar / integration hooks |
| `hooks/ui/` | Quick-create and UI session hooks |
| `store/` | Calendar feature store |
| `utils/` | `grid/`, `agenda/`, `createEventModal/`, `parsing/`, `core/` |

### `feed/`

| Subtree | Role |
|--------|------|
| `api/` | Feed and reel API |
| `components/` | `Reels/`, `FeedItem/`, `Overlay/`, `carousel/`, `Modals/` |
| `hooks/data/` | Feed query hooks |
| `hooks/ui/` | Reels scroll, shortcuts, axis lock |
| `hooks/feedReels/` | Reels-specific hook helpers |
| `store/` | Feed slice |
| `utils/` | Telemetry, media carousel constants, preload schedulers |

For allowed children of any feature folder, see `.cursor/rules/shared/package-feature-structure.mdc` and `Client/packages/features/README.md`.

---

## Per-Package Exhaustive Reference

### 1. `packages/config/`

**Purpose:** Environment, HTTP constants, React Query setup, and a **re-export** of the API barrel (`http/api.ts` → `packages/api`). Domain API **implementations** live in `packages/api/` and `packages/features/*/api/`.

**Contents (summary):**

- **`config/http/api.ts`** — Re-exports `packages/api` (canonical clients live there).
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

**Allowed imports:** `packages/api/*`, `packages/services/http/*`, `packages/services/security/*`, `packages/schemas/*`.

**Forbidden imports:** `packages/hooks/*`, `packages/store/*`, `apps/*`.

**Consumers:** `packages/config/*` (HTTP/security only), and optionally server or tooling; apps use hooks → `packages/api`, not services directly.

---

### 3. `packages/hooks/`

**Purpose:** React hooks for data fetching (React Query), store integration (Zustand), and UI state.

**Contents (summary):**

- **`hooks/data/`** — Data hooks per domain: `auth/`, `calendar/`, `chat/`, `documents/`, `feed/`, `negotiation/`, `search/` (compare, isochrone, map, page, property, results, saved, useMapMarkers), `user/`, plus `useDataPolling.ts`, `useGoogleMaps.ts`, etc.
- **`hooks/store/`** — Store integration: `auth/`, `calendar/`, `documents/`, `featureFlags/`, `filters/`, `map/`, `negotiation/`, `performance/`, `search/`, `session/`, `ui/`.
- **`hooks/ui/`** — UI hooks: `auth/`, `clipboard/`, `core/`, `documents/`, `feed/`, `profile/`, `responsive/`, `scroll/`, `toast/`, plus `useContainerWidth.ts`, etc.

**File types:** All `.ts`. No `.tsx` in hooks (hooks do not render JSX).

**Allowed imports:** `packages/api/*`, `packages/store/*`, `packages/schemas/*`, `packages/services/http/*`, `packages/services/security/*`.

**Forbidden imports:** Business logic `packages/services/*` (use `packages/api`); `apps/*`.

**Consumers:** `apps/web/*` (and when present `apps/mobile/*`); components must use hooks, not `packages/api` or services directly.

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

**Forbidden imports:** `packages/api/*`, `packages/services/*`, `apps/*`.

**Consumers:** `apps/web/*` (and when present `apps/mobile/*`) at app shell / root; feature code uses hooks/contexts from here.

---

### 8. `packages/navigation/`

**Purpose:** Navigation adapter — route paths, types, and a single API (`useNavigation`, `pathFor`, `ROUTES`, `linkProps`, `useInRouterContext`) so features and hooks do not depend on `react-router-dom` directly. Enables a React Native navigation implementation later.

**Contents (summary):**

- **`paths.ts`**, **`types.ts`**, **`routerContext.ts`**, **`useNavigation.ts`**, **`index.ts`**.

**File types:** All `.ts`. No JSX; adapter only.

**Allowed imports:** `packages/schemas/*` (e.g. app/nav for ROUTES); no `react-router-dom` in this package (adapter wraps it at app level).

**Forbidden imports:** `apps/*`; direct `react-router-dom` in exported API (app shell may still use it for setup).

**Consumers:** `packages/features/**`, `packages/hooks/**` (for navigation/location); root route setup in `apps/web/app/` may still use react-router-dom.

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

### 10. `packages/ui/`

**Purpose:** Shared design-system components, layout primitives, adapters (headless, virtuoso, motion), and **`packages/ui/styles/`** (CSS entrypoints and utilities for web).

**Contents (summary):**

- **`components/`** — `button/`, `text/`, `form/`, `modals/`, `cards/`, `primitives/` (Box, Row, etc.), `adapters/`, `layout/`, and platform variants (`.web.tsx` / `.native.tsx`).
- **`styles/`** — Global and component CSS consumed by the web app build.

**File types:** Mostly `.tsx` / `.ts`; CSS under `styles/`.

**Allowed imports:** Per ESLint architecture rules (typically `packages/utils`, `packages/design-tokens`, `packages/hooks` only where needed for UI behavior — follow `ui-components.mdc` and import-boundary rules).

**Consumers:** `apps/web`, `apps/mobile`, and `packages/features/*`.

---

### 11. `packages/logger/`

**Purpose:** Centralized logging with category-based filtering and PII scrubbing (frontend).

**Contents (summary):**

- **`logger.ts`** — Main logger (debug, info, warn, error, security).
- **`pii.ts`** — PII scrubbing (emails, phones, tokens, etc.).
- **`categories.ts`** — Log categories.
- **`logger.config.json`** — Config.
- **`index.ts`** — Public API.

**File types:** All `.ts`. No React.

**Allowed imports:** No dependency on other Client packages (or minimal); PII and categories are self-contained.

**Consumers:** All packages and apps that need frontend logging (`import { log } from "packages/logger"`).

---

## Dependency Graph and Import Rules

### Allowed Dependency Flow (summary)

```
apps/web (pages, layouts)
  → packages/hooks, packages/store, packages/schemas, packages/utils, packages/contexts, packages/navigation, packages/design-tokens, packages/ui, packages/features, packages/logger

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
- Components (apps) must not import `packages/api/*` or business `packages/services/*` directly; they use `packages/hooks/*`.
- Hooks must not import business logic `packages/services/*`; they use `packages/api/*`.
- Services and config must not import `packages/hooks/*` or `packages/store/*`.
- Store must not import config, services, or hooks.

---

## Consumers and Usage

| Consumer | Uses |
|----------|------|
| **apps/web** | hooks, store, schemas, utils, contexts, navigation, design-tokens, **ui**, **features**, logger. Does **not** import `packages/api` or services directly from pages/components. |
| **apps/mobile** (when present) | Same as web: hooks, store, **ui**, **features**, etc.; RN shells compose shared packages; navigation adapter uses native implementation where needed. |
| **packages/hooks** | `packages/api`, store, schemas, services/http, services/security. |
| **packages/services** | `packages/api`, services/http, services/security, schemas. |
| **packages/config** | services/http, services/security, schemas. |

---

## Workspace and Build

- **Monorepo tooling:** Client uses pnpm; filters include `@silverkey/web`, `@silverkey/mobile` (when present). Packages are not all published; many are internal (e.g. `packages/config` has no `package.json` in the list; only `design-tokens` and `eslint-plugin-silverkey` have their own `package.json`). Resolution is typically via workspace or path (e.g. `packages/config`, `packages/hooks`).
- **TypeScript:** Shared packages are included in the app tsconfig (e.g. `tsconfig.app.json`) so that `packages/*` and `logger` are type-checked together with the app.
- **Linting:** ESLint and architecture rules enforce the import boundaries above (see `.cursor/rules/frontend/frontend-architecture.mdc`).

---

## Related Documentation

- [typescript-files.md](typescript-files.md) — Where `.ts` files live and their roles.
- [shared-ui-package.md](../platform/shared-ui-package.md) — Rationale and patterns for **`packages/ui`** (now the canonical design system).
- [react-vs-react-native-packages.md](../platform/react-vs-react-native-packages.md) — React vs React Native–specific code and platform extensions.
- **.cursor/rules/frontend/frontend-architecture.mdc** — Full frontend architecture and layer descriptions.
- **Client/packages/README.md** — High-level package overview and import rules.
