import React, { useMemo } from "react";

import { useLocalization } from "packages/contexts";
import { PropertySectionRatingBadge } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/PropertySectionRatingBadge";
import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { PropertySectionHeader } from "packages/features/propertyDetails/components/visualizations";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import { Image } from "packages/ui/components/primitives/media";
import BodyText from "packages/ui/components/text/BodyText";
import { DEFAULT_REPORT_SECTIONS } from "packages/utils/domain/defaultReportSections";
import { stripSectionRatingField } from "packages/utils/propertyDetails";

import { CommuteTravelTimeCards } from "./propertyCommuteHelpers";
import { CommuteAnalysisContent } from "./propertyCommuteRender";

type PropertyCommuteProps = PropertyComponentProps & {
  analysisContent?: unknown;
};

export const PropertyCommute: React.FC<PropertyCommuteProps> = ({
  property,
  analysisContent,
}) => {
  const { t } = useLocalization();
  const commute = (
    property as unknown as {
      commute_data?: unknown;
    }
  ).commute_data as
    | {
        map_url?: string;
        travel_times?: Array<{
          location_name?: string;
          name?: string;
          location_address?: string;
          address?: string;
          travel_time?: string | number;
          commute_tolerance?: number;
        }>;
        commute_time?: string | number;
        commute_distance?: string | number;
      }
    | undefined;

  const hasTravelTimes =
    commute != null &&
    Array.isArray(commute.travel_times) &&
    commute.travel_times.length > 0;

  const commuteSubtitle = useMemo(() => {
    if (!commute || hasTravelTimes) return undefined;
    const parts: string[] = [];
    if (commute.commute_time != null) {
      parts.push(
        `${t("property_details.commute_time", { defaultValue: "Commute Time:" })} ${String(commute.commute_time)} ${t("property_details.minutes", { defaultValue: "minutes" })}`,
      );
    }
    if (commute.commute_distance != null) {
      parts.push(
        `${t("property_details.commute_distance", { defaultValue: "Commute Distance:" })} ${String(commute.commute_distance)} ${t("property_details.miles", { defaultValue: "miles" })}`,
      );
    }
    return parts.length > 0 ? parts.join(" · ") : undefined;
  }, [commute, hasTravelTimes, t]);

  if (!commute) return null;
  const hasSimple =
    commute.commute_time != null || commute.commute_distance != null;
  if (!hasTravelTimes && !hasSimple && !analysisContent) return null;

  const { rest: commuteAnalysisBody, rating: commuteSectionRating } =
    stripSectionRatingField(analysisContent);
  const hasCommuteAnalysisBody =
    commuteAnalysisBody != null &&
    typeof commuteAnalysisBody === "object" &&
    !Array.isArray(commuteAnalysisBody) &&
    Object.keys(commuteAnalysisBody as Record<string, unknown>).length > 0;
  const sectionLabel =
    DEFAULT_REPORT_SECTIONS.find(
      (s: { key: string; label: string }) => s.key === "commute",
    )?.label || "Commute Information";

  const mapTitle = t("property_details.commute_map", {
    defaultValue: "Commute Map",
  });
  const mapGenerating = t("property_details.map_generating", {
    defaultValue: "Map generation in progress...",
  });
  const mapAlt = t("property_details.commute_map_alt", {
    defaultValue: "Commute map preview",
  });

  return (
    <Box className="p-6">
      <PropertySectionHeader
        iconName="map-pin"
        title={sectionLabel}
        subtitle={commuteSubtitle}
        className="!mb-4"
        action={<PropertySectionRatingBadge rating={commuteSectionRating} />}
      />
      <SectionTintWrapper className="mt-2">
        {hasTravelTimes ? (
          <Box className="grid-responsive-1-md-2 gap-4 sm:gap-6">
            <Box>
              {commute.map_url ? (
                <Box className="border-border-card-subtle bg-background-surface rounded-lg border p-4">
                  <Box className="flex max-h-[min(42vh,15rem)] w-full items-center justify-center md:max-h-52">
                    <Image
                      src={commute.map_url}
                      alt={mapAlt}
                      className="max-h-full w-full rounded object-contain"
                    />
                  </Box>
                </Box>
              ) : (
                <Box className="border-border-card-subtle bg-background-surface rounded-lg border p-4">
                  <Box className="flex max-h-[min(42vh,15rem)] min-h-32 w-full flex-row items-center justify-center md:max-h-52">
                    <Box className="text-text-secondary text-center">
                      <BodyText
                        as="p"
                        className="text-foreground text-center font-medium"
                      >
                        {mapTitle}
                      </BodyText>
                      <BodyText
                        as="p"
                        size="sm"
                        className="text-text-secondary mt-1 text-center"
                      >
                        {mapGenerating}
                      </BodyText>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
            <Box className="flex h-full flex-col justify-center gap-4">
              <CommuteTravelTimeCards
                travelTimes={commute.travel_times ?? []}
              />
            </Box>
          </Box>
        ) : (
          <Box className="text-text-secondary text-sm">
            {commute.commute_time != null && (
              <BodyText as="p">
                <BodyText as="span" className="text-foreground font-semibold">
                  {t("property_details.commute_time", {
                    defaultValue: "Commute Time:",
                  })}
                </BodyText>{" "}
                {String(commute.commute_time)}{" "}
                {t("property_details.minutes", { defaultValue: "minutes" })}
              </BodyText>
            )}
            {commute.commute_distance != null && (
              <BodyText as="p">
                <BodyText as="span" className="text-foreground font-semibold">
                  {t("property_details.commute_distance", {
                    defaultValue: "Commute Distance:",
                  })}
                </BodyText>{" "}
                {String(commute.commute_distance)}{" "}
                {t("property_details.miles", { defaultValue: "miles" })}
              </BodyText>
            )}
          </Box>
        )}
        {hasCommuteAnalysisBody && (
          <Card border="light" className="mt-4">
            <CommuteAnalysisContent data={commuteAnalysisBody} />
          </Card>
        )}
      </SectionTintWrapper>
    </Box>
  );
};
