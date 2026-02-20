/**
 * Compact count formatting for social proof (e.g., likes, comments).
 * Formats with one decimal: 1.2k, 125.2k, 4.2M when >= 1,000 / >= 1,000,000.
 */

/**
 * Formats a count for display (likes, comments, etc.).
 * - Under 1,000: plain number (e.g. 999)
 * - 1,000 to < 1M: one decimal + "k" (e.g. 1.0k, 125.2k)
 * - 1M+: one decimal + "M" (e.g. 1.0M, 4.2M)
 */
export function formatCompactCount(n: number): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "0";
  const num = Math.floor(n);
  if (num < 1000) return String(num);
  if (num < 1_000_000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return `${(num / 1_000_000).toFixed(1)}M`;
}

/** Alias for formatCompactCount for use where "number" naming is preferred (e.g. currency module). */
export const formatCompactNumber = formatCompactCount;
