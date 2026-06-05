import React from "react";

import { useLocalization } from "packages/contexts";
import { color, spacing } from "packages/design-tokens";
import BodyText from "packages/ui/components/structure/text/BodyText";
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
    <BodyText
      as="span"
      role="status"
      aria-label={ariaLabel}
      className={`inline-flex max-w-none items-center whitespace-nowrap font-medium ${className}`}
      style={{
        backgroundColor: bg,
        color: fg,
        paddingTop: emphasis ? spacing(1.5) : spacing(1),
        paddingBottom: emphasis ? spacing(1.5) : spacing(1),
        paddingLeft: emphasis ? spacing(3) : spacing(2.5),
        paddingRight: emphasis ? spacing(3) : spacing(2.5),
        borderRadius: spacing(1.5),
        fontSize: emphasis ? "14px" : "13px",
        fontWeight: 500,
        display: "inline-flex",
        alignItems: "center",
        gap: spacing(1.5),
      }}
    >
      <BodyText as="span" className="text-inherit" style={{ color: "inherit" }}>
        {rounded}
      </BodyText>
      {showLabel ? (
        <BodyText as="span" className="text-inherit" style={{ color: "inherit" }}>
          · {tierLabel}
        </BodyText>
      ) : null}
    </BodyText>
  );
}
