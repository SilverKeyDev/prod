# Mobile App (React Native) Structure and File Reference

This document describes the structure and purpose of each file in the React Native mobile app (`Client/apps/mobile/`), implemented per the [Mobile RN Migration Plan](.cursor/plans/mobile_rn_migration_implementation_2360b476.plan.md). The app uses Expo, React Navigation, and shared packages from the monorepo.

---

## 1. Root and entry

| File | Purpose |
|------|--------|
| **`App.tsx`** | Expo entry component. Imports `react-native-gesture-handler` at the very top (required by React Navigation), loads `global.css` (NativeWind), and renders `AppRoot`. No `react-dom`, no `BrowserRouter`. |
| **`app.json`** | Expo config: app name (SilverKey), slug, scheme (`silverkey` for deep links), iOS/Android bundle IDs, splash, orientation. |
| **`package.json`** | Mobile app dependencies (Expo, React Navigation, AsyncStorage, React Query, Zustand, safe-area-context, gesture-handler, screens, splash-screen, NativeWind, etc.) and scripts (`start`, `ios`, `android`). |
| **`tsconfig.json`** | Extends Expo base; path alias `packages/*` → `../../packages/*`; includes app and shared packages for typechecking. |
| **`global.css`** | NativeWind/Tailwind entry; consumed by Metro via `withNativeWind`. |
| **`nativewind-env.d.ts`** | TypeScript declarations for NativeWind (e.g. `className` on RN components). |
| **`tailwind.config.js`** | Tailwind config for NativeWind; uses shared preset from `packages/config/tailwind`. |
| **`babel.config.js`** | Babel config: Expo preset, NativeWind, and `babel-plugin-module-resolver` for aliases (`@` → packages, `packages/utils/core` → `packages/utils`). |
| **`metro.config.js`** | Metro bundler config: watchFolders (project + packages), nodeModulesPaths, extraNodeModules (`packages`), custom `resolveRequest` to map `packages/utils/core/*` to `packages/utils/*`, and `withNativeWind` for CSS. |

---

## 2. Bootstrap

| File | Purpose |
|------|--------|
| **`bootstrap/platformBootstrap.native.ts`** | **Mobile platform bootstrap.** Runs once before the app tree mounts (invoked from `AppRoot`). Async: loads AsyncStorage into in-memory caches with prefixes (`@sk_persist/`, `@sk_local/`, `@sk_session/`) so shared code gets synchronous `getItem`/`setItem`. Then calls `setPlatformStorage()` (from `packages/utils/storage/platformStorage`) and `setPlatformGlobals()` (from `packages/utils/platform`) with RN-safe values: no `document`/`window`; `fetch` from `globalThis`. Ensures zero document/window use in shared packages when running on RN. |

---

## 3. App root and content flow

| File | Purpose |
|------|--------|
| **`app/AppRoot.native.tsx`** | **Root UI container.** Calls `SplashScreen.preventAutoHideAsync()` at load. Runs `runPlatformBootstrap()` then sets `bootstrapped`; shows loading spinner until then. Renders `SafeAreaProvider` → `CoreProvidersNative(onGoHome)` → `AppContent`, `ToastsPortalNative`, `StatusBar`. `onGoHome` uses `rootNavigationRef.reset()` to the first route (for error boundary “Go home”). |
| **`app/AppContent.native.tsx`** | **Post-auth content gate.** Uses `useHealthCheck()` and `useSessionTimeout({ onLogout })` (onLogout clears auth store so UI shows Auth stack). Waits for `healthCheckComplete` then hides splash and either shows `MaintenanceScreenNative` (if `maintenance`) or `RootNavigator`. Loading state uses `ActivityIndicator`. |

---

## 4. Providers

| File | Purpose |
|------|--------|
| **`app/providers/CoreProvidersNative.native.tsx`** | **Core provider tree (native).** Order: `ErrorProviderNative(onGoHome)` → `ThemeProviderNative` → `AuthProviderNative` → `QueryProvider` → `LocalizationProvider` → children. Mirrors web `CoreProviders` with RN-safe implementations. |
| **`app/providers/ErrorProviderNative.native.tsx`** | Wraps children in `ErrorBoundaryNative`; passes `onError` (logging + `reportErrorWithCapture`) and optional `onGoHome` for the fallback “Go home” action. |
| **`app/providers/QueryProvider.native.tsx`** | Wraps children in React Query’s `QueryClientProvider` using shared `queryClient` from `packages/config/query/queryClient`. |
| **`app/providers/theme/ThemeProviderNative.native.tsx`** | **RN theme provider.** Provides `ThemeContext` (from `packages/contexts/ThemeContext`). Uses `Appearance.getColorScheme()` and `Appearance.addChangeListener` for system theme; no DOM. Exposes `config`, `applyTheme`, `getCSSVariable`/`setCSSVariable` (no-op for set on RN), `prefersDarkMode`, `systemTheme`. Design tokens from `packages/design-tokens` via context. |
| **`app/providers/auth/AuthProviderNative.native.tsx`** | **Auth provider (native).** Resolves initial path via `Linking.getInitialURL()` and passes it to shared `runAuthBootstrap()` from `packages/features/homeauth/hooks/data/authBootstrap`. Uses `getSessionStorage()` (set by mobile bootstrap). No `useLocation` or `BroadcastChannel`. Renders `null` until `authReady` and `authStatus !== 'checking'`, then renders children. |
| **`app/providers/AppStackIntegrations.native.tsx`** | **App-stack-only integrations.** Mounted only when the user is authenticated (wraps the tab navigator). Calls `useReportsStoreIntegration()` and `useSavedHomesStoreIntegration()` so reports and saved-homes data sync from React Query to Zustand. Does not call `useDataPolling` or `useDataInitialization` (they depend on React Router); RN equivalents can be added later. |

---

## 5. Error handling

| File | Purpose |
|------|--------|
| **`app/error/ErrorBoundaryNative.native.tsx`** | **Class-based error boundary** with RN fallback UI. Catches errors, logs and reports them, then renders a screen with “Something went wrong”, message, “Try Again” (clears error state) and “Go Home” (calls `onGoHome` prop, e.g. `navigation.reset()`). Uses `View`, `Text`, `TouchableOpacity` and `normalizeError` from `packages/utils/errorHandling`. |

---

## 6. Navigation

| File | Purpose |
|------|--------|
| **`app/navigation/RootNavigator.native.tsx`** | **Root navigator.** Creates `rootNavigationRef` (for “Go home” and deep link). Renders `NavigationContainer(ref={rootNavigationRef})` and `RootContent`. `RootContent` runs `useDeepLink()` and, based on `useAuthStore` `authStatus`, renders either `AppStackIntegrations` → `AppStack` (tabs) or `AuthStack`. |
| **`app/navigation/AuthStack.native.tsx`** | **Auth (public) stack.** Native stack with screens: Home, Login, Signup, ForgotPassword, Onboarding, Verification, Privacy, Terms, Contact. Uses `PlaceholderScreen` or `KeyboardAvoidingPlaceholder` for form-like screens. Exports `AuthStackParamList` and `AuthStackScreenProps` for typing. |
| **`app/navigation/AppStack.native.tsx`** | **App (protected) tab navigator.** Five tabs: Dashboard, Search, Saved, Messaging, Profile. Each tab uses `PlaceholderScreen` with a title. Messaging tab uses `useNotificationStore().unreadCount` for `tabBarBadge`. Tab bar styling uses design tokens (e.g. active tint `#A3B18A`). |
| **`app/navigation/useDeepLink.native.ts`** | **Deep link handling.** On mount: calls `Linking.getInitialURL()` and `Linking.addEventListener('url', ...)`. Maps pathnames to screen names via `AUTH_SCREENS` and `APP_TABS`; when authenticated, navigates to tab name; when not, to auth screen name. Uses `rootNavigationRef` and `useAuthStore.getState()` for current auth. |

---

## 7. Screens

| File | Purpose |
|------|--------|
| **`app/screens/PlaceholderScreen.native.tsx`** | Generic placeholder screen: shows a title from `route.params.title` or prop. Used for all tabs and most auth screens until real screens are implemented. |
| **`app/screens/KeyboardAvoidingPlaceholder.native.tsx`** | Wraps `PlaceholderScreen` in `KeyboardAvoidingView` (iOS: padding, Android: height). Used for Login, Signup, ForgotPassword, Onboarding, Verification so the keyboard does not cover content. |
| **`app/screens/MaintenanceScreen.native.tsx`** | **Maintenance screen.** Shown when `useHealthCheck()` sets `maintenance === true`. Simple RN layout: “We'll be back soon!” and short message. |

---

## 8. UI components (app-level)

| File | Purpose |
|------|--------|
| **`app/components/ToastsPortalNative.native.tsx`** | **RN toast layer.** Reads `useUIStore()` for `activeToastId`, `toastQueue`, `dequeueToast`. Renders one toast at a time (success or error styling) at the bottom; auto-dismisses after 3s (5s for error). Uses same store contract as web `ToastsPortal` so features can `enqueueToast` from anywhere. |

---

## 9. Data flow summary

```text
App.tsx
  → AppRoot (bootstrap → SafeAreaProvider → CoreProvidersNative → AppContent + ToastsPortal)
       → CoreProvidersNative: Error → Theme → Auth → Query → Localization
       → AppContent: health check, session timeout, then MaintenanceScreen | RootNavigator
       → RootNavigator: NavigationContainer → (AuthStack | AppStackIntegrations → AppStack)
            → AuthStack: stack of public screens (placeholders / keyboard-aware placeholders)
            → AppStack: bottom tabs (Dashboard, Search, Saved, Messaging+badge, Profile)
```

---

## 10. File naming convention

Per project rules ([platform-file-extensions.mdc](.cursor/rules/frontend/platform-file-extensions.mdc)):

- All new UI and mobile-specific logic under `apps/mobile/` uses **`.native.tsx`** or **`.native.ts`**.
- No `.web` files in the mobile app; shared code lives in `packages/` with no extension or with platform variants where needed.

---

## 11. Key dependencies (from mobile `package.json`)

- **Expo** – runtime and tooling.
- **React Navigation** – `@react-navigation/native`, `native-stack`, `bottom-tabs`; navigation state and deep links.
- **react-native-gesture-handler** – required at top of entry for React Navigation.
- **react-native-screens** – native stack performance.
- **react-native-safe-area-context** – safe area insets; `SafeAreaProvider` at root.
- **@react-native-async-storage/async-storage** – persistence for platform storage abstraction.
- **@tanstack/react-query**, **zustand** – server cache and client state; shared with web.
- **expo-splash-screen** – keep splash until bootstrap/auth/health and initial URL are ready.
- **NativeWind** – Tailwind-style styling for RN.

---

## 12. Redirects and 404 (from plan)

- **`/settings/*`** → Profile tab/screen (handled in deep link mapping in `useDeepLink.native.ts`: `/settings` → Profile).
- **`/app`, `/buyer-checklists`** → Resolve to the correct tab/screen (extend `APP_TABS` or handle in `navigateToPath` as needed).
- **404 / unknown path** → Error boundary “Go home” resets to first route of current root (Auth Home or first tab) via `onGoHome` in `AppRoot`.

---

## 13. Related documentation

- [Thin app architecture](thin-app-architecture.md) – apps as composition; logic in packages.
- [Shared packages](shared-packages.md) – what lives in `packages/` and how the mobile app imports it.
- [Web mobile parity gotchas](web-mobile-parity-gotchas.md) – differences and shared patterns between web and mobile.

---

## 14. Running the app and API base URL

For native (iOS/Android), the API base URL must be set so the app can reach the backend. Use `EXPO_PUBLIC_API_URL` or `VITE_API_URL` in `.env` (Metro copies `VITE_*` to `EXPO_PUBLIC_*` when unset; see `apps/mobile/metro.config.cjs`). If none is set, the app defaults to `http://localhost:5000` in development on the simulator. For a **physical device**, set the URL to your machine’s LAN IP (e.g. `http://192.168.1.x:5000`) and ensure the backend is reachable from the device.
