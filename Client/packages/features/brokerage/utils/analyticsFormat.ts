/**
 * Shared formatters for brokerage analytics KPI display.
 */

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
