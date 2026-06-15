# Thin App (Fat Packages) Architecture

> **Routing and workspaces:** See [workspace-first-architecture.md](./workspace-first-architecture.md) for URL/workspace shells. This doc covers app vs package responsibilities.


This document describes SilverKey’s **Thin App** (also called **Fat Packages**) approach: `apps/web` and `apps/mobile` act only as composition layers and delivery mechanisms, while almost all logic and UI live in `packages/`. This is the same pattern used at scale by companies like Meta, Uber, and Microsoft.

## The Big Idea

- **`packages/`** = the factory where parts (hooks, services, UI primitives, feature components) are built.
- **`apps/web` and `apps/mobile`** = assembly lines. They don’t build the parts; they bolt them together and deliver the product.

So the “app” is not the star of the show — the shared packages are. The app folders stay **incredibly thin**.

## What Actually Lives in the Thin App Folders

| Category | Web | Mobile |
|----------|-----|--------|
| **Config & entry** | `vite.config.js`, `index.html`, `main.tsx` | `metro.config.js`, `app.json`, `App.tsx` |
| **Environment** | App-level `.env` (build-time via Vite) | App-level env (build-time or runtime; see Config & Environment) |
| **Routing** | `<BrowserRouter>`, route list (`/login`, `/dashboard`, etc.) | `<Stack.Navigator>`, bottom tabs, screen list |
| **Pages/screens** | Thin composition only (~50–150 LOC; see below) | Thin composition only (~50–150 LOC) |
| **Platform adapter config** | Wire storage, analytics, push, etc. (keys, env, providers) | Same |
| **Platform wrappers** | e.g. global `<main>`, accessibility wrappers | e.g. `<SafeAreaProvider>` |

Nothing else that is reusable or logic-heavy belongs in `apps/` — it belongs in `packages/`.

## Page/Screen as Composition Only

A page or screen file in `apps/` should not contain data-fetching logic, complex conditionals, or new UI primitives. It should only:

1. Import layout and feature components from `packages/` (or app-specific wrappers that themselves use packages).
2. Use hooks from `packages/hooks/` for data and behavior.
3. Compose those pieces into the final view.

### Web example

```tsx
// apps/web/pages/Dashboard.tsx — thin composition
import { DashboardLayout, DashboardWidget } from '@silverkey/ui';
import { useUserData } from '@silverkey/hooks';

export function WebDashboard() {
  const { user } = useUserData();
  return (
    <DashboardLayout>
      <DashboardWidget data={user} />
    </DashboardLayout>
  );
}
```

### Mobile example (same feature, same packages)

```tsx
// apps/mobile/app/screens/DashboardScreen.native.tsx — thin composition
import { DashboardLayout, DashboardWidget } from '@silverkey/ui';
import { useUserData } from '@silverkey/hooks';

export function MobileDashboardScreen() {
  const { user } = useUserData();
  return (
    <DashboardLayout>
      <DashboardWidget data={user} />
    </DashboardLayout>
  );
}
```

Both the web page and the mobile screen:

- Use the **same** shared layout and widget from `packages/`.
- Use the **same** hook from `packages/hooks/`.
- Contain no business logic or data-fetching — only composition.

Platform-specific needs (e.g. SafeArea, different nav) are handled by wrappers or by platform-specific files (e.g. `.web.tsx` / `.native.tsx`) that still delegate behavior to packages.

### Pages/Screens budget

**Pages/Screens budget: ~50–150 LOC.** If a page or screen file grows beyond this, extract composition into `packages/features/*` (or shared layout components in `packages/ui`). This keeps the app layer from slowly becoming a “fat app” again.

## Platform Adapters (Bridges)

This is where teams either win or die: **platform-specific capabilities** (storage, haptics, share, permissions, analytics, push, fileSystem) must not leak into business logic as random `react-native` or DOM imports. The solution is a **single adapter layer** in packages.

- **`packages/platform/*`** (or equivalent) **exports** adapter APIs: e.g. `storage`, `haptics`, `share`, `permissions`, `analytics`, `push`, `fileSystem`.
- **Implementations** are platform-specific via **`.web.ts`** / **`.native.ts`** (or `.web.tsx` / `.native.tsx` where needed). The bundler resolves the right file per app.
- **Apps** only **configure** adapters (API keys, environment, provider setup). **Features** in packages **import** adapters from `packages/platform` and stay framework-agnostic.

So: no “random `react-native` import inside business logic.” Features call `platform.storage.setItem(...)` or `platform.analytics.track(...)`; the app wires which implementation runs. New platforms (e.g. desktop) add new adapter implementations without touching feature code.

## Import Rules

The “enterprise” part of thin apps is **enforcing directionality**. Respect these boundaries:

| Layer | May import from |
|-------|-----------------|
| **`apps/*`** | `packages/*` **public entrypoints only** (see “Public API only” below); platform runtime libs (`react-router-dom`, `react-navigation`, `AppRegistry`, etc.). |
| **`packages/features/*`** | `packages/ui`, `packages/hooks`, `packages/config/query`, `packages/platform`. |
| **`packages/ui`** | Must **not** import from `packages/features` (prevents “UI depends on product” and circular deps). |
| **`packages/domain`** (or core) | Imports **nothing** from React/React Native; pure logic and types only. |

You don’t need to name every package today — the important part is **direction**: apps → packages; features → ui/hooks/data/platform; ui never → features; domain never → framework.

## Public API Only

**Apps may only import from the package root**, e.g. `@silverkey/ui`, `@silverkey/hooks`, **not** deep paths like `@silverkey/ui/src/components/Button` or `packages/ui/Button.tsx`. This makes refactors painless and reduces accidental coupling. Package maintainers expose a single public surface (e.g. `packages/ui/index.ts`); internal file layout can change without breaking apps.

## Config & Environment

- **Web (Vite):** env is **build-time** (injected at build via `process` shim in `vite.config.js` so `process.env` is populated; use `EXPO_PUBLIC_*` in `Client/.env`).
- **Mobile (Expo):** env is **build-time** (Expo injects `EXPO_PUBLIC_*` into `process.env`).

**Packages must not read env directly.** Apps pass configuration in via:

- **Provider props** — e.g. `<ThemeProvider theme={theme}>`
- **Factory calls** — e.g. `createClient({ baseUrl: process.env.API_URL })`, `initAnalytics({ key: process.env.ANALYTICS_KEY })`

That keeps packages portable and testable; the app is the single place that knows “which API URL” or “which analytics key” for this build.

## Why This Is the Gold Standard

1. **Scale to new platforms**
   If you add `apps/desktop` (e.g. Electron or Tauri) later, you only add a new entry point, router, and composition layer. All existing logic and UI in `packages/` are reused.

2. **Single source of truth**
   Features are implemented once in `packages/`. Web and mobile (and future clients) stay in sync by composing the same pieces.

3. **Easier testing and refactors**
   Logic and UI in packages can be tested and refactored without touching app-specific routing or delivery.

4. **Clear boundaries**
   “Where does this go?” has a simple answer: if it’s reusable or logic-heavy, it goes in `packages/`; if it’s “how we mount and route this app,” it stays in `apps/`.

## Relation to Other Docs

- **Cursor rule:** `.cursor/rules/shared/thin-app-architecture.mdc` — enforces what belongs in apps vs packages.
- **Workspace route shells:** [workspace-first-architecture.md](workspace-first-architecture.md) — `/buyer/*`, `/seller/*`, `/brokerage/*` stay thin in `apps/web`; workspace state in `packages/`.
- **What lives in the app folder:** [apps-folder-contents.md](apps-folder-contents.md) — literal breakdown: bootstrapper, provider tree, router, thin pages/screens (orchestrator-only).
- **Implementation:** See thin-app pattern in this doc and in `.cursor/rules/shared/thin-app-architecture.mdc`; migrate by moving logic into packages and keeping apps as composition only.
- **Layers (config, services, hooks, components):** `.cursor/rules/frontend/frontend-architecture.mdc`.
- **Package layout and imports:** `documentation/client/architecture/shared-packages.md` and `Client/packages/README.md`.
- **Web + mobile parity gotchas:** [web-mobile-parity-gotchas.md](../platform/web-mobile-parity-gotchas.md) — stale app/schemas, React version, deep linking.
