import React from "react";

import { Shield } from "lucide-react";

import { DEFAULT_REPORT_SECTIONS } from "packages/utils/domain/profile";

import Card from "@/components/layout/Card.web";
import { SectionTintWrapper } from "@/components/modals/PropertyDetailsModal/sections/layout/SectionTintWrapper";
import type { PropertyComponentProps } from "@/components/modals/PropertyDetailsModal/types";
import { Title } from "@/components/ui/index.web";

import {
  renderAgeDistribution,
  renderNeighborhoodContent,
} from "./propertyNeighborhoodHelpers";

type PropertyNeighborhoodProps = PropertyComponentProps & {
  analysisContent?: unknown;
};

export const PropertyNeighborhood: React.FC<PropertyNeighborhoodProps> = ({
  property: _property,
  analysisContent,
}) => {
  const neighborhoodOverview = analysisContent as
    | Record<string, unknown>
    | undefined;
  const ageDistribution = neighborhoodOverview?.age_distribution as
    | Record<string, string>
    | undefined;
  const neighborhoodContent = neighborhoodOverview
    ? { ...neighborhoodOverview }
    : undefined;
  if (neighborhoodContent && "age_distribution" in neighborhoodContent) {
    delete neighborhoodContent.age_distribution;
  }
  const hasNeighborhoodContent =
    neighborhoodContent && Object.keys(neighborhoodContent).length > 0;
  const hasAgeDistribution =
    ageDistribution && Object.keys(ageDistribution).length > 0;

  if (!hasNeighborhoodContent && !hasAgeDistribution) return null;

  const sectionLabel =
    DEFAULT_REPORT_SECTIONS.find(
      (s: { key: string; label: string }) => s.key === "neighborhood",
    )?.label || "Neighborhood Information";

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-brown" />
        <Title as="h3" size="lg" className="font-semibold text-brown">
          {sectionLabel}
        </Title>
      </div>
      <SectionTintWrapper className="mt-2">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {hasNeighborhoodContent && (
            <div>
              <Card className="p-4">
                {renderNeighborhoodContent(neighborhoodContent!)}
              </Card>
            </div>
          )}
          {hasAgeDistribution && (
            <div>
              <Card className="p-4">
                {renderAgeDistribution(ageDistribution!)}
              </Card>
            </div>
          )}
        </div>
      </SectionTintWrapper>
    </div>
  );
};
