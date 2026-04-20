/**
 * Match score → fill/stroke/text for imperative map/SVG helpers. Uses design-token hex
 * (`match.*.bg` / `match.*.fg`) for stroke derivation; fills may use CSS vars via `getMatchStyle`.
 */
import { color } from "packages/design-tokens";

import { getMatchStyle } from "./matchScore";

export type ScoreColors = {
  fillColor: string;
  strokeColor: string;
  textColor: string;
};

function parseHexRgb(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.replace("#", "").trim();
  if (raw.length !== 6) return null;
  return {
    r: parseInt(raw.slice(0, 2), 16),
    g: parseInt(raw.slice(2, 4), 16),
    b: parseInt(raw.slice(4, 6), 16),
  };
}

function strokeFromFillHex(fillHex: string): string {
  const rgb = parseHexRgb(fillHex);
  if (!rgb) return fillHex;
  const f = 0.82;
  return `rgb(${Math.round(rgb.r * f)}, ${Math.round(rgb.g * f)}, ${Math.round(rgb.b * f)})`;
}

/**
 * Legacy shape for map pins/cards: fill uses CSS var (SVG resolves against :root), stroke from token hex.
 */
export function getMatchScoreGradientColors(score: number): ScoreColors {
  const style = getMatchStyle(score);
  const { tier } = style;
  const fillHex = color(`match.${tier}.bg`);
  const textHex = color(`match.${tier}.fg`);
  const strokeColor = strokeFromFillHex(fillHex || "#E8D3C8");
  return {
    fillColor: style.bg,
    strokeColor,
    textColor: textHex || "#8C3D2A",
  };
}

/** Same as `getMatchScoreGradientColors` — legacy name used by map pin helpers. */
export function getScoreBasedColorForMap(score: number): ScoreColors {
  return getMatchScoreGradientColors(score);
}
