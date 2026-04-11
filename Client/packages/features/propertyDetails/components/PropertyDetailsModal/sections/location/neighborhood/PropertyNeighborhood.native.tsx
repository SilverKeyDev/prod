import React from "react";

import { useLocalization } from "packages/contexts";
import { PropertySectionRatingBadge } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/PropertySectionRatingBadge";
import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper.native";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { PropertySectionHeader } from "packages/features/propertyDetails/components/visualizations";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import { DEFAULT_REPORT_SECTIONS } from "packages/utils/domain/defaultReportSections";
import { stripSectionRatingField } from "packages/utils/propertyDetails";

import { renderNeighborhoodContent } from "./propertyNeighborhoodHelpers";

type PropertyNeighborhoodProps = PropertyComponentProps & {
  analysisContent?: unknown;
};

export const PropertyNeighborhood: React.FC<PropertyNeighborhoodProps> = ({
  property,
  analysisContent,
}) => {
  const { t } = useLocalization();
  const commute = (property as unknown as { commute_data?: unknown })
    .commute_data as
    | {
        commute_time?: string | number;
        commute_distance?: string | number;
      }
    | undefined;
  const hasCommuteInfo =
    commute &&
    (commute.commute_time != null || commute.commute_distance != null);
  const neighborhoodOverview = analysisContent as
    | Record<string, unknown>
    | undefined;

  const neighborhoodContent = neighborhoodOverview
    ? { ...neighborhoodOverview }
    : undefined;
  if (neighborhoodContent) {
    delete neighborhoodContent.age_distribution;
    delete neighborhoodContent.race_distribution;
    delete neighborhoodContent.income_distribution;
    delete neighborhoodContent.education_distribution;
  }
  const { rest: neighborhoodBody, rating: neighborhoodSectionRating } =
    stripSectionRatingField(neighborhoodContent ?? null);
  const neighborhoodContentForRender =
    neighborhoodBody &&
    typeof neighborhoodBody === "object" &&
    !Array.isArray(neighborhoodBody)
      ? (neighborhoodBody as Record<string, unknown>)
      : undefined;
  const hasNeighborhoodContent =
    neighborhoodContentForRender &&
    Object.keys(neighborhoodContentForRender).length > 0;

  if (
    !hasNeighborhoodContent &&
    !hasCommuteInfo &&
    neighborhoodSectionRating === null
  ) {
    return null;
  }

  const sectionLabel =
    DEFAULT_REPORT_SECTIONS.find(
      (s: { key: string; label: string }) => s.key === "neighborhood",
    )?.label ?? "Neighborhood Information";

  return (
    <Box className="p-6">
      <PropertySectionHeader
        iconName="shield"
        title={sectionLabel}
        className="!mb-4"
        action={
          <PropertySectionRatingBadge rating={neighborhoodSectionRating} />
        }
      />
      <SectionTintWrapper className="mt-2">
        <Box className="gap-6">
          {hasCommuteInfo ? (
            <Box className="border-border bg-background-surface rounded-lg border p-4">
              <Box className="gap-2">
                {commute!.commute_time != null && (
                  <BodyText as="p" size="sm">
                    <BodyText as="span" className="font-semibold">
                      {t("property_details.commute_time", {
                        defaultValue: "Commute Time:",
                      })}
                    </BodyText>{" "}
                    {String(commute!.commute_time)}{" "}
                    {t("property_details.minutes", { defaultValue: "minutes" })}
                  </BodyText>
                )}
                {commute!.commute_distance != null && (
                  <BodyText as="p" size="sm">
                    <BodyText as="span" className="font-semibold">
                      {t("property_details.commute_distance", {
                        defaultValue: "Commute Distance:",
                      })}
                    </BodyText>{" "}
                    {String(commute!.commute_distance)}{" "}
                    {t("property_details.miles", { defaultValue: "miles" })}
                  </BodyText>
                )}
              </Box>
            </Box>
          ) : null}
          {hasNeighborhoodContent ? (
            <Box className="border-border bg-background-surface rounded-lg border p-4">
              {renderNeighborhoodContent(neighborhoodContentForRender!)}
            </Box>
          ) : null}
        </Box>
      </SectionTintWrapper>
    </Box>
  );
};
