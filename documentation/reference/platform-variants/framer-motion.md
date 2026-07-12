# framer-motion (Web → React Native)

## Web

- **Package:** `framer-motion` (in `Client/apps/web/package.json`).
- **Role:** Declarative animations and layout animations: `motion.*` components, `AnimatePresence`, `useAnimate`, etc.
- **Where used:** Various components under `apps/web/` and `packages/` that use `motion.div`, `motion.span`, or motion hooks for transitions and animations.

## React Native

- **Replacement:** **react-native-reanimated** (and optionally **react-native-gesture-handler** for gesture-driven animations). Reanimated is the standard for performant RN animations and is compatible with Expo.
- **Implementation:**
  - **Where:** Any shared component that uses `framer-motion` on web must have a **`.native.tsx`** that uses Reanimated’s `Animated` API (e.g. `useAnimatedStyle`, `withTiming`, `withSpring`) and Reanimated-backed components. Web-only animated components stay in `.web.tsx`.
  - **API mapping:** `motion.div` → `Animated.View` (from `react-native-reanimated`); `AnimatePresence` → implement with Reanimated’s layout/entrance/exit or conditional render + animation. No 1:1 component map — redesign animations for RN using Reanimated primitives.
  - **Package:** Add `react-native-reanimated` (and if needed `react-native-gesture-handler`) to `Client/apps/mobile/package.json`. Follow Expo/Reanimated setup (babel plugin, etc.).

## Package (RN)

- **Add to `apps/mobile/package.json`:** `react-native-reanimated`, and optionally `react-native-gesture-handler`. Do not add `framer-motion` to mobile.

## Summary

| Aspect | Web | React Native |
|--------|-----|--------------|
| Package | framer-motion | react-native-reanimated (optional: gesture-handler) |
| Where | .web.tsx or shared .tsx with .native variant | .native.tsx using Animated.* / useAnimatedStyle |
