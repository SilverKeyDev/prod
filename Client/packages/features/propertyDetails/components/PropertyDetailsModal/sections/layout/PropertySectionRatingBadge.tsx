import React from "react";

import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import { getScoreBasedColor } from "packages/utils";

export type PropertySectionRatingBadgeProps = {
  rating: number | null;
  className?: string;
};

function formatSectionRatingDisplay(rating: number): string {
  const rounded = Math.round(rating * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/**
 * Section score (0–10) shown as a pill; colors use getScoreBasedColor(rating * 10) for the 0–100 scale.
 */
export function PropertySectionRatingBadge({
  rating,
  className = "",
}: PropertySectionRatingBadgeProps): React.ReactNode {
  const { t } = useLocalization();
  if (rating === null) return null;

  const display = formatSectionRatingDisplay(rating);
  const colorScore = Math.max(0, Math.min(100, rating * 10));
  const colors = getScoreBasedColor(colorScore);

  return (
    <Box
      className={`flex-shrink-0 rounded-full border px-2.5 py-1 shadow-sm ${className}`}
      style={{
        backgroundColor: colors.fillColor,
        borderColor: colors.strokeColor,
        color: colors.textColor,
      }}
    >
      <BodyText
        as="span"
        className="text-responsive-xs font-semibold"
        style={{ color: "inherit" }}
      >
        {t("property_details.section_rating_value", {
          value: display,
          defaultValue: "{{value}}/10",
        })}
      </BodyText>
    </Box>
  );
}
