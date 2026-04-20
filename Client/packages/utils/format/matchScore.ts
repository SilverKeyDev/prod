/**
 * Single source of truth for match score → tier, labels, and CSS token references (0–100).
 * Thresholds: ≥85 excellent, ≥70 strong, ≥55 fair, ≥40 weak, else poor.
 * Do not duplicate these boundaries elsewhere — use `getMatchStyle` or `getMatchTier` only.
 */

export type MatchTier = "excellent" | "strong" | "fair" | "weak" | "poor";

const TIER_ORDER: readonly MatchTier[] = ["poor", "weak", "fair", "strong", "excellent"];

/** Resolved style for UI: tier metadata + `var(--match-*-bg|fg)` for use in React / CSS. */
export interface MatchStyle {
  tier: MatchTier;
  /** Short English default label (use i18n in UI when available). */
  label: string;
  bg: string;
  fg: string;
}

const TIER_VARS: Record<MatchTier, { label: string; bg: string; fg: string }> = {
  excellent: {
    label: "Excellent",
    bg: "var(--match-excellent-bg)",
    fg: "var(--match-excellent-fg)",
  },
  strong: {
    label: "Strong",
    bg: "var(--match-strong-bg)",
    fg: "var(--match-strong-fg)",
  },
  fair: {
    label: "Fair",
    bg: "var(--match-fair-bg)",
    fg: "var(--match-fair-fg)",
  },
  weak: {
    label: "Weak",
    bg: "var(--match-weak-bg)",
    fg: "var(--match-weak-fg)",
  },
  poor: {
    label: "Poor",
    bg: "var(--match-poor-bg)",
    fg: "var(--match-poor-fg)",
  },
};

function bucketTier(s: number): MatchTier {
  if (s >= 85) return "excellent";
  if (s >= 70) return "strong";
  if (s >= 55) return "fair";
  if (s >= 40) return "weak";
  return "poor";
}

/**
 * Clamp defensively — scores should be 0–100 but do not trust callers.
 * Non-finite values clamp to 0.
 */
export function clampMatchScore(score: number): number {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return 0;
  }
  return Math.max(0, Math.min(100, score));
}

/** Full style for the score bucket: tier, short label, and paired bg/fg CSS variables. */
export function getMatchStyle(score: number): MatchStyle {
  const s = clampMatchScore(score);
  const tier = bucketTier(s);
  const v = TIER_VARS[tier];
  return { tier, label: v.label, bg: v.bg, fg: v.fg };
}

/** Tier only — derived from `getMatchStyle` (single threshold implementation). */
export function getMatchTier(score: number): MatchTier {
  return getMatchStyle(score).tier;
}

/** Monotonic index 0 (poor) … 4 (excellent), for pin size and filters. */
export function getMatchTierIndex(score: number): number {
  return TIER_ORDER.indexOf(getMatchTier(score));
}
