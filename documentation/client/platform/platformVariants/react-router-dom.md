# react-router-dom (Web → React Native)

## Web

- **Package:** `react-router-dom` (in `Client/package.json` and `Client/apps/web/package.json`).
- **Role:** Routing (URL-driven): `BrowserRouter`, `Routes`, `Route`, `Link`, `useNavigate`, `useLocation`, `Navigate`, etc.
- **Where used:** App shell in `apps/web/` (e.g. `App.tsx`, `routes.tsx`, `DynamicRoutes.tsx`, layout and guards). Features and hooks use `packages/navigation` adapter only; they must not import `react-router-dom` directly (enforced by ESLint in features/hooks).

## React Native

- **Replacement package:** **React Navigation** — e.g. `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`. Add to `Client/apps/mobile/package.json` when implementing routing.
- **Implementation:**
  - **Where:** Routing lives entirely in `apps/mobile/` (e.g. root navigator, stack screens, tab navigator). No `react-router-dom` in mobile.
  - **Adapter:** `packages/navigation` exposes an adapter API (e.g. `useNavigation`, link/navigate helpers). The web implementation of the adapter uses `react-router-dom`; the mobile implementation must use React Navigation’s `useNavigation` / `navigation.navigate()` and a link component that uses React Navigation’s linking.
  - **Deep linking:** Configure React Navigation linking (and iOS Universal Links / Android App Links) so URL paths match web. Document path → screen mapping so web and mobile stay in parity (see [web-mobile-parity-gotchas.md](../web-mobile-parity-gotchas.md)).

## Package (RN)

- **Add to `apps/mobile/package.json`:** `@react-navigation/native`, `@react-navigation/native-stack`, and optionally `@react-navigation/bottom-tabs`, plus peer deps (e.g. `react-native-screens`, `react-native-safe-area-context`). Do not add `react-router-dom`.

## Summary

| Aspect | Web | React Native |
|--------|-----|--------------|
| Package | react-router-dom | @react-navigation/native (+ stacks/tabs) |
| Where | apps/web app shell | apps/mobile app shell |
| Adapter | packages/navigation (web impl) | packages/navigation (native impl) |
