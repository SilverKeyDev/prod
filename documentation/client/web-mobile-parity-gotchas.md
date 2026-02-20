# Web + Mobile Parity: Three Gotchas

In a monorepo where **web** and **mobile** share `packages/`, a few failure modes cause most production issues. This document spells them out and how to avoid them.

**Related:** [thin-app-architecture.md](./thin-app-architecture.md), [apps-folder-contents.md](./apps-folder-contents.md), [react-vs-react-native-packages.md](./react-vs-react-native-packages.md).

---

## 1. The "Stale App" Problem (API & Schema Versioning)

**The number one cause of crashes in shared monorepos.**

- **Web** deploys instantly; every user gets the latest code.
- **Mobile** is constrained by App Store/Play Store review (days) and user behavior (many users won’t update for months).

**The danger:** If you change a shared Zod schema or an API response type in `packages/schemas/` (e.g. rename `clientId` to `clientUuid`), web and the backend can move in lockstep. Old mobile apps on users’ devices still expect the old shape; they receive a payload they don’t understand, validation fails, and the app crashes or misbehaves.

**The fix:**

- **`packages/schemas`** and **`packages/config/api`** (and any shared API contracts) must be **strictly additive** where possible. You can **add** new optional fields; you **cannot** rename or delete fields without a backward-compatibility strategy.
- If you must rename or remove a field, the **backend** must support **both** the old and new contract for a long support window (e.g. 6+ months), and shared client code must tolerate both until the minimum supported app version no longer needs the old field. Document the deprecation and support window.
- Version APIs explicitly (e.g. `/api/v1/`, `/api/v2/`) when making breaking changes; old clients keep calling v1 until they’re phased out.

---

## 2. The React Version Dictator (Dependency Pinning)

In a monorepo you want to hoist dependencies to the root `package.json` so web and mobile share the same library versions.

**The danger:** React Native (and Expo) are strict about which React version they support. Your Vite web app might be ready for React 19, but Expo/React Native may be locked to React 18.2.0. If web and mobile resolve different React versions, you get duplicate React instances, hooks bugs, and native build failures.

**The fix:**

- **React Native is the dictator.** Whatever version of `react` (and `react-dom` where applicable) **`apps/mobile`** requires is the version the **entire monorepo** must use. Pin `react` and `react-dom` at the **root** (or in a shared workspace config) to that version.
- In **`packages/*`**, list React as a **peerDependency** only, not a direct dependency. That way packages use the single React instance provided by the app; you avoid installing conflicting versions.
- When upgrading React: upgrade **mobile** first (Expo/RN compatibility), then align web and all packages to that version.

---

## 3. Deep Linking & The "Initial State" Gap

On the web, if a user clicks `silverkey.com/client/123`, the browser loads the URL, the app boots, reads the URL, and shows the right page.

**The danger:** Native apps don’t have a URL bar. If the user taps that same link on their phone, the **OS** must intercept it (Universal Links on iOS, App Links on Android), wake your React Native app, and pass the URL to your app. If your **mobile router** isn’t configured to map that URL path to a screen and pass params, the user lands on the wrong place or the app ignores the link.

**The fix:**

- Even though router logic lives in **`apps/`** (web vs mobile), keep **URL path ↔ screen** parity. The mobile router (e.g. React Navigation) must be configured to map **URL paths** (e.g. `/client/:id`) to the correct **screen stack** and pass route params. Document the mapping (e.g. a shared route schema or a small table: web path → mobile screen name).
- Configure **Universal Links** (iOS) and **App Links** (Android) so the OS hands the URL string to your app; the app’s entry/navigation layer parses it and navigates to the right screen with the right initial state. Without this, “open this link in the app” will not work reliably.

---

## Summary

| Gotcha | Rule |
|--------|------|
| **Stale app / API & schema** | Schemas and API contracts are additive; no rename/delete without backend backward compatibility for months. |
| **React version** | RN dictates React; pin at root; packages use React as peerDependency only. |
| **Deep linking** | Mobile router maps URL paths to screens; document parity; configure Universal Links / App Links. |
