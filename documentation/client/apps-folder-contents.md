# What Lives in the App Folder (Orchestrator-Only)

When major React components, hooks, and utilities live in `packages/`, the role of `apps/web` and `apps/mobile` changes: the app folder becomes a **strict Orchestrator (or Controller)**. It does not invent anything; it only connects things.

This document is a literal breakdown of what belongs inside a thin `apps/web` or `apps/mobile` folder in a world-class monorepo. It complements [thin-app-architecture.md](./thin-app-architecture.md) by focusing on the **five responsibilities** that remain in the app.

---

## 1. The Bootstrapper (Mounting the App)

The app folder is responsible for talking to the **runtime environment** (browser or native OS) to get the application running.

### Web (`apps/web`)

- **Entry:** e.g. `main.tsx` (or `src/main.tsx`).
- **Responsibilities:**
  - Get the DOM root (e.g. `document.getElementById('root')`).
  - Call `createRoot()` and render the root component.
  - Optionally register a **Service Worker** for offline / caching.
- **What it does not do:** Define business logic, API clients, or reusable UI. It only mounts the tree that the rest of the app defines.

**Example (conceptual):**

```tsx
// apps/web/main.tsx
import { createRoot } from 'react-dom/client';
import { App } from './App';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
// Optional: service worker registration
```

### Mobile (`apps/mobile`)

- **Entry:** e.g. `App.tsx` (or the file registered as the app root).
- **Responsibilities:**
  - Use **`AppRegistry.registerComponent`** to tell iOS/Android: “This is the root of the application.”
  - Export the root component that will be mounted by the native runtime.
- **What it does not do:** Implement screens, data logic, or shared UI. It only registers the app and typically renders the provider tree + root navigator.

**Example (conceptual):**

```tsx
// apps/mobile/App.tsx
import { AppRegistry } from 'react-native';
import { App } from './src/App';

AppRegistry.registerComponent('SilverKey', () => App);
```

---

## 2. The Provider Tree (Global Context)

Shared code in `packages/` may **consume** a theme, a Query Client, or a router — but it should **not** create or own them. The **app** is the place that **initializes** and **wraps** the tree with the necessary providers.

### What belongs in the app

- A single place (e.g. `App.tsx` or `CoreProviders.tsx`) that composes the **provider tree**:
  - **React Query** — `QueryClientProvider` (the app creates the `QueryClient` and provides it).
  - **Theme** — `ThemeProvider` (or equivalent); the app wires the theme so packages can consume it.
  - **Router context** — Any provider the router needs (e.g. `BrowserRouter` on web; navigation context on mobile).
  - **Platform-specific:** e.g. `<SafeAreaProvider>` on mobile; `<HelmetProvider>` on web if used.
  - **Auth / global state** — If the app is the place that mounts auth or other app-wide context, that wrapper lives here.

### What does not belong in the app

- **Implementations** of theme, API client, or store logic — those live in `packages/`. The app only **instantiates and provides** them.

**Ownership vs configuration:** Apps **own** provider instantiation (e.g. creating the `QueryClient`, mounting `NavigationContainer`, `BrowserRouter`). Packages may export provider **components** only if they are **pure composition** and do **not** create singletons by default.

- ✅ **OK:** `packages/ui/ThemeProvider` that takes a `theme` prop and wraps children.
- ❌ **Not OK:** `packages/data/queryClient.ts` exporting a singleton `new QueryClient()`; the app should create it and pass it into `QueryClientProvider`.

So: **packages define “what” (themes, hooks, components); the app defines “where” and “how many” (wrapping the tree once at the root, owning singletons).**

---

## 3. The Router (The Application Map)

Navigation is **fundamentally different** between web and mobile. The **router** (URLs vs. stacks/tabs) is one of the **largest** pieces of code that lives **exclusively** in the app folder and is **not** shared.

### Web (`apps/web`)

- **Location:** e.g. `app/routes.tsx`, `src/router.tsx`, or equivalent.
- **Responsibility:** Define **URLs** and assign each URL to a **Page** component.
- **Example:**

  ```tsx
  // apps/web/app/routes.tsx (conceptual)
  <Route path="/clients/:id" element={<ClientProfilePage />} />
  <Route path="/dashboard" element={<DashboardPage />} />
  ```

- The **Page** components are thin (see §4). The **route config** — which path renders which page — is app-owned and web-specific.

### Mobile (`apps/mobile`)

- **Location:** e.g. `src/navigation/RootStack.tsx`, `App.tsx` (navigation tree).
- **Responsibility:** Define **screen stacks**, **tab bars**, and **screen names**; assign each screen to a **Screen** component.
- **Example:**

  ```tsx
  // apps/mobile/src/navigation/RootStack.tsx (conceptual)
  <Stack.Screen name="ClientProfile" component={ClientProfileScreen} />
  <Stack.Screen name="Dashboard" component={DashboardScreen} />
  ```

- The **Screen** components are thin (see §4). The **navigation config** — stacks, tabs, screen names — is app-owned and mobile-specific.

**Summary:** The **map** (routes / screens) lives in the app. The **content** of each page/screen (layout + components + hooks) comes from `packages/`.

---

## 4. Pages or Screens (The Glue)

Even when all reusable components (Button, Card, DataGrid, feature widgets) live in `packages/ui` or `packages/features`, you still need a **file per URL or screen** that represents “this is the Client Profile page” or “this is the Dashboard screen.” Those files are **incredibly thin**: they are **glue** between the router and the shared “brain” (hooks) and “face” (UI) from packages.

### What a thin page/screen does

1. **Read platform-specific input** — e.g. `useParams()` on web (URL), or route params on mobile.
2. **Call shared hooks** from `packages/hooks` (the “brain”) — e.g. `useClientData(id)`.
3. **Handle loading and error** — e.g. return `<PageLayout isLoading />` or `<ErrorState message="..." />` from shared UI.
4. **Assemble shared components** from `packages/ui` or `packages/features` (the “face”) — no complex logic, no new primitives.

### What a thin page/screen does not do

- Inline data-fetching (use hooks).
- Complex business logic (belongs in packages).
- Define new UI primitives (use components from packages).
- Own large amounts of local state (prefer hooks and packages).

**Budget:** Pages/screens should stay **~50–150 LOC**. If a file grows beyond that, extract composition into `packages/features/*` (or shared layout in `packages/ui`). This keeps the app from slowly becoming a “fat app” again.

### Example: Uber-style thin page (web)

```tsx
// apps/web/src/pages/ClientProfilePage.tsx (or app-equivalent path)

import { useParams } from 'react-router-dom';
import { useClientData } from '@silverkey/hooks';
import { PageLayout, ClientHeader, ClientHistoryTable, ErrorState } from '@silverkey/ui';

export function ClientProfilePage() {
  const { id } = useParams();                                    // 1. Web-specific URL parameter
  const { data, isLoading, error } = useClientData(id);          // 2. Shared logic from packages

  if (isLoading) return <PageLayout isLoading />;
  if (error) return <ErrorState message="Could not load client." />;

  return (                                                       // 3. Assemble shared UI — no complex logic
    <PageLayout>
      <ClientHeader client={data} />
      <ClientHistoryTable history={data.history} />
    </PageLayout>
  );
}
```

The **same** `useClientData` and the **same** `PageLayout`, `ClientHeader`, `ClientHistoryTable`, and `ErrorState` can be used by a **mobile screen** that only differs in how it gets `id` (e.g. from route params instead of `useParams()`). The app folder only provides the **glue** (which params, which route/screen name).

---

## Why Meta and Uber Do It This Way

When engineers at companies like Meta or Uber build a new feature (e.g. a “Reels” or “Trip” feature), they:

1. Build the **video player**, **like button**, **feed logic**, and **data hooks** inside **shared packages**.
2. In the **web app**, they **plug** that feature into a **URL** in the router and add a **thin page** that composes it.
3. In the **mobile app**, they **plug** the same feature into a **tab or stack screen** and add a **thin screen** that composes it.

What they get:

| Scenario | Where to look |
|----------|----------------|
| Bug in **Reels data logic** or **shared component** | Fix **once** in `packages/`. Web and mobile both get the fix. |
| Bug **only when scrolling with a mouse wheel** | **Web orchestrator** or web-specific wrapper — the issue is in the app or a web-only layer, not in shared packages. |
| Bug **only on iOS keyboard** | **Mobile orchestrator** or native-specific wrapper — the issue is in the app or a native-only layer. |

So: the **app folder is the place for platform-specific “wiring” and delivery**. Everything that is **reusable or logic-heavy** lives in **packages/** and is shared across platforms.

---

## 5. Platform Adapters (Bridges)

Platform-specific capabilities (storage, haptics, share, permissions, analytics, push, fileSystem) must not leak into business logic as random `react-native` or DOM imports. The **app** does not implement these; it **configures** them.

- **`packages/platform/*`** (or equivalent) **exports** adapter APIs: `storage`, `haptics`, `share`, `permissions`, `analytics`, `push`, `fileSystem`. Implementations live in **`.web.ts`** / **`.native.ts`** (or `.web.tsx` / `.native.tsx` where needed); the bundler resolves the right file per app.
- **Apps** only **configure** adapters: API keys, environment, and any provider wrappers (e.g. analytics SDK init). **Features** in packages **import** adapters from `packages/platform` and stay framework-agnostic.

This prevents “random react-native import inside business logic” later. See [thin-app-architecture.md § Platform Adapters](./thin-app-architecture.md#platform-adapters-bridges) for the full pattern.

---

## Config & Environment (Build-Time vs Runtime)

- **Web (Vite):** env is **build-time** (injected at build; e.g. `import.meta.env`).
- **Mobile:** env can be **build-time** (e.g. Babel plugin, Expo config) or **runtime** (native config, env loaded at startup).

**Packages must not read env directly.** The app passes configuration in via:

- **Provider props** — e.g. `<ThemeProvider theme={theme}>`
- **Factory calls** — e.g. `createClient({ baseUrl })`, `initAnalytics({ key })`

That keeps packages portable; the app is the single place that knows which API URL or analytics key for this build.

---

## Summary: What Lives in the App Folder

| Responsibility | Web | Mobile |
|----------------|-----|--------|
| **1. Bootstrapper** | `main.tsx`: `createRoot`, mount root, optional Service Worker | `App.tsx`: `AppRegistry.registerComponent`, root component |
| **2. Provider tree** | Single file that wraps app in `QueryClientProvider`, `ThemeProvider`, `BrowserRouter`, etc. **App owns instantiation** (e.g. creates `QueryClient`). | Same: app creates singletons and provides them. |
| **3. Router** | Route definitions: URLs → Page components | Navigation: stacks, tabs, screen names → Screen components |
| **4. Pages / Screens** | One thin file per route (~50–150 LOC): params + shared hooks + shared UI composition | One thin file per screen (~50–150 LOC): same pattern |
| **5. Platform adapters** | Configure storage, analytics, push, etc. (keys, env, providers); implementations live in `packages/platform` | Same |
| **Config & env** | Build-time env (Vite); app passes config into packages via props/factories | Build-time or runtime; app passes config into packages via props/factories |

**Everything else** — hooks, API clients, store, UI primitives, feature components, business logic — lives in **`packages/`**. The app folder **does not invent**; it **connects**.

---

## Related Docs

- [thin-app-architecture.md](./thin-app-architecture.md) — Target state and “what lives in apps vs packages” (overview).
- [thin-app-implementation-strategy.md](./thin-app-implementation-strategy.md) — How to get there (strategies and steps).
- [web-mobile-parity-gotchas.md](./web-mobile-parity-gotchas.md) — Stale app/schemas, React version, deep linking.
- **Client/ARCHITECTURE.md** — Layer rules and import boundaries.
