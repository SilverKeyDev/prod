/**
 * Section building for PropertyDetailsModal; extracted to satisfy max-lines-per-function.
 */
import React from "react";

import { PropertyAnalysis } from "packages/features/propertyDetails/components/PropertyDetailsModal/body/PropertyAnalysis";

import { PropertyCommute } from "@/features/propertyDetails/components/PropertyDetailsModal/sections/location/PropertyCommute";
import { PropertyNeighborhood } from "@/features/propertyDetails/components/PropertyDetailsModal/sections/location/PropertyNeighborhood";
import { PropertySchools } from "@/features/propertyDetails/components/PropertyDetailsModal/sections/location/PropertySchools";

export type SectionComponent = {
  key: string;
  component: React.ReactNode;
  priority: number;
};

const SECTION_ORDER: Record<string, number> = {
  commute: 3,
  family_friendly: 4,
  neighborhood: 2,
  analysis: 10,
};

type BuildSectionsParams = {
  property: NonNullable<unknown>;
  hasCommute: boolean;
  hasSchools: boolean;
  hasNeighborhood: boolean;
  hasAnalysis: boolean;
  commuteAnalysis: unknown;
  familyFriendlyAnalysis: unknown;
  neighborhoodAnalysis: unknown;
};

export function buildPropertyDetailsOrderedSections(
  params: BuildSectionsParams
): SectionComponent[] {
  const {
    property,
    hasCommute,
    hasSchools,
    hasNeighborhood,
    hasAnalysis,
    commuteAnalysis,
    familyFriendlyAnalysis,
    neighborhoodAnalysis,
  } = params;

  const sections: SectionComponent[] = [];

  if (hasCommute || commuteAnalysis) {
    sections.push({
      key: "commute",
      component: (
        <PropertyCommute key="commute" property={property} analysisContent={commuteAnalysis} />
      ),
      priority: SECTION_ORDER.commute ?? 1000,
    });
  }

  if (hasSchools || familyFriendlyAnalysis) {
    sections.push({
      key: "family_friendly",
      component: (
        <PropertySchools
          key="schools"
          property={property}
          analysisContent={familyFriendlyAnalysis}
        />
      ),
      priority: SECTION_ORDER.family_friendly ?? 1000,
    });
  }

  if (hasNeighborhood || neighborhoodAnalysis) {
    sections.push({
      key: "neighborhood",
      component: (
        <PropertyNeighborhood
          key="neighborhood"
          property={property}
          analysisContent={neighborhoodAnalysis}
        />
      ),
      priority: SECTION_ORDER.neighborhood ?? 1000,
    });
  }

  if (hasAnalysis) {
    const excludeSections: string[] = [];
    if (hasCommute || commuteAnalysis) excludeSections.push("commute");
    if (hasSchools || familyFriendlyAnalysis) excludeSections.push("family_friendly");
    if (hasNeighborhood || neighborhoodAnalysis) {
      excludeSections.push("neighborhood_overview");
      excludeSections.push("age_distribution");
    }
    sections.push({
      key: "analysis",
      component: (
        <PropertyAnalysis key="analysis" property={property} excludeSections={excludeSections} />
      ),
      priority: SECTION_ORDER.analysis ?? 2000,
    });
  }

  sections.sort((a, b) => a.priority - b.priority);
  return sections;
}
