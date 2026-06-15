import React from "react";

import { View } from "react-native";

import { color } from "packages/design-tokens";
import { Icon } from "packages/ui/components/structure/primitives";

const STAR_COUNT = 5;
const STAR_SIZE = 14;

export type ProsConsStarVariant = "pro" | "con_red_flag" | "con_warning";

function colorsForVariant(
  variant: ProsConsStarVariant,
  filled: boolean
): { stroke: string; fill: string } {
  if (!filled) {
    return { stroke: color("neutral.300"), fill: "transparent" };
  }
  if (variant === "pro") {
    const c = color("green.800");
    return { stroke: c, fill: c };
  }
  if (variant === "con_red_flag") {
    const c = color("rose.800");
    return { stroke: c, fill: c };
  }
  const c = color("yellow.800");
  return { stroke: c, fill: c };
}

type ProsConsStarRowProps = {
  score: number;
  variant: ProsConsStarVariant;
  ariaLabelKind: "strength" | "concern";
};

export function ProsConsStarRow({ score, variant, ariaLabelKind }: ProsConsStarRowProps) {
  const filled = Math.max(0, Math.min(STAR_COUNT, Math.round(score)));
  const label =
    ariaLabelKind === "strength"
      ? `Strength, ${filled} out of ${STAR_COUNT}`
      : `Concern severity, ${filled} out of ${STAR_COUNT}`;

  return (
    <View accessibilityLabel={label} accessibilityRole="image" className="flex-row gap-0.5">
      {Array.from({ length: STAR_COUNT }, (_, i) => {
        const { stroke, fill } = colorsForVariant(variant, i < filled);
        return <Icon key={i} name="star" size={STAR_SIZE} color={stroke} fill={fill} />;
      })}
    </View>
  );
}
