import React from "react";

import { PropertySectionRatingBadge } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/PropertySectionRatingBadge";
import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper";
import {
  renderAgeDistribution,
  renderEducationDistribution,
  renderIncomeDistribution,
  renderRaceDistribution,
} from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/location/neighborhood/propertyNeighborhoodHelpers";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { PropertySectionHeader } from "packages/features/propertyDetails/components/visualizations";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import { DEFAULT_REPORT_SECTIONS } from "packages/utils/domain/defaultReportSections";
import { stripSectionRatingField } from "packages/utils/propertyDetails";

type PropertyDemographicsProps = PropertyComponentProps & {
  analysisContent?: unknown;
};

export const PropertyDemographics: React.FC<PropertyDemographicsProps> = ({ analysisContent }) => {
  const neighborhoodOverview = analysisContent as Record<string, unknown> | undefined;

  const ageDistribution = neighborhoodOverview?.age_distribution as
    | Record<string, string>
    | undefined;
  const raceDistribution = neighborhoodOverview?.race_distribution as
    | Record<string, string>
    | undefined;
  const incomeDistribution = neighborhoodOverview?.income_distribution as
    | Record<string, string>
    | undefined;
  const educationDistribution = neighborhoodOverview?.education_distribution as
    | Record<string, string>
    | undefined;

  const hasAgeDistribution = ageDistribution && Object.keys(ageDistribution).length > 0;
  const hasRaceDistribution = raceDistribution && Object.keys(raceDistribution).length > 0;
  const hasIncomeDistribution = incomeDistribution && Object.keys(incomeDistribution).length > 0;
  const hasEducationDistribution =
    educationDistribution && Object.keys(educationDistribution).length > 0;

  // Extract section rating if present
  const demographicsContent = neighborhoodOverview ? { ...neighborhoodOverview } : undefined;
  if (demographicsContent) {
    delete demographicsContent.age_distribution;
    delete demographicsContent.race_distribution;
    delete demographicsContent.income_distribution;
    delete demographicsContent.education_distribution;
  }
  const { rating: demographicsSectionRating } = stripSectionRatingField(
    demographicsContent ?? null
  );

  if (
    !hasAgeDistribution &&
    !hasRaceDistribution &&
    !hasIncomeDistribution &&
    !hasEducationDistribution &&
    demographicsSectionRating === null
  ) {
    return null;
  }

  const sectionLabel =
    DEFAULT_REPORT_SECTIONS.find((s: { key: string; label: string }) => s.key === "demographics")
      ?.label || "Demographics";

  return (
    <Box className="p-6">
      <PropertySectionHeader
        iconName="users"
        title={sectionLabel}
        className="!mb-4"
        action={<PropertySectionRatingBadge rating={demographicsSectionRating} />}
      />
      <SectionTintWrapper className="mt-2">
        <Box className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left Column: Age + Education */}
          <Box className="space-y-6">
            {hasAgeDistribution && (
              <Card border="light" className="p-4">
                {renderAgeDistribution(ageDistribution!)}
              </Card>
            )}
            {hasEducationDistribution && (
              <Card border="light" className="p-4">
                {renderEducationDistribution(educationDistribution!)}
              </Card>
            )}
          </Box>

          {/* Right Column: Race + Income */}
          <Box className="space-y-6">
            {hasRaceDistribution && (
              <Card border="light" className="p-4">
                {renderRaceDistribution(raceDistribution!)}
              </Card>
            )}
            {hasIncomeDistribution && (
              <Card border="light" className="p-4">
                {renderIncomeDistribution(incomeDistribution!)}
              </Card>
            )}
          </Box>
        </Box>
      </SectionTintWrapper>
    </Box>
  );
};
