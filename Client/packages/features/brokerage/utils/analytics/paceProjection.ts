/**
 * Run-rate pace projection helpers for Goals & pacing cards.
 */

import { PACE_THRESHOLD_GOOD, PACE_THRESHOLD_MID } from "./analyticsTokens";
import { rateColorHighGood } from "./rateColor";

/**
 * Assume we are mid-period (50% elapsed) for demo pacing when no clock is available.
 * Projection = actual / elapsedFraction, capped display-wise by caller.
 */
export const DEMO_ELAPSED_FRACTION = 0.5;

/** Projected percent of target at period end given current actual and elapsed fraction. */
export function projectedPacePercent(
  actual: number,
  target: number,
  elapsedFraction: number = DEMO_ELAPSED_FRACTION
): number {
  if (target <= 0 || elapsedFraction <= 0) return 0;
  const runRate = actual / elapsedFraction;
  return Math.round((runRate / target) * 100);
}

export function paceBarColor(pacePct: number): string {
  return rateColorHighGood(pacePct, PACE_THRESHOLD_GOOD, PACE_THRESHOLD_MID);
}

/** Copy: "At current pace → ~94% of target" */
export function paceProjectionLabel(projectedPct: number): string {
  return `At current pace → ~${projectedPct}% of target`;
}
