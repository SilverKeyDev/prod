/**
 * Match score from search/saved listing payloads (`_score`), when present.
 * Same numeric scale the backend uses for MCDA display when populated.
 */
export function getPropertyMatchScore(property: { _score?: number | null }): number {
  const v = property._score;
  if (typeof v !== "number" || !Number.isFinite(v)) {
    return 0;
  }
  return v;
}

/** MCDA display band (Server `MCDA_CONFIG` `output_display_*`). */
const MCDA_DISPLAY_MIN = 1;
const MCDA_DISPLAY_MAX = 99;

/**
 * True when the listing is at the top of the backend MCDA match scale (all hard constraints
 * satisfied and soft signals strongly favorable).
 */
export function isListingFullCriteriaMatch(property: { _score?: number | null }): boolean {
  const v = property._score;
  if (typeof v !== "number" || !Number.isFinite(v)) {
    return false;
  }
  if (v >= MCDA_DISPLAY_MIN && v <= MCDA_DISPLAY_MAX) {
    return v >= MCDA_DISPLAY_MAX - 0.05;
  }
  return false;
}
