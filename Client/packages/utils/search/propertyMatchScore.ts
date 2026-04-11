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

/** MCDA display ceiling (Server `home_matching.mcda.score`, `output_display_max`). */
const MCDA_DISPLAY_MAX = 90;

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
  // Primary: MCDA output is mapped to [15, 90] (see Server/app/home_matching/mcda/score.py).
  if (v >= 15 && v <= MCDA_DISPLAY_MAX) {
    return v >= MCDA_DISPLAY_MAX - 0.05;
  }
  // Fallback if API ever sends a 0–100 style score
  if (v > MCDA_DISPLAY_MAX && v <= 100) {
    return v >= 99.5;
  }
  return false;
}
