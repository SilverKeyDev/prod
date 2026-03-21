import type { IconName } from "packages/ui/types/icons";

/** Lucide icon names for property report section keys (compare + property details analysis). */
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

export function getSectionIconName(sectionKey: string): IconName | undefined {
  return SECTION_ICON_NAMES[sectionKey];
}
