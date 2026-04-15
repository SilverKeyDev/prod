/**
 * Shared score-based color scale for match scores (0–100).
 * UI (`getScoreBasedColor`): five discrete bands on the red→yellow→green arc.
 * Map pins (`getScoreBasedColorForMap`): interpolated stops — very low chroma at low scores,
 * soft gold mid, muted emerald high (overall less saturated than legacy map palette).
 */
export type ScoreColors = {
  fillColor: string;
  strokeColor: string;
  /** Muted text color for contrast on fillColor (WCAG-aware, luminance-based). */
  textColor: string;
};

/** Optional HSL overrides (saturation/lightness percentages 0–100) for the active step. */
export type ScoreColorScaleOptions = {
  saturation?: number;
  lightness?: number;
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

const SCORE_COLOR_STEP_COUNT = 5;

/**
 * Hue uses the project’s 0–120° red → yellow → green arc (see hslScoreArcToRgb).
 * UI steps: saturation rises in the center so the middle band reads clearly as yellow.
 */
const SCORE_STEP_HSL_UI: readonly [number, number, number][] = [
  [5, 48, 35], // deep wine / crimson
  [24, 44, 38], // burnt amber (muted but defined)
  [56, 70, 48], // clear golden yellow — high chroma, no khaki
  [86, 46, 41], // crisp yellow-green
  [115, 44, 37], // rich emerald
];

/**
 * Map pins: interpolate along these stops so low scores are much less saturated
 * and highs stay vivid but not neon. Saturation peaks in the mid band (soft gold).
 */
const MAP_SCORE_HSL_STOPS: readonly [number, number, number][] = [
  [6, 16, 40], // dusty rose — very low chroma
  [24, 26, 44], // warm clay
  [52, 46, 49], // muted gold (readable on aerial tiles)
  [90, 36, 45], // yellow-green
  [118, 34, 42], // deep sage / emerald
];

/**
 * HSL on the red → yellow → green arc: h in [0, 120], s and l in [0, 100].
 */
function hslScoreArcToRgb(
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

function stepIndexFromScore(score0to100: number): number {
  const clamped = Math.max(0, Math.min(100, score0to100));
  return Math.min(
    SCORE_COLOR_STEP_COUNT - 1,
    Math.floor((clamped / 100) * SCORE_COLOR_STEP_COUNT),
  );
}

function lerp(a: number, b: number, u: number): number {
  return a + (b - a) * u;
}

/** t in [0, 1] from match score; lerps H/S/L between MAP_SCORE_HSL_STOPS. */
function mapScoreToInterpolatedHsl(
  score0to100: number,
): [number, number, number] {
  const t = Math.max(0, Math.min(1, score0to100 / 100));
  const stops = MAP_SCORE_HSL_STOPS;
  const n = stops.length - 1;
  const pos = t * n;
  const i = Math.min(n - 1, Math.floor(pos));
  const u = pos - i;
  const a = stops[i]!;
  const b = stops[i + 1]!;
  return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
}

function buildScoreColorsFromStepHsl(
  h: number,
  s: number,
  l: number,
): ScoreColors {
  const { r, g, b } = hslScoreArcToRgb(h, s, l);
  const fillColor = `rgb(${r}, ${g}, ${b})`;
  const strokeColor = `rgb(${Math.round(r * STROKE_RGB_FACTOR)}, ${Math.round(
    g * STROKE_RGB_FACTOR,
  )}, ${Math.round(b * STROKE_RGB_FACTOR)})`;
  const luminance = relativeLuminance(r, g, b);
  const textColor =
    luminance < LUMINANCE_THRESHOLD ? MUTED_LIGHT_TEXT : MUTED_DARK_TEXT;
  return { fillColor, strokeColor, textColor };
}

/**
 * Score gradient for cards, badges, and other UI on light backgrounds.
 */
export function getScoreBasedColor(
  score: number,
  options?: ScoreColorScaleOptions,
): ScoreColors {
  const step = stepIndexFromScore(score);
  const row = SCORE_STEP_HSL_UI[step] ?? SCORE_STEP_HSL_UI[0]!;
  const h = row[0];
  let s = row[1];
  let l = row[2];
  if (options?.saturation != null) {
    s = Math.max(0, Math.min(100, options.saturation));
  }
  if (options?.lightness != null) {
    l = Math.max(0, Math.min(100, options.lightness));
  }
  return buildScoreColorsFromStepHsl(h, s, l);
}

/**
 * Match pins on the map: continuous red→yellow→green arc with saturation that
 * ramps up strongly with score (very desaturated at the bottom).
 */
export function getScoreBasedColorForMap(score: number): ScoreColors {
  const [h, s, l] = mapScoreToInterpolatedHsl(score);
  return buildScoreColorsFromStepHsl(h, s, l);
}
