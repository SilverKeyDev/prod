import {
  CheckCircle,
  TrendingUp,
  Shield,
  MapPin,
  Home,
  DollarSign,
  UtensilsCrossed,
  Footprints,
} from "lucide-react";
import React from "react";

// Icon component type for section icons
export type SectionIconComponent = React.ComponentType<{ className?: string }>;

// Icon mapping dictionary for report sections
export const SECTION_ICONS: Record<string, SectionIconComponent> = {
  affordability: DollarSign,
  neighborhood: Shield,
  commute: MapPin,
  family_friendly: Home,
  entertainment: UtensilsCrossed,
  investment: TrendingUp,
  climate_environmental_safety: Shield,
  convenience_walkability: Footprints,
};

// Helper function to get icon component for a section
export function getSectionIcon(
  sectionKey: string
): SectionIconComponent | undefined {
  return SECTION_ICONS[sectionKey];
}

// Helper function to render section icon with custom className
export function renderSectionIcon(
  sectionKey: string,
  className: string = "h-5 w-5"
): React.ReactNode {
  const IconComponent = getSectionIcon(sectionKey);
  if (!IconComponent) {
    return <CheckCircle className={className} />;
  }
  return <IconComponent className={className} />;
}
