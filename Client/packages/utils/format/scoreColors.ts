/**
 * Shared score-based color scale for match scores (0–100).
 * Five discrete steps along HSL hue 0° red → 120° green (0°, 30°, 60°, 90°, 120°);
 * UI vs map presets tune saturation/lightness for each surface.
 */
export type ScoreColors = {
  fillColor: string;
  strokeColor: string;
  /** Muted text color for contrast on fillColor (WCAG-aware, luminance-based). */
  textColor: string;
};

/** Optional HSL scale tuning (saturation/lightness percentages 0–100). */
export type ScoreColorScaleOptions = {
  saturation?: number;
  lightness?: number;
};

/** Muted chroma so scores feel at home next to neutrals; still clearly red→green in five steps. */
const UI_SCALE: Required<Pick<ScoreColorScaleOptions, "saturation" | "lightness">> = {
  saturation: 48,
  lightness: 50,
};

/** A bit more saturation + slightly lower lightness than UI so pins read on map tiles without neon UI. */
const MAP_SCALE: Required<Pick<ScoreColorScaleOptions, "saturation" | "lightness">> = {
  saturation: 62,
  lightness: 42,
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

const STROKE_RGB_FACTOR = 0.75;

/** Bins 0–100 into five bands; each band gets one hue on the red→green arc. */
const SCORE_COLOR_STEP_COUNT = 5;

/**
 * HSL (0–120° = red → yellow → green) to sRGB. h in [0, 120], s and l in [0, 100].
 */
function hslRedYellowGreenToRgb(
  h: number,
  sPercent: number,
  lPercent: number,
): { r: number; g: number; b: number } {
  const s = Math.max(0, Math.min(100, sPercent)) / 100;
  const l = Math.max(0, Math.min(100, lPercent)) / 100;
  const hue = Math.max(0, Math.min(120, h));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(hue / 60 - 1));
  const m = l - c / 2;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (hue < 60) {
    rp = c;
    gp = x;
    bp = 0;
  } else {
    rp = x;
    gp = c;
    bp = 0;
  }
  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  };
}

function scoreToDiscreteHue(score0to100: number): number {
  const clamped = Math.max(0, Math.min(100, score0to100));
  const stepIndex = Math.min(
    SCORE_COLOR_STEP_COUNT - 1,
    Math.floor((clamped / 100) * SCORE_COLOR_STEP_COUNT),
  );
  return (stepIndex / (SCORE_COLOR_STEP_COUNT - 1)) * 120;
}

function buildScoreColorsFromHsl(
  score: number,
  saturation: number,
  lightness: number,
): ScoreColors {
  const hue = scoreToDiscreteHue(score);
  const { r, g, b } = hslRedYellowGreenToRgb(hue, saturation, lightness);
  const fillColor = `rgb(${r}, ${g}, ${b})`;
  const strokeColor = `rgb(${Math.round(r * STROKE_RGB_FACTOR)}, ${Math.round(
    g * STROKE_RGB_FACTOR,
  )}, ${Math.round(b * STROKE_RGB_FACTOR)})`;
  const luminance = relativeLuminance(r, g, b);
  const textColor = luminance < LUMINANCE_THRESHOLD ? MUTED_LIGHT_TEXT : MUTED_DARK_TEXT;
  return { fillColor, strokeColor, textColor };
}

/**
 * Score gradient for cards, badges, and other UI on light backgrounds.
 */
export function getScoreBasedColor(
  score: number,
  options?: ScoreColorScaleOptions,
): ScoreColors {
  const saturation = options?.saturation ?? UI_SCALE.saturation;
  const lightness = options?.lightness ?? UI_SCALE.lightness;
  return buildScoreColorsFromHsl(score, saturation, lightness);
}

/**
 * Stronger saturation and lower lightness so match pins read on beige / muted map tiles.
 */
export function getScoreBasedColorForMap(score: number): ScoreColors {
  return buildScoreColorsFromHsl(score, MAP_SCALE.saturation, MAP_SCALE.lightness);
}
