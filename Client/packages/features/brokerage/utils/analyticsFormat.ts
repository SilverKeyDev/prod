/**
 * Shared formatters for brokerage analytics KPI display.
 */

import type { DeltaTone } from "packages/features/brokerage/utils/analytics/analyticsTokens";
import { toneFromDelta } from "packages/features/brokerage/utils/analytics/analyticsTokens";

export function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `$${Math.round(value / 1_000).toLocaleString()}K`;
  }
  return `$${Math.round(value).toLocaleString()}`;
}

/** Pace of actual vs target as a percent (100 = on goal). */
export function pacePercent(actual: number, target: number): number {
  if (target <= 0) return 0;
  return Math.round((actual / target) * 100);
}

/** Signed compact delta string for KPI subtitles (e.g. "+$1.2M MoM"). */
export function formatDeltaCompact(
  delta: number,
  opts?: { asCurrency?: boolean; suffix?: string }
): string {
  const sign = delta > 0 ? "+" : "";
  const body = opts?.asCurrency
    ? formatCompactCurrency(delta).replace(/^-/, "")
    : Math.abs(delta).toLocaleString();
  const signed = delta < 0 ? `-${body}` : `${sign}${body}`;
  return opts?.suffix ? `${signed} ${opts.suffix}` : signed;
}

export function deltaToneForChange(delta: number, higherIsBetter = true): DeltaTone {
  return toneFromDelta(delta, higherIsBetter);
}

/**
 * Format a percentage-point lift with three significant figures (e.g. 4 → "4.00", 12.34 → "12.3").
 * Does not include a sign or "pp" suffix — callers add those.
 */
export function formatLiftPp(value: number): string {
  if (!Number.isFinite(value)) return "0.00";
  if (value === 0) return "0.00";
  const formatted = value.toPrecision(3);
  // toPrecision can emit scientific notation for tiny magnitudes; pp lifts stay fixed.
  if (/e/i.test(formatted)) {
    return value.toFixed(3);
  }
  return formatted;
}

/** Signed lift string with three significant figures (e.g. "+4.00", "-1.25"). */
export function formatSignedLiftPp(value: number): string {
  const body = formatLiftPp(Math.abs(value));
  if (value > 0) return `+${body}`;
  if (value < 0) return `-${body}`;
  return body;
}
