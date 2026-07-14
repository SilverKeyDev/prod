/**
 * Brokerage analytics visual constants — consume design-tokens, keep charts/KPIs consistent.
 */
import { color } from "packages/design-tokens";

/** Bar corner radius (px) for polished ECharts bars. */
export const CHART_BAR_RADIUS = 6;

/** Max bar width for vertical overview charts. */
export const CHART_BAR_MAX_WIDTH = 40;

/** Pace RAG thresholds: pace% of target (higher is better). */
export const PACE_THRESHOLD_GOOD = 90;
export const PACE_THRESHOLD_MID = 75;

export type DeltaTone = "up" | "down" | "flat";

export function deltaToneColor(tone: DeltaTone): string {
  if (tone === "up") return color("state.success.DEFAULT");
  if (tone === "down") return color("state.danger.DEFAULT");
  return color("text-secondary");
}

export function toneFromDelta(delta: number, higherIsBetter = true): DeltaTone {
  if (delta === 0) return "flat";
  const positive = delta > 0;
  if (higherIsBetter) return positive ? "up" : "down";
  return positive ? "down" : "up";
}
