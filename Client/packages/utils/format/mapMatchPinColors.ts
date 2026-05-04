/**
 * Map pin colors from match score: dedicated `match.mapPin.*` tokens (higher chroma for basemaps).
 * Tier thresholds match `getMatchStyle` / MatchPill; UI pills still use `getMatchScoreGradientColors`.
 */
import { color } from "packages/design-tokens";

import { getMatchStyle } from "./matchScore";
import type { ScoreColors } from "./scoreColors";

/** Map pin / SVG helpers: explicit hex fills for AdvancedMarker SVG content. */
export function getMapPinColorsForScoreAndStatus(score: number): ScoreColors {
  const { tier } = getMatchStyle(score);
  const fillHex = color(`match.mapPin.${tier}.bg`);
  const strokeHex = color(`match.mapPin.${tier}.stroke`);
  const textHex = color(`match.${tier}.fg`);
  return {
    fillColor: fillHex || "#A64A3E",
    strokeColor: strokeHex || fillHex || "#5C2822",
    textColor: textHex || "#2D2D2A",
  };
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
  const fill = color(`match.mapPin.${tier}.bg`);
  return fill || params.fallbackUnfocusedColor;
}
