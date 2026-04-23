/**
 * Map pin colors from match score only: tiered tokens via `getMatchScoreGradientColors`
 * (same thresholds as MatchPill / cards).
 */
import { color } from "packages/design-tokens";

import { getMatchStyle } from "./matchScore";
import type { ScoreColors } from "./scoreColors";
import { getMatchScoreGradientColors } from "./scoreColors";

/** Map pin / SVG helpers: score → fill/stroke/text (same as MatchPill tiers). */
export function getMapPinColorsForScoreAndStatus(score: number): ScoreColors {
  return getMatchScoreGradientColors(score);
}

export type NativeMapPinColorParams = {
  isFocused: boolean;
  /** Match score 0–100; unfocused pins use tier fill from design tokens. */
  score?: number;
  /** Focused marker color (e.g. design token olive). */
  focusedColor: string;
  /** If a tier token is missing, unfocused pin falls back to this. */
  fallbackUnfocusedColor: string;
};

/**
 * Single marker color for react-native-maps default pin (hex string).
 * Unfocused: tier from score; focused: `focusedColor`.
 */
export function getNativeMapPinColorHex(params: NativeMapPinColorParams): string {
  if (params.isFocused) {
    return params.focusedColor;
  }
  const score =
    typeof params.score === "number" && Number.isFinite(params.score) ? params.score : 0;
  const tier = getMatchStyle(score).tier;
  return color(`match.${tier}.bg`) ?? params.fallbackUnfocusedColor;
}
