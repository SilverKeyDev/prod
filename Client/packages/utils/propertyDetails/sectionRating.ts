/**
 * Parse and strip section-level scores from property analysis payloads.
 * Backend uses 0–10 decimals (often as strings); UI maps to 0–100 only for color helpers.
 */

const RATING_KEY = (k: string) => k === "rating" || k.endsWith("_rating");

export function parseSectionRatingValue(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") {
    if (!Number.isFinite(raw)) return null;
    return Math.max(0, Math.min(10, raw));
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    const match = trimmed.match(/^-?\d*\.?\d+/);
    if (!match) return null;
    const n = parseFloat(match[0]);
    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.min(10, n));
  }
  return null;
}

export function stripSectionRatingField(data: unknown): { rest: unknown; rating: number | null } {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return { rest: data, rating: null };
  }
  const obj = data as Record<string, unknown>;
  const ratingKey = Object.keys(obj).find(RATING_KEY);
  if (!ratingKey) {
    return { rest: data, rating: null };
  }
  const rating = parseSectionRatingValue(obj[ratingKey]);
  const rest = { ...obj };
  delete rest[ratingKey];
  return { rest, rating };
}
