/**
 * Shared shadow tokens (platform-agnostic).
 * Values are numeric; platform adapters (`packages/ui/styles/shadows/shadows.native.ts`,
 * `packages/ui/styles/shadows/shadows.web.ts`) map to
 * RN StyleSheet shadow props or CSS box-shadow.
 * No React, no platform imports - pure data.
 */

export type ShadowToken = {
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  opacity: number;
};

/** Subtle shadow (e.g. content panels, muted cards). */
export const shadowSubtle: ShadowToken = {
  offsetX: 0,
  offsetY: 1,
  blur: 2,
  spread: 0,
  opacity: 0.05,
};

/** Elevated shadow (e.g. toasts, error cards, maintenance card). */
export const shadowElevated: ShadowToken = {
  offsetX: 0,
  offsetY: 2,
  blur: 8,
  spread: 0,
  opacity: 0.15,
};

/** Card/float shadow (e.g. floating buttons, saved home card bubble). */
export const shadowCard: ShadowToken = {
  offsetX: 0,
  offsetY: 1,
  blur: 3,
  spread: 0,
  opacity: 0.08,
};

export const shadowTokens = {
  subtle: shadowSubtle,
  elevated: shadowElevated,
  card: shadowCard,
} as const;

export type ShadowTokenName = keyof typeof shadowTokens;
