import React from "react";

import { PropertySectionRatingBadge } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/PropertySectionRatingBadge";
import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper.native";
import {
  renderAgeDistribution,
  renderEducationDistribution,
  renderIncomeDistribution,
  renderRaceDistribution,
} from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/location/neighborhood/propertyNeighborhoodHelpers";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { PropertySectionHeader } from "packages/features/propertyDetails/components/visualizations";
import { buildPropertyDemographicsViewModel } from "packages/features/propertyDetails/utils/propertyDemographicsModel";
import { Box } from "packages/ui/components/structure/primitives";

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
        <Box className="gap-6">
          {/* Age Distribution */}
          {hasAgeDistribution ? (
            <Box className="border-border bg-background-surface rounded-lg border p-4">
              {renderAgeDistribution(ageDistribution!)}
            </Box>
          ) : null}

          {/* Education Distribution */}
          {hasEducationDistribution ? (
            <Box className="border-border bg-background-surface rounded-lg border p-4">
              {renderEducationDistribution(educationDistribution!)}
            </Box>
          ) : null}

          {/* Race/Ethnicity Distribution */}
          {hasRaceDistribution ? (
            <Box className="border-border bg-background-surface rounded-lg border p-4">
              {renderRaceDistribution(raceDistribution!)}
            </Box>
          ) : null}

          {/* Income Distribution */}
          {hasIncomeDistribution ? (
            <Box className="border-border bg-background-surface rounded-lg border p-4">
              {renderIncomeDistribution(incomeDistribution!)}
            </Box>
          ) : null}
        </Box>
      </SectionTintWrapper>
    </Box>
  );
};
