import React from "react";

import { useLocalization } from "packages/contexts";
import { color } from "packages/design-tokens";
import { getMatchStyle } from "packages/utils";

export type MatchPillProps = {
  /** Match score on 0–100 scale (clamped in getMatchStyle). */
  score: number;
  /** When false, only the rounded integer is shown (e.g. dense map chrome). Default true. */
  showLabel?: boolean;
  className?: string;
  /** Larger padding and type for detail surfaces. */
  emphasis?: boolean;
};

/**
 * Accessible match score pill: tier bg/fg from CSS variables, rounded score, optional short tier label.
 */
export function MatchPill({
  score,
  showLabel = true,
  className = "",
  emphasis = false,
}: MatchPillProps): React.ReactElement {
  const { t } = useLocalization();
  const style = getMatchStyle(score);
  const bg = color(`match.${style.tier}.bg`) || style.bg;
  const fg = color(`match.${style.tier}.fg`) || style.fg;
  const rounded = Math.round(
    typeof score === "number" && Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0
  );
  const tierLabel = t(`house.match_pill_tier_${style.tier}`, {
    defaultValue: style.label,
  });
  const ariaLabel = t("house.match_pill_aria", {
    score: rounded,
    tier: tierLabel,
    defaultValue: `Match score ${rounded} out of 100, ${tierLabel}`,
  });

  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={className}
      style={{
        backgroundColor: bg,
        color: fg,
        padding: emphasis ? "6px 12px" : "4px 10px",
        borderRadius: "6px",
        fontSize: emphasis ? "14px" : "13px",
        fontWeight: 500,
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        whiteSpace: "nowrap",
      }}
    >
      <span>{rounded}</span>
      {showLabel ? <span>· {tierLabel}</span> : null}
    </span>
  );
}
