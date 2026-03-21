import React, { useMemo } from "react";

import { useLocalization } from "packages/contexts";
import { spacing } from "packages/design-tokens";
import { PropertySectionRatingBadge } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/PropertySectionRatingBadge";
import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper.native";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { PropertySectionHeader } from "packages/features/propertyDetails/components/visualizations";
import { Icon } from "packages/ui/components/primitives";
import { Box, Image, Text } from "packages/ui/components/primitives";
import { DEFAULT_REPORT_SECTIONS } from "packages/utils/domain/defaultReportSections";
import { stripSectionRatingField } from "packages/utils/propertyDetails";

import { CommuteTravelTimeCards } from "./propertyCommuteHelpers";
import { CommuteAnalysisContent } from "./propertyCommuteRender";

function spacingToNumber(token: string): number {
  const remMatch = token.match(/^([\d.]+)rem$/);
  if (remMatch) return parseFloat(remMatch[1]) * 16;
  const pxMatch = token.match(/^(\d+)px$/);
  if (pxMatch) return parseInt(pxMatch[1], 10);
  return 0;
}

type TravelTimeItem = {
  location_name?: string;
  name?: string;
  location_address?: string;
  address?: string;
  travel_time?: string | number;
  commute_tolerance?: number;
};

type PropertyCommuteProps = PropertyComponentProps & {
  analysisContent?: unknown;
};

export const PropertyCommute: React.FC<PropertyCommuteProps> = ({
  property,
  analysisContent,
}) => {
  const { t } = useLocalization();
  const commute = (property as unknown as { commute_data?: unknown })
    .commute_data as
    | {
        map_url?: string;
        travel_times?: TravelTimeItem[];
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
    )?.label ?? "Commute Information";

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
          <Box className="gap-4">
            {commute.map_url ? (
              <Box className="border-border bg-background-surface rounded-lg border p-4">
                <Image
                  source={{ uri: commute.map_url }}
                  label={mapAlt}
                  style={{
                    width: "100%",
                    height: spacingToNumber(spacing(50)),
                    borderRadius: spacingToNumber(spacing(2)),
                  }}
                  resizeMode="contain"
                />
              </Box>
            ) : (
              <Box className="border-border bg-background-surface min-h-32 items-center justify-center rounded-lg border p-4">
                <Icon
                  name="map-pin"
                  size={48}
                  color="rgba(140, 111, 90, 0.4)"
                />
                <Text className="text-text-secondary mt-3 font-medium">
                  {mapTitle}
                </Text>
                <Text className="text-text-secondary mt-1 text-sm">
                  {mapGenerating}
                </Text>
              </Box>
            )}
            <CommuteTravelTimeCards travelTimes={commute.travel_times ?? []} />
          </Box>
        ) : (
          <Box className="gap-2">
            {commute.commute_time != null && (
              <Text className="text-text-secondary text-sm">
                <Text className="text-text-secondary font-semibold">
                  {t("property_details.commute_time", {
                    defaultValue: "Commute Time:",
                  })}
                </Text>{" "}
                {String(commute.commute_time)}{" "}
                {t("property_details.minutes", { defaultValue: "minutes" })}
              </Text>
            )}
            {commute.commute_distance != null && (
              <Text className="text-text-secondary text-sm">
                <Text className="text-text-secondary font-semibold">
                  {t("property_details.commute_distance", {
                    defaultValue: "Commute Distance:",
                  })}
                </Text>{" "}
                {String(commute.commute_distance)}{" "}
                {t("property_details.miles", { defaultValue: "miles" })}
              </Text>
            )}
          </Box>
        )}
        {hasCommuteAnalysisBody && (
          <Box className="border-border bg-background-surface mt-4 rounded-lg border p-4">
            <CommuteAnalysisContent data={commuteAnalysisBody} />
          </Box>
        )}
      </SectionTintWrapper>
    </Box>
  );
};
