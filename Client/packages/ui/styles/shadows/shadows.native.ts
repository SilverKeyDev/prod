/**
 * React Native shadow styles from shared design tokens.
 * Imports token values and maps to RN StyleSheet shadow props (shadowOffset, shadowRadius, shadowOpacity, elevation).
 */

import type { ViewStyle } from "react-native";

import {
  shadowElevated,
  shadowSubtle,
  type ShadowToken,
  type ShadowTokenName,
  shadowTokens,
} from "packages/design-tokens";

function tokenToRnOffset(t: ShadowToken): { width: number; height: number } {
  return { width: t.offsetX, height: t.offsetY };
}

/** Android elevation derived from blur (platform adapter). */
function blurToElevation(blur: number): number {
  return Math.max(1, Math.round(blur / 2));
}

/** Standard elevated shadow (e.g. toasts, error cards, maintenance card). */
export const SHADOW_OFFSET_ELEVATED = tokenToRnOffset(shadowElevated);

/** Subtle shadow (e.g. content panels). */
export const SHADOW_OFFSET_SUBTLE = tokenToRnOffset(shadowSubtle);

/**
 * Full RN shadow style for a token (shadowOffset, shadowOpacity, shadowRadius, elevation).
 * Pass shadowColor from your theme (e.g. color("neutral.900")) when building StyleSheet.
 */
export function shadowStyleForToken(
  name: ShadowTokenName,
  shadowColor: string
): Pick<
  ViewStyle,
  "shadowColor" | "shadowOffset" | "shadowOpacity" | "shadowRadius" | "elevation"
> {
  const t = shadowTokens[name];
  return {
    shadowOffset: tokenToRnOffset(t),
    shadowColor,
    shadowOpacity: t.opacity,
    shadowRadius: t.blur,
    elevation: blurToElevation(t.blur),
  };
}

export type { ShadowTokenName };
