# React vs React Native — Exhaustive Reference

This document is the **exhaustive** reference for what is **React (web)** specific vs **React Native** specific in the SilverKey Client monorepo: packages, app folders, file extensions, APIs, and enforcement. It covers how to keep shared code RN-safe and how to mark and resolve platform-specific code.

---

## Table of Contents

1. [Overview: Web vs Mobile in the Monorepo](#overview-web-vs-mobile-in-the-monorepo)
2. [App Folders: apps/web vs apps/mobile](#app-folders-appsweb-vs-appsmobile)
3. [Platform File Extensions (.web, .native)](#platform-file-extensions-web-native)
4. [Shared Packages: React vs RN-Safe](#shared-packages-react-vs-rn-safe)
5. [Web-Only and Native-Only APIs](#web-only-and-native-only-apis)
6. [Canonical Lists and Conventions](#canonical-lists-and-conventions)
7. [Bundler Resolution (Vite vs Metro)](#bundler-resolution-vite-vs-metro)
8. [Enforcement and Linting](#enforcement-and-linting)
9. [Decision Matrix: When to Use Which](#decision-matrix-when-to-use-which)
10. [Related Documentation](#related-documentation)

---

## Overview: Web vs Mobile in the Monorepo

### Current State

- **apps/web:** Full React (web) app; build with Vite; uses DOM, `react-router-dom`, and web-only libraries where needed.
- **apps/mobile:** React Native app (present as a folder; may be minimal or placeholder). Build with Metro; uses React Native primitives (`View`, `Text`, `Pressable`, etc.).
- **packages/*:** Shared logic (hooks, store, config, services, schemas, utils, contexts, navigation, design-tokens). Today these are **RN-safe**: no DOM, no `react-router-dom`, no web-only APIs in shared packages. The only exception is **packages/styles**, which is CSS and therefore **web-only**.
- **UI today:** All React UI components live in **apps/web** (e.g. `apps/web/components/ui/`). There is **no shared packages/ui** yet; see [shared-ui-package.md](./shared-ui-package.md) for the optional future state.

### Goals

- **Shared “brain”:** Hooks, store, config/api, services, schemas, utils, navigation, and design-tokens are shared so web and mobile use the same data layer and business logic.
- **Explicit platform code:** Code that **cannot** run on both platforms is marked with platform extensions (`.web.*` or `.native.*`) and lives in the correct app or in a shared package with two implementations.
- **Single convention:** We use **`.native.*`** for React Native (not `.mobile.*`). We use **`.web.*`** for web-only or desktop-only code.

---

## App Folders: apps/web vs apps/mobile

### apps/web

| Aspect | Description |
|--------|-------------|
| **Runtime** | Browser (DOM). |
| **Build** | Vite. |
| **Routing** | react-router-dom (in app shell); features use `packages/navigation` adapter only. |
| **UI** | React components using DOM elements, Tailwind, and optionally web-only libraries (Headless UI, react-virtuoso, etc.). |
| **File extensions** | **Default:** `.tsx` / `.ts` (shared or default web). **Web-only or desktop-only:** `.web.tsx` / `.web.ts`. |
| **Allowed imports** | `packages/*` (hooks, store, schemas, utils, contexts, navigation, design-tokens), `logger`; `@/` for app-local paths. Must **not** import `config/api` or `services` directly from components. |

### apps/mobile

| Aspect | Description |
|--------|-------------|
| **Runtime** | React Native (iOS/Android). |
| **Build** | Metro. |
| **Routing** | React Navigation or equivalent (native stack). |
| **UI** | React Native components (`View`, `Text`, `Pressable`, `ScrollView`, etc.). |
| **File extensions** | **All React/UI files:** `.native.tsx` or `.native.ts`. Do **not** use plain `.tsx`/`.ts` for mobile-specific UI; do **not** use `.mobile.*`. |
| **Allowed imports** | Same shared packages as web (hooks, store, schemas, utils, contexts, navigation, design-tokens), `logger`; app-local paths for screens/components. |

**Rule:** Under `apps/mobile/`, any file that contains React components or platform-specific logic must use the **`.native.tsx`** (or `.native.ts`) extension so Metro and shared imports resolve correctly.

---

## Platform File Extensions (.web, .native)

### When to Use Which

| Extension | Where | Meaning |
|-----------|--------|---------|
| **`.tsx` / `.ts`** (no suffix) | `apps/web/` | Shared by both platforms, or default web implementation. Mobile can use the same file or override with a `.native.*` version elsewhere. |
| **`.web.tsx` / `.web.ts`** | `apps/web/` (or future `packages/ui/`) | **Web-only:** uses DOM, react-dom, react-router-dom, window, document, or web-only libraries. **Or** desktop/large-screen-only layout (mobile has its own layout). |
| **`.native.tsx` / `.native.ts`** | `apps/mobile/` or shared location Metro can resolve | **React Native–only:** uses RN primitives or native-only APIs. |

### Rules (Summary)

1. **Default under apps/web:** Use `.tsx` / `.ts`. Use `.web.tsx` / `.web.ts` **only** when the file (a) uses a web-only package/API, or (b) is desktop/large-screen-only and mobile will have a different implementation.
2. **Under apps/mobile:** Use **`.native.tsx`** / **`.native.ts`** for all React/UI and mobile-specific logic. Never use `.mobile.*`.
3. **Shared component with two implementations:** Same logical name, two files: e.g. `Button.web.tsx` and `Button.native.tsx`. Import without extension; bundler picks the right one (Vite → `.web`, Metro → `.native`).

### Check Before Adding .web

- Does the file use only React + shared packages (no DOM, no window, no react-router-dom)? → Use **`.tsx`** / **`.ts`**.
- Could mobile use this same file or the same API with a `.native` variant? → Do **not** use `.web`.
- Canonical list of web-only/desktop-only files: **Client/MOBILE_MIGRATION_DESKTOP_FILES.md**.

---

## Shared Packages: React vs RN-Safe

### Fully RN-Safe (No DOM / No Web-Only APIs)

These packages do not depend on `react-dom`, `window`, `document`, or web-only libraries. They are safe to use from both `apps/web` and `apps/mobile`:

| Package | Notes |
|---------|--------|
| **config** | API clients, env, HTTP config; React Query in `config/query` is runtime-agnostic. |
| **services** | Business logic, HTTP, security; no DOM. |
| **hooks** | React hooks only (no JSX); no DOM. |
| **store** | Zustand; no React DOM. |
| **schemas** | Types only. |
| **utils** | Framework-agnostic; no React, no DOM. |
| **navigation** | Adapter API only; no react-router-dom inside the package. |
| **design-tokens** | Numbers, strings, theme objects; no DOM. |
| **logger** | Logging and PII; no DOM. |

### React but RN-Safe

These use React (e.g. Context, hooks) but do not use DOM or web-only APIs inside the package:

| Package | Notes |
|---------|--------|
| **contexts** | React Context providers and hooks; no DOM. Mobile can wrap the app with the same providers or provide a native shell. |

### Web-Only in Packages

| Package | Notes |
|---------|--------|
| **styles** | CSS / Tailwind. Consumed only by the web build (Vite, PostCSS). React Native does not use this package for UI. |

### Future: packages/ui

If the project adds **packages/ui** (see [shared-ui-package.md](./shared-ui-package.md)), it will contain **`.web.tsx`** and **`.native.tsx`** (or `index.web.tsx` / `index.native.tsx` per component). Then:

- Web build (Vite) resolves `.web.tsx` for components from `packages/ui`.
- Mobile build (Metro) resolves `.native.tsx` for the same components.
- Shared packages remain RN-safe; only the UI package has platform-specific implementations.

---

## Web-Only and Native-Only APIs

### Web-Only (Do Not Use in Shared Code or in .native.* Files)

Use of these in a file means the file must be **web-only** (e.g. in `apps/web` with `.web.tsx`/`.web.ts`, or in a shared package only in a `.web.*` implementation):

- **DOM:** `document`, `window`, `document.body`, `createPortal` (react-dom), `HTMLInputElement`, `HTMLElement`, `htmlFor`, DOM events (e.g. `change` on input with DOM types).
- **Routing (web):** `react-router-dom` (`Link`, `useNavigate`, `useLocation`, `Navigate`, etc.) in **feature/hook** code — app shell may still use it for setup. Features and hooks must use `packages/navigation` only.
- **Libraries:** `@headlessui/react`, `react-virtuoso`, `react-dom` (for portals, etc.), Google Maps (window) for web.
- **Storage (web):** `localStorage`, `sessionStorage` — use an adapter or `packages/utils` storage that can be swapped for RN AsyncStorage in mobile.

**ESLint:** `silverkey/platform-allowed-imports` (or equivalent) forbids importing web-only packages (e.g. `react-dom`, `react-router-dom`) in **`.native.*`** files.

### Native-Only (Do Not Use in Shared Code or in .web.* Files)

Use of these means the file must be **React Native–only** (e.g. in `apps/mobile` with `.native.tsx`/`.native.ts`, or in a shared package only in a `.native.*` implementation):

- **React Native:** `react-native` (View, Text, Pressable, ScrollView, StyleSheet, etc.), `react-native-*` libraries.
- **Native modules:** Any native bridge or platform-specific native API.

**ESLint:** `.web.*` files must not import React Native–only packages.

### Safe in Shared Code (Both Platforms)

- **React:** `react` (useState, useEffect, useCallback, useMemo, useContext, etc.).
- **React Query:** `@tanstack/react-query` (query/mutation hooks).
- **Zustand:** `zustand` (store).
- **Shared packages:** All of `packages/config`, `packages/services`, `packages/hooks`, `packages/store`, `packages/schemas`, `packages/utils`, `packages/contexts`, `packages/navigation`, `packages/design-tokens`, `logger` (when they do not themselves import web/native-only APIs).
- **Types:** TypeScript types and Zod from `packages/schemas`; no runtime DOM/RN.

---

## Canonical Lists and Conventions

### Web-Only / Desktop-Only Files (apps/web)

The **canonical list** with reasons is in **Client/MOBILE_MIGRATION_DESKTOP_FILES.md**. It includes:

- **Web-only package or DOM/window:** e.g. ConfirmationDialog (createPortal), Sidebar (react-router-dom), SearchFiltersSheet (Headless UI), ReelsView (react-virtuoso), Input/Label (htmlFor, HTMLInputElement), Google Maps (window), RippleBackground (window/canvas), BudgetRangeSlider, TagInput, etc.
- **Desktop / large-screen only:** Sidebar nav/tabs, SearchPageDesktopLayout, SidebarList, SearchHeader, SearchFilterBar, SearchFilterChip, SearchFiltersDropdown, Tabs, UnderlineTabs, MapControls, SearchPageMapContainer, etc.
- **Web-only assets or shared web UI:** WhiteLogo, MiniLogo, Card.web, KeyTurnLoader, LocationSection, HomeTypeFilter, OtherFilterDropdown, SearchFiltersPanel, BedBathFilter, PriceRangeFilter, OptionTagInput, etc.

When adding a new file under `apps/web`, check this list and the two criteria (web-only API vs desktop-only layout) to decide between `.tsx` and `.web.tsx`.

### Naming Conventions

- **React Native:** Use **`.native.tsx`** / **`.native.ts`** only. Do **not** use `.mobile.*`.
- **Web-only:** Use **`.web.tsx`** / **`.web.ts`**.
- **Shared or default:** No suffix; **`.tsx`** / **`.ts`**.

---

## Bundler Resolution (Vite vs Metro)

### Vite (Web)

- Resolves **`.web.tsx`** / **`.web.ts`** when present (e.g. via plugin or default resolver order).
- For `import './Button'`, if `Button.web.tsx` and `Button.native.tsx` exist, Vite uses **Button.web.tsx**.
- Build and dev run in `Client/` with config under `apps/web/` (e.g. `apps/web/vite.config.ts`).

### Metro (React Native)

- Resolves **`.native.tsx`** / **`.native.ts`** when present (Metro’s default platform extensions include `.native.js`/`.native.ts`/etc.).
- For `import './Button'`, Metro uses **Button.native.tsx** when building the mobile app.
- Build and dev for mobile use Metro (e.g. `pnpm dev:mobile`, `pnpm ios`, `pnpm android`).

### Shared Package with Two Implementations

For a component in a shared location (e.g. future `packages/ui/Button/`):

- **Button/index.web.tsx** — Web implementation (DOM).
- **Button/index.native.tsx** — Native implementation (RN primitives).
- **Import:** `import { Button } from '@silverkey/ui'` or `import { Button } from 'packages/ui'`. No extension in the import; the bundler chooses the correct file.

---

## Enforcement and Linting

### Scripts

- **`pnpm lint:platform-imports`** (from `Client/`): Runs `tools/check-platform-imports.mjs`.
  - Warns when a file is **only** imported by `.web.*` (or only by `.native.*`) but does **not** have the matching platform extension → such files should be renamed to `.web.*` or `.native.*`.
  - Fails if the same logical component has both `.mobile.*` and `.native.*` → use `.native.*` only.
- **`pnpm lint:parity`** (when both apps exist): Ensures mirrored feature folders stay in sync; skipped if one app is missing.

### ESLint

- **`silverkey/platform-allowed-imports`**:  
  - **`.web.*`** files must not import React Native–only packages.  
  - **`.native.*`** files must not import web-only packages (e.g. `react-dom`, `react-router-dom`).
- **`no-restricted-imports`**: In `apps/web/features/**` and `packages/hooks/**`, `react-router-dom` and `react-router` are restricted; use `packages/navigation` instead.

### CI

- Client lint workflow (e.g. `.github/workflows/client-lint.yml`) runs platform-imports and parity checks so that platform conventions are enforced on every PR.

---

## Decision Matrix: When to Use Which

| Question | Answer |
|----------|--------|
| New file under **apps/web** that only uses React + shared packages? | Use **`.tsx`** / **`.ts`** (no suffix). |
| New file under **apps/web** that uses DOM, window, react-router-dom, or Headless UI? | Use **`.web.tsx`** / **`.web.ts`** and add to MOBILE_MIGRATION_DESKTOP_FILES.md if not already listed. |
| New file under **apps/web** that is desktop/large-screen layout and mobile will have its own? | Use **`.web.tsx`** / **`.web.ts`**. |
| New file under **apps/mobile** (React/UI)? | Use **`.native.tsx`** / **`.native.ts`**. |
| New shared primitive that has different web and native implementations? | Use **`.web.tsx`** and **`.native.tsx`** in the same logical module (e.g. in `packages/ui`); import without extension. |
| New logic or type in **packages/** that does not touch DOM or RN? | Use **`.ts`** (or **`.tsx`** only if it’s a Context provider in `packages/contexts`). |
| New utility that uses `window` or `document`? | Do **not** put it in `packages/utils`; keep it in `apps/web` and use **`.web.ts`**, or provide a platform adapter. |

---

## Related Documentation

- **Client/MOBILE_MIGRATION_DESKTOP_FILES.md** — Canonical list of web-only and desktop-only files with reasons.
- **Client/ARCHITECTURE.md** — Platform file conventions and navigation adapter.
- **.cursor/rules/frontend/platform-file-extensions.mdc** — Cursor rules for platform extensions.
- **Client/tools/LINTING.md** — How to run platform-imports and other lint checks.
- [shared-packages.md](./shared-packages.md) — Exhaustive list of shared packages and import rules.
- [shared-ui-package.md](./shared-ui-package.md) — Optional shared `packages/ui` with `.web`/`.native` components.
- [typescript-files.md](./typescript-files.md) — Where `.ts` files live and their roles.
