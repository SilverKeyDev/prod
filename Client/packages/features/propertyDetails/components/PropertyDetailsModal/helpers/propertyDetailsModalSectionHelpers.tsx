/**
 * Section building for PropertyDetailsModal; extracted to satisfy max-lines-per-function.
 */
import React from "react";

import { PropertyAnalysis } from "packages/features/propertyDetails/components/PropertyDetailsModal/body/analysis/PropertyAnalysis";
import { PropertyCommute } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/location/commute/PropertyCommute";
import { PropertyDemographics } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/location/demographics/PropertyDemographics";
import { PropertyNeighborhood } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/location/neighborhood/PropertyNeighborhood";
import { PropertySchools } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/location/schools/PropertySchools";
import {
  getClimateEnvironmentalSection,
  hasEnvironmentalFactorsContent,
} from "packages/utils/propertyDetails";

export type SectionComponent = {
  key: string;
  component: React.ReactNode;
  priority: number;
};

const SECTION_ORDER: Record<string, number> = {
  commute: 3,
  family_friendly: 4,
  neighborhood: 2,
  demographics: 2.5,
  analysis: 10,
};

type BuildSectionsParams = {
  property: NonNullable<unknown>;
  hasCommute: boolean;
  hasNeighborhood: boolean;
  hasAnalysis: boolean;
  commuteAnalysis: unknown;
  familyFriendlyAnalysis: unknown;
  neighborhoodAnalysis: unknown;
};

export function buildPropertyDetailsOrderedSections(
  params: BuildSectionsParams,
): SectionComponent[] {
  const {
    property,
    hasCommute,
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
        <PropertyCommute
          key="commute"
          property={property}
          analysisContent={commuteAnalysis}
        />
      ),
      priority: SECTION_ORDER.commute ?? 1000,
    });
  }

  if (familyFriendlyAnalysis) {
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

  if (neighborhoodAnalysis) {
    sections.push({
      key: "demographics",
      component: (
        <PropertyDemographics
          key="demographics"
          property={property}
          analysisContent={neighborhoodAnalysis}
        />
      ),
      priority: SECTION_ORDER.demographics ?? 1000,
    });
  }

  if (hasAnalysis) {
    const excludeSections: string[] = [];
    if (hasCommute || commuteAnalysis) excludeSections.push("commute");
    if (familyFriendlyAnalysis) excludeSections.push("family_friendly");
    if (hasNeighborhood || neighborhoodAnalysis) {
      excludeSections.push("neighborhood_overview");
      excludeSections.push("neighborhood");
      excludeSections.push("age_distribution");
      excludeSections.push("race_distribution");
      excludeSections.push("income_distribution");
      excludeSections.push("education_distribution");
      excludeSections.push("demographics");
    }
    const pa = (property as { property_analysis?: Record<string, unknown> })
      .property_analysis;
    if (hasEnvironmentalFactorsContent(getClimateEnvironmentalSection(pa))) {
      excludeSections.push("climate_environmental_safety");
    }
    sections.push({
      key: "analysis",
      component: (
        <PropertyAnalysis
          key="analysis"
          property={property}
          excludeSections={excludeSections}
        />
      ),
      priority: SECTION_ORDER.analysis ?? 2000,
    });
  }

  sections.sort((a, b) => a.priority - b.priority);
  return sections;
}
