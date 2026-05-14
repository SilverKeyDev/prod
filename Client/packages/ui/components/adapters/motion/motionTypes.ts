/**
 * Shared motion contract types for native Reanimated façades (`*.native.tsx`).
 * Type-only module — safe to import from platform files; do not import Framer here.
 */

/** Seconds — Framer-style `transition.duration` on web; Reanimated `withTiming` duration on native. */
export type MotionTransition = {
  duration?: number;
};

/** `MotionView` animate / initial object shape (opacity timing only). */
export type MotionOpacityAnimate = {
  opacity?: number;
};

/** `MotionView` `initial` prop: opacity object, or `false` to skip enter-from-initial. */
export type MotionViewInitial = MotionOpacityAnimate | boolean;

/** `MotionButton` / `whileTap` animate object (opacity + optional scale). */
export type MotionButtonAnimate = {
  opacity?: number;
  scale?: number;
};
