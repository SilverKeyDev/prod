/**
 * Single source of truth for React Native shadow offset values.
 * Use these in StyleSheet shadow styles so elevation appearance stays consistent.
 */

/** Standard elevated shadow (e.g. toasts, error cards, maintenance card). */
export const SHADOW_OFFSET_ELEVATED = { width: 0, height: 2 } as const;

/** Subtle shadow (e.g. content panels). */
export const SHADOW_OFFSET_SUBTLE = { width: 0, height: 1 } as const;
