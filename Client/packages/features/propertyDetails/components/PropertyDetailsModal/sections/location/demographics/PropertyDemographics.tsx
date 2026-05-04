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
import { buildPropertyDemographicsViewModel } from "packages/features/propertyDetails/utils/propertyDemographicsModel";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";

type PropertyDemographicsProps = PropertyComponentProps & {
  analysisContent?: unknown;
};

export const PropertyDemographics: React.FC<PropertyDemographicsProps> = ({ analysisContent }) => {
  const vm = buildPropertyDemographicsViewModel(analysisContent);
  if (!vm) return null;

  const {
    ageDistribution,
    raceDistribution,
    incomeDistribution,
    educationDistribution,
    hasAgeDistribution,
    hasRaceDistribution,
    hasIncomeDistribution,
    hasEducationDistribution,
    demographicsSectionRating,
    sectionLabel,
  } = vm;

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
