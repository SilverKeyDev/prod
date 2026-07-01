import { color } from "packages/design-tokens";

/** Area above which overlay mode uses section-scale density instead of button-scale. */
export const RIPPLE_LARGE_OVERLAY_AREA_THRESHOLD = 80_000;

export const RIPPLE_LINE_MAX_WIDTH = 1.1;
export const RIPPLE_LINE_MIN_WIDTH = 0.65;
/** Uniform stroke for native SVG lines (no taper). */
export const RIPPLE_LINE_STROKE_WIDTH = 0.9;

/** Particle dot fill — one step above line stroke for legibility on light backgrounds. */
export function rippleDotColor(): string {
  return color("neutral.400");
}

/** Connecting line stroke — visible but subdued on base/surface backgrounds. */
export function rippleLineColor(): string {
  return color("neutral.500");
}

/** Stronger opacity for nearby pairs; fades toward the connect-distance cutoff. */
export function rippleLineOpacityForDistance(dist: number, connectDistance: number): number {
  const proximity = 1 - dist / connectDistance;
  return 0.55 + proximity * 0.45;
}
