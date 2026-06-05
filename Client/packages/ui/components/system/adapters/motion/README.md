# Motion adapters (Framer Motion web / Reanimated native)

Thin façade so feature code can import one path (`packages/ui/components/system/adapters/motion`). Metro / Vite resolve `.web` vs `.native` implementations.

## Web vs native behavior

| Export            | Web (`*.web.tsx`)                                           | Native (`*.native.tsx`)                                                                  |
| ----------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `MotionView`      | `framer-motion` `motion.div` (full API)                     | `Animated.View`: `initial` / `animate` / `transition` — **opacity timing only**          |
| `MotionButton`    | `motion.button` (full API)                                  | `Animated` `Pressable`: `animate`, `whileTap`, `transition` — **opacity + scale timing** |
| `MotionSpan`      | `motion.span` (full API)                                    | `Animated.View`: **no** `initial` / `animate`; layout-only stand-in for inline motion    |
| `AnimatePresence` | Full `AnimatePresence` (exit modes, `popLayout`, `wait`, …) | **No-op:** renders `children` in a `Fragment`; **no** mount/exit choreography            |

On native, `AnimatePresence` accepts `mode` and `initial` for API compatibility but **ignores** them.

## Call sites (parity expectations)

- **Simple opacity fades (`MotionView`)** — Used in search / map UI (`Client/packages/features/search/components/src/SearchFeature.tsx`, `Client/packages/features/search/components/layout/SearchPageMapView.tsx`). Native `MotionView` matches this subset.
- **Heavy Framer usage** — `Client/packages/features/profile/components/onboard/Header.tsx` uses `AnimatePresence` (`mode="wait"`, `popLayout`), springs, and layout props. That header is **web-scoped** (`Card.web`, DOM measurement). Do not assume the same motion behavior on React Native without a native-specific redesign.

## Type surface

- **Web:** `MotionView` / `MotionButton` / `MotionSpan` are re-exports of `motion.*` components — TypeScript sees Framer’s full prop types.
- **Native:** Narrow props are defined in `*.native.tsx` and shared **typing-only** helpers in [`motionTypes.ts`](./motionTypes.ts). Prefer extending `motionTypes` over duplicating object shapes.

## Adding motion

1. Prefer **opacity-only** transitions on shared surfaces if RN must match.
2. If you need exit animations or layout transitions, treat them as **web-only** or plan a Reanimated-specific implementation for native.
3. Do not import `framer-motion` from shared `.ts` files that ship to the native bundle — keep Framer in `.web.tsx` only.
