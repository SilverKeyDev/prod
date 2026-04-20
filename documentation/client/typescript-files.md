# Monorepo Structure: TypeScript (`.ts`) Files

This document describes where **TypeScript-only (`.ts`)** files live in the SilverKey monorepo and how they are organized by layer and responsibility. It does not cover `.tsx` (React/JSX) files.

## Overview

- **Shared logic and framework-agnostic code** live under `Client/packages/*` as `.ts` files.
- **React hooks** are **TypeScript-only** (`.ts`); no `.tsx` in `packages/hooks/`.
- **`apps/web/`** may contain `.ts` only for **barrel re-exports** (`index.ts`) or rare non-React modules; no standalone `.ts` utilities under `apps/web/components/` or `apps/web/features/` (those belong in `packages/utils/` or `packages/hooks/`).
- **`Client/packages/logger/`** is the frontend logging package and is all `.ts`.

## Root-Level `.ts` Locations

| Location              | Purpose                                      | React? |
|-----------------------|----------------------------------------------|--------|
| `Client/packages/logger/` | Centralized logging, PII scrubbing, categories | No     |
| `Client/packages/*`   | Shared packages (see below)                  | Varies |

## Packages: Where `.ts` Files Live

### 1. `packages/config/`

**Role:** API clients, env, HTTP config, React Query setup.

- **`config/api/*`** – Thin API client modules (auth, user, search, calendar, documents, agent, feed, etc.). All `.ts`.
- **`config/query/*`** – Query client, keys, adapters. All `.ts`.
- **`config/http.ts`**, **`config/env.ts`**, **`config/auth.ts`** – Config and env. No React (except React Query setup in `config/query/`).

**No React components or hooks here.** Imports from `services/http/*`, `services/security/*`, `schemas/*` only.

---

### 2. `packages/services/`

**Role:** Business logic and infrastructure; framework-agnostic.

- **`services/http/*`** – HTTP client, compatibility layer, helpers. All `.ts`.
- **`services/security/*`** – Security utilities. All `.ts`.
- **`services/agent/`**, **`services/auth/`**, **`services/calendar/`**, **`services/chat/`**, **`services/documents/`**, **`services/negotiation/`**, **`services/search/`**, etc. – Domain services. All `.ts`.

**No React.** Services use `config/api/*` and `services/http/*`; they must not import `hooks/*` or `store/*`.

---

### 3. `packages/hooks/`

**Role:** React hooks only. **All files are `.ts`** (no JSX in this package).

- **`hooks/data/*`** – Data-fetching hooks (React Query). Use `config/api/*`.
- **`hooks/store/*`** – Store integration hooks. Use `store/*` and `hooks/data/*`.
- **`hooks/ui/*`** – UI state and behavior hooks (e.g. clipboard, responsive, scroll, toast). No API calls.

Hooks may use React APIs but do not render JSX. **Feature UI** lives in `packages/features/`; **shared primitives** live in `packages/ui/`; **`apps/web`** holds thin pages and app shell only.

---

### 4. `packages/store/`

**Role:** Zustand slices and middleware. **All `.ts`.**

- **`store/slices/*`** – Auth, documents, featureFlags, feed, maps, negotiation, notifications, reports, saved, scheduling, search, ui, user.
- **`store/middleware/*`** – Store middleware.

No React; store is framework-agnostic. Updated via `hooks/store/*` integration hooks.

---

### 5. `packages/schemas/`

**Role:** Shared TypeScript types and Zod-style definitions. **All `.ts`.**

- **`schemas/api/`**, **`schemas/app/`**, **`schemas/calendar/`**, **`schemas/content/`**, **`schemas/search/`**, **`schemas/user/`**, **`schemas/agent/`**, **`schemas/finance/`**, **`schemas/integrations/`**, **`schemas/property/`**, **`schemas/scheduling/`**, etc.

No React; type definitions only. Imported by config, services, hooks, store, and apps.

---

### 6. `packages/utils/`

**Role:** Framework-agnostic utilities. **All `.ts`.**

- **`utils/core/*`** – Array, date, errorHandling, format, platform, routing, storage, typeGuards, verification, dom, ui helpers.
- **`utils/domain/*`** – Domain helpers: auth, calendar, compareHomes, documents, feed, layout, messaging, profile, saved, search.

**No React.** May be used from hooks, services, config, and apps. Standalone `.ts` utilities under `apps/web/features/` or `apps/web/components/` are not allowed; they belong here.

---

### 7. `packages/contexts/`

**Role:** React Context providers and related types/hooks. **Mix of `.ts` and `.tsx`.**

- **`.ts`** – Context types, hook modules (e.g. `useFeedReelsContext.ts`, `useSearchRefresh.ts`), translation string modules, barrel `index.ts`.
- **`.tsx`** – Provider components (allowed here per frontend architecture).

---

### 8. `packages/navigation/`

**Role:** Navigation adapter (paths, types, router context). **All `.ts`.**

- **`navigation/paths.ts`**, **`navigation/types.ts`**, **`navigation/routerContext.ts`**, **`navigation/useNavigation.ts`**, **`navigation/index.ts`**.

---

### 9. `packages/design-tokens/`

**Role:** Design tokens and helpers. **All `.ts`.**

- **`design-tokens/helpers.ts`**, **`design-tokens/tokens/*.ts`** (colors, breakpoints, etc.), **`design-tokens/index.ts`**.

---

## `apps/web/` and `.ts` Files

Per frontend architecture:

- **Allowed:** `.tsx` for components; **barrel `index.ts`** that re-export from the same feature/folder.
- **Not allowed:** Standalone `.ts` utilities or logic under `apps/web/components/` or `apps/web/features/`; those go in `packages/utils/`, `packages/hooks/`, or `packages/schemas/`.

So under `apps/web/`, `.ts` files are mostly **index re-exports** or **type/config** next to a component. Any substantial logic should live in `packages/*`.

---

## Summary Table: `.ts` by Package

| Package       | Purpose                    | React? | Typical consumers        |
|---------------|----------------------------|--------|---------------------------|
| `config/`     | API clients, env, query     | No*    | hooks, services           |
| `services/`   | Business logic, HTTP       | No     | config, (server)          |
| `hooks/`      | Data, store, UI hooks      | Yes    | apps/web                  |
| `store/`      | Zustand state              | No     | hooks/store, apps/web     |
| `schemas/`    | Types                      | No     | All                       |
| `utils/`      | Pure utilities             | No     | hooks, services, apps/web |
| `contexts/`    | Context types/hooks        | Yes    | apps/web                  |
| `navigation/` | Paths, adapter             | No     | apps/web                  |
| `design-tokens/` | Tokens, helpers         | No     | apps/web, styles          |
| `packages/logger/` | Logging, PII          | No     | All                       |

\* React Query lives in `config/query/`; rest of config is non-React.

---

## Import path conventions (canonical)

These conventions help humans and tooling (including IDE assistants) resolve the same module in one way.

1. **`packages/...`** — **Preferred** for every file under `Client/packages/`, whether the importer lives in `packages/` or in an app. Example: `import { userApi } from "packages/config/api/user"`, `import { X } from "packages/features/search/components/SearchScreen"`.
2. **`@/...`** — Use **only** for modules under **`Client/apps/web/`** (TypeScript `paths` map `@/*` → `apps/web/*`). Examples: `@/pages/property/SearchPage`, `@/app/layouts/dashboard/DashboardLayout`.
3. **`@/features/...`** — Alias for `packages/features/...`. Prefer **`packages/features/...`** in new code so imports match other `packages/*` paths.
4. **`@/components/ui` and `@ui`** — Aliases for `packages/ui/components` (see `Client/tsconfig.base.json`). Prefer **`packages/ui/...`** when importing deep paths unless you rely on the barrel.

Layer rules (who may import `config/api`, etc.) are unchanged; this section is **path spelling** only.

For the packages overview, see `Client/packages/README.md`.

---

## Import Rules (Recap)

- **Components (`apps/web/` pages and `packages/features/`, `packages/ui/`)** → Use `hooks/*`, `store/*`, `schemas/*`, `utils/*`, `contexts/*`, `navigation/*`, `packages/ui`, and sibling feature modules. Do not import `config/api/*` or `services/*` directly from UI or pages.
- **Hooks (`packages/hooks/`)** → Use `config/api/*`, `store/*`, `schemas/*`, `services/http/*`, `services/security/*`. Do not import business-logic `services/*`.
- **Services (`packages/services/`)** → Use `config/api/*`, `services/http/*`, `services/security/*`, `schemas/*`. Do not import `hooks/*` or `store/*`.
- **Config (`packages/config/`)** → Use `services/http/*`, `services/security/*`, `schemas/*`.

For full layer rules and examples, see `.cursor/rules/frontend/frontend-architecture.mdc`.
