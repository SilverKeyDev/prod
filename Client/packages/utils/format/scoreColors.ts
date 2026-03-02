/**
 * Shared score-based color gradient for match scores (0-100).
 * Used by CardMatchScore and map score-pin markers for consistent styling.
 */
export type ScoreColors = {
  fillColor: string;
  strokeColor: string;
  /** Muted text color for contrast on fillColor (WCAG-aware, luminance-based). */
  textColor: string;
};

/** sRGB relative luminance (0–1). Used to pick light vs dark text. */
function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** Muted dark (for light backgrounds) and muted light (for dark backgrounds). */
const MUTED_DARK_TEXT = "rgb(58, 58, 56)";
const MUTED_LIGHT_TEXT = "rgba(255, 255, 255, 0.92)";
const LUMINANCE_THRESHOLD = 0.45;

export function getScoreBasedColor(score: number): ScoreColors {
  const normalizedScore = Math.max(0, Math.min(100, score)) / 100;
  const highColor = { r: 123, g: 158, b: 124 }; // #7B9E7C
  const midColor = { r: 240, g: 233, b: 210 }; // #F0E9D2
  const lowColor = { r: 216, g: 140, b: 140 }; // #D88C8C

  let r: number, g: number, b: number;

  if (normalizedScore >= 0.5) {
    const t = (normalizedScore - 0.5) * 2;
    r = Math.round(midColor.r + (highColor.r - midColor.r) * t);
    g = Math.round(midColor.g + (highColor.g - midColor.g) * t);
    b = Math.round(midColor.b + (highColor.b - midColor.b) * t);
  } else {
    const t = normalizedScore * 2;
    r = Math.round(lowColor.r + (midColor.r - lowColor.r) * t);
    g = Math.round(lowColor.g + (midColor.g - lowColor.g) * t);
    b = Math.round(lowColor.b + (midColor.b - lowColor.b) * t);
  }

  const fillColor = `rgb(${r}, ${g}, ${b})`;
  const strokeColor = `rgb(${Math.round(r * 0.75)}, ${Math.round(
    g * 0.75
  )}, ${Math.round(b * 0.75)})`;
  const luminance = relativeLuminance(r, g, b);
  const textColor = luminance < LUMINANCE_THRESHOLD ? MUTED_LIGHT_TEXT : MUTED_DARK_TEXT;
  return { fillColor, strokeColor, textColor };
}
