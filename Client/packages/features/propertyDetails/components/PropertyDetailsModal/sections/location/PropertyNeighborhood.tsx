import React from "react";

import { Icon } from "@ui/icons";

import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import Title from "packages/ui/components/text/Title";

import { DEFAULT_REPORT_SECTIONS } from "@/features/profile/utils";

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
  const hasNeighborhoodContent = neighborhoodContent && Object.keys(neighborhoodContent).length > 0;
  const hasAgeDistribution = ageDistribution && Object.keys(ageDistribution).length > 0;
  if (!hasNeighborhoodContent && !hasAgeDistribution) return null;
  const sectionLabel =
    DEFAULT_REPORT_SECTIONS.find((s: { key: string; label: string }) => s.key === "neighborhood")
      ?.label || "Neighborhood Information";
  return (
    <Box className="p-6">
      <Box className="mb-4 flex flex-row items-center gap-2">
        <Icon name="shield" className="text-foreground h-5 w-5" />
        <Title as="h3" size="lg" className="text-foreground font-semibold">
          {sectionLabel}
        </Title>
      </Box>
      <SectionTintWrapper className="mt-2">
        <Box className="grid-responsive-1-md-2 gap-6">
          {hasNeighborhoodContent && (
            <Box>
              <Card border="light" className="p-4">{renderNeighborhoodContent(neighborhoodContent!)}</Card>
            </Box>
          )}
          {hasAgeDistribution && (
            <Box>
              <Card border="light" className="p-4">{renderAgeDistribution(ageDistribution!)}</Card>
            </Box>
          )}
        </Box>
      </SectionTintWrapper>
    </Box>
  );
};
