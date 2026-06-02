export function formatCompactPriceNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const abs = Math.abs(value);
  if (abs < 1_000) return String(Math.floor(value));
  if (abs < 1_000_000) {
    const thousands = value / 1_000;
    return `${Number.isInteger(thousands) ? thousands.toFixed(0) : thousands.toFixed(1)}K`;
  }
  const millions = value / 1_000_000;
  return `${Number.isInteger(millions) ? millions.toFixed(0) : millions.toFixed(1)}M`;
}

/**
 * Format price range for filter chip display (e.g. "$925K – $1.5M").
 */
export function formatPriceRange(min: number, max: number): string {
  const minStr = `$${formatCompactPriceNumber(min)}`;
  const maxStr = `$${formatCompactPriceNumber(max)}`;
  return `${minStr} – ${maxStr}`;
}

const formatCount = (v: number) => (v === 0 ? "Any" : v >= 8 ? "8+" : String(v));

/**
 * Format beds range for filter chip display (e.g. "4–8+ beds" or "Any–5 beds").
 */
export function formatBedsSummary(minBeds: number, maxBeds: number): string {
  const min = formatCount(minBeds);
  const max = formatCount(maxBeds);
  return `${min}–${max} beds`;
}

/**
 * Format baths range for filter chip display (e.g. "4–8+ baths" or "Any–3 baths").
 */
export function formatBathsSummary(minBaths: number, maxBaths: number): string {
  const min = formatCount(minBaths);
  const max = formatCount(maxBaths);
  return `${min}–${max} baths`;
}

/**
 * Combined beds and baths summary for filter chip (e.g. "4–8+ beds · 4–8+ baths").
 */
export function getBedBathSummary(
  minBeds: number,
  maxBeds: number,
  minBaths: number,
  maxBaths: number
): string {
  const beds = formatBedsSummary(minBeds, maxBeds);
  const baths = formatBathsSummary(minBaths, maxBaths);
  return `${beds} · ${baths}`;
}
