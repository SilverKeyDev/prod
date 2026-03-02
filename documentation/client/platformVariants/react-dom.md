# react-dom (Web → React Native)

## Web

- **Package:** `react-dom` (in `Client/package.json` and `Client/apps/web/package.json`).
- **Role:** React renderer for the DOM; used for `createRoot`, `createPortal`, and DOM-specific APIs.
- **Where used:** App entry (`apps/web/main.tsx`), any component that uses `createPortal` (e.g. modals, tooltips), and DOM refs (`HTMLInputElement`, etc.).

## React Native

- **No direct replacement.** React Native uses its own renderer; there is no `react-dom` on mobile.
- **Implementation:**
  - **App entry:** `apps/mobile` uses Expo/React Native entry (e.g. `expo/AppEntry.js`), which uses the RN renderer — no `react-dom` import.
  - **Portals:** Use React Native’s built-in mechanisms (e.g. `Modal`, or stacking screens in React Navigation) instead of `createPortal`. Any shared component that uses `createPortal` on web must have a `.native.tsx` that uses RN `Modal` or navigation.
  - **DOM refs:** Replace with RN refs (`View`, `TextInput`, etc.). Any shared component using `htmlFor` / `HTMLInputElement` must live in `.web.tsx` only, or have a `.native.tsx` that uses RN primitives and refs.

## Package (RN)

- Do **not** add `react-dom` to `apps/mobile/package.json`. It is web-only.

## Summary

| Aspect | Web | React Native |
|--------|-----|--------------|
| Renderer | react-dom | Built-in RN renderer |
| Portals | createPortal | Modal / navigation stack |
| Refs | DOM nodes | View / TextInput refs |
