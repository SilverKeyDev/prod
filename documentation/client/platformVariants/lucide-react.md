# lucide-react (Web → React Native)

## Web

- **Package:** `lucide-react` (in `Client/package.json` and `Client/apps/web/package.json`).
- **Role:** Icon set as React components rendering SVG; used across the web app for buttons, nav, feedback, etc.
- **Where used:** Widely — e.g. `packages/ui/components/icons/iconMap.tsx`, buttons, modals, headers, and many components under `apps/web/` and `packages/`.

## React Native

- **Options:**
  1. **@expo/vector-icons** — Bundled with Expo; use MaterialIcons, Ionicons, etc. Map each Lucide icon to an Expo icon by name.
  2. **react-native-vector-icons** — Similar to Expo’s set; requires linking or config.
  3. **lucide-react-native** — Community package that provides Lucide icons for RN. If available and maintained, this preserves the same icon set and naming on both platforms.
- **Implementation:**
  - **Where:** Centralize icon usage behind an **icon barrel or map**. Web: `iconMap.tsx` (or similar) re-exports or maps names to `lucide-react` components. Native: same barrel/map in a **`.native.tsx`** (e.g. `iconMap.native.tsx`) that exports components from `@expo/vector-icons` or `lucide-react-native` with the same public API (e.g. same icon names and props like `size`, `color`). Components import from the barrel only, so the bundler picks the right implementation.
  - **Package:** Add `@expo/vector-icons` (if using Expo) or `lucide-react-native` / `react-native-vector-icons` to `Client/apps/mobile/package.json`. Do not use `lucide-react` on mobile (it relies on DOM/SVG in a way that may not work or is not optimal in RN).

## Package (RN)

- **Add to `apps/mobile/package.json`:** Either `@expo/vector-icons` (Expo) or `lucide-react-native` / `react-native-vector-icons`. Not `lucide-react`.

## Summary

| Aspect | Web | React Native |
|--------|-----|--------------|
| Package | lucide-react | @expo/vector-icons or lucide-react-native |
| Where | Central icon map/barrel | Same barrel, .native.tsx implementation |
| API | Component per icon, size/color props | Same semantic API from barrel |
