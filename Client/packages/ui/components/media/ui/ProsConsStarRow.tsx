import React from "react";

import { Icon } from "packages/ui/components/media/icons";
import { Box } from "packages/ui/components/structure/primitives";

const STAR_COUNT = 5;

export type ProsConsStarVariant = "pro" | "con_red_flag" | "con_warning";

type ProsConsStarRowProps = {
  score: number;
  variant: ProsConsStarVariant;
  ariaLabelKind: "strength" | "concern";
};

function starClasses(variant: ProsConsStarVariant, filled: boolean): string {
  if (!filled) {
    return "h-3.5 w-3.5 fill-transparent text-border";
  }
  if (variant === "pro") {
    return "h-3.5 w-3.5 fill-green-800 text-green-800";
  }
  if (variant === "con_red_flag") {
    return "h-3.5 w-3.5 fill-rose-800 text-rose-800";
  }
  return "h-3.5 w-3.5 fill-yellow-800 text-yellow-800";
}

export function ProsConsStarRow({ score, variant, ariaLabelKind }: ProsConsStarRowProps) {
  const filled = Math.max(0, Math.min(STAR_COUNT, Math.round(score)));
  const label =
    ariaLabelKind === "strength"
      ? `Strength, ${filled} out of ${STAR_COUNT}`
      : `Concern severity, ${filled} out of ${STAR_COUNT}`;

  return (
    <Box className="flex flex-row gap-0.5" role="img" aria-label={label}>
      {Array.from({ length: STAR_COUNT }, (_, i) => (
        <Icon key={i} name="star" className={starClasses(variant, i < filled)} />
      ))}
    </Box>
  );
}
