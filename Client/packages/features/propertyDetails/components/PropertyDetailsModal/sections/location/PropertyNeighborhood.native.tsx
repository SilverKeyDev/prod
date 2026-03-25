import React from "react";

import { PropertySectionRatingBadge } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/PropertySectionRatingBadge";
import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper.native";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { PropertySectionHeader } from "packages/features/propertyDetails/components/visualizations";
import { Box } from "packages/ui/components/primitives";
import { DEFAULT_REPORT_SECTIONS } from "packages/utils/domain/defaultReportSections";
import { stripSectionRatingField } from "packages/utils/propertyDetails";

import { renderAgeDistribution, renderNeighborhoodContent } from "./propertyNeighborhoodHelpers";

type PropertyNeighborhoodProps = PropertyComponentProps & {
  analysisContent?: unknown;
};

export const PropertyNeighborhood: React.FC<PropertyNeighborhoodProps> = ({
  property: _property,
  analysisContent,
}) => {
  const neighborhoodOverview = analysisContent as Record<string, unknown> | undefined;
  const ageDistribution = neighborhoodOverview?.age_distribution as
    | Record<string, string>
    | undefined;
  const neighborhoodContent = neighborhoodOverview ? { ...neighborhoodOverview } : undefined;
  if (neighborhoodContent && "age_distribution" in neighborhoodContent) {
    delete neighborhoodContent.age_distribution;
  }
  const { rest: neighborhoodBody, rating: neighborhoodSectionRating } = stripSectionRatingField(
    neighborhoodContent ?? null
  );
  const neighborhoodContentForRender =
    neighborhoodBody && typeof neighborhoodBody === "object" && !Array.isArray(neighborhoodBody)
      ? (neighborhoodBody as Record<string, unknown>)
      : undefined;
  const hasNeighborhoodContent =
    neighborhoodContentForRender && Object.keys(neighborhoodContentForRender).length > 0;
  const hasAgeDistribution = ageDistribution && Object.keys(ageDistribution).length > 0;
  if (!hasNeighborhoodContent && !hasAgeDistribution && neighborhoodSectionRating === null) {
    return null;
  }

  const sectionLabel =
    DEFAULT_REPORT_SECTIONS.find((s: { key: string; label: string }) => s.key === "neighborhood")
      ?.label ?? "Neighborhood Information";

  return (
    <Box className="p-6">
      <PropertySectionHeader
        iconName="shield"
        title={sectionLabel}
        className="!mb-4"
        action={<PropertySectionRatingBadge rating={neighborhoodSectionRating} />}
      />
      <SectionTintWrapper className="mt-2">
        <Box className="gap-6">
          {hasNeighborhoodContent ? (
            <Box className="border-border bg-background-surface rounded-lg border p-4">
              {renderNeighborhoodContent(neighborhoodContentForRender!)}
            </Box>
          ) : null}
          {hasAgeDistribution ? (
            <Box className="border-border bg-background-surface rounded-lg border p-4">
              {renderAgeDistribution(ageDistribution!)}
            </Box>
          ) : null}
        </Box>
      </SectionTintWrapper>
    </Box>
  );
};
