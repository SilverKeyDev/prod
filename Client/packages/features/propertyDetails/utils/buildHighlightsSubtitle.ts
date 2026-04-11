import type { PropertyHighlightsContext } from "packages/types/propertyHighlightsContext";

/** MCDA display scale defaults (must match Server MCDA_CONFIG output_display_*). */
const DEFAULT_SCORE_MIN = 15;
const DEFAULT_SCORE_MAX = 90;

export type HighlightsSubtitleTranslate = (
  key: string,
  options?: { defaultValue?: string; percent?: number },
) => string;

function scoreToDisplayPercent(
  score: number,
  min: number,
  max: number,
): number {
  if (max <= min) return 50;
  const p = Math.round(((score - min) / (max - min)) * 100);
  return Math.max(0, Math.min(100, p));
}

/**
 * Explains why pros vs cons counts align with match score (buyer / agent-with-client).
 */
export function buildHighlightsSubtitle(
  t: HighlightsSubtitleTranslate,
  opts: {
    prosCount: number;
    consCount: number;
    highlightsContext?: PropertyHighlightsContext | null;
    /** Listing `_score` when present; 0 treated as missing (real scores use the MCDA display band). */
    propertyMatchScore?: number | null;
  },
): string {
  const fromProperty =
    typeof opts.propertyMatchScore === "number" &&
    Number.isFinite(opts.propertyMatchScore) &&
    opts.propertyMatchScore > 0
      ? opts.propertyMatchScore
      : null;
  const rawScore = opts.highlightsContext?.matchScore ?? fromProperty;

  const lo = opts.highlightsContext?.scoreScaleMin ?? DEFAULT_SCORE_MIN;
  const hi = opts.highlightsContext?.scoreScaleMax ?? DEFAULT_SCORE_MAX;

  if (rawScore === null) {
    return t("property_details.highlights_subtitle_no_score", {
      defaultValue:
        "Highlights reflect how this home lines up with your saved preferences and goals.",
    });
  }

  const percent = scoreToDisplayPercent(rawScore, lo, hi);
  const { prosCount, consCount } = opts;

  if (prosCount > consCount) {
    return t("property_details.highlights_subtitle_emphasize_strengths", {
      percent,
      defaultValue:
        "Your match score is {{percent}}%, so we emphasize strengths for this listing.",
    });
  }
  if (consCount > prosCount) {
    return t("property_details.highlights_subtitle_emphasize_tradeoffs", {
      percent,
      defaultValue:
        "Your match score is {{percent}}%, so we emphasize tradeoffs for this listing.",
    });
  }
  return t("property_details.highlights_subtitle_balanced", {
    percent,
    defaultValue:
      "Your match score is {{percent}}%; strengths and tradeoffs are balanced for this listing.",
  });
}
