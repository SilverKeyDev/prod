import React from "react";

import { Icon } from "@ui/icons";

import type { IconName } from "packages/ui/types/icons";
// Icon mapping dictionary for report sections
export const SECTION_ICON_NAMES: Record<string, IconName> = {
  affordability: "dollar-sign",
  neighborhood: "shield",
  commute: "map-pin",
  family_friendly: "home",
  entertainment: "utensils-crossed",
  investment: "trending-up",
  climate_environmental_safety: "shield",
  convenience_walkability: "footprints",
};
// Helper function to get icon name for a section
export function getSectionIconName(sectionKey: string): IconName | undefined {
  return SECTION_ICON_NAMES[sectionKey];
}
// Helper function to render section icon with custom className
export function renderSectionIcon(
  sectionKey: string,
  className: string = "h-5 w-5"
): React.ReactNode {
  const iconName = getSectionIconName(sectionKey);
  if (!iconName) {
    return <Icon name="check-circle" className={className} />;
  }
  return <Icon name={iconName} className={className} />;
}
