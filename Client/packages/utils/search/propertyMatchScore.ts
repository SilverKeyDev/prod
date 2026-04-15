/**
 * Match score from search/saved listing payloads (`_score`), when present.
 * Same numeric scale the backend uses for MCDA display when populated.
 */
export function getPropertyMatchScore(property: {
  _score?: number | null;
}): number {
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
 * satisfied and soft signals strongly favorable). Also accepts legacy 0–100 scores ≥ 99.5.
 */
export function isListingFullCriteriaMatch(property: {
  _score?: number | null;
}): boolean {
  const v = property._score;
  if (typeof v !== "number" || !Number.isFinite(v)) {
    return false;
  }
  // Primary: MCDA maps internal0–100 to [1, 99] (see Server/.../mcda/score.py).
  if (v >= MCDA_DISPLAY_MIN && v <= MCDA_DISPLAY_MAX) {
    return v >= MCDA_DISPLAY_MAX - 0.05;
  }
  // Fallback if API ever sends a 0–100 style score
  if (v > MCDA_DISPLAY_MAX && v <= 100) {
    return v >= 99.5;
  }
  return false;
}
