import React, { useMemo, useState } from "react";

import { useLocalization } from "packages/contexts";
import { color } from "packages/design-tokens";
import { PropertySectionRatingBadge } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/PropertySectionRatingBadge";
import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { PropertySectionHeader } from "packages/features/propertyDetails/components/visualizations";
import { usePropertyCommuteLocationMap } from "packages/features/search/hooks/data/map/commute/usePropertyCommuteLocationMap";
import { usePropertyCommuteMapUnavailableLog } from "packages/features/search/hooks/data/map/commute/usePropertyCommuteMapUnavailableLog";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Card from "packages/ui/components/surfaces/cards/Card";
import {
  stripSectionRatingField,
  unwrapPropertyAnalysisSection,
} from "packages/utils/transaction/propertyDetails";
import { commuteDestinationsForMap } from "packages/utils/transaction/propertyDetails/location/commuteMapDestinations";
import { getListingCoords } from "packages/utils/transaction/propertyDetails/location/listingCoords";

import { CommuteAnalysisContent } from "./propertyCommuteRender";

type PropertyCommuteProps = PropertyComponentProps & {
  analysisContent?: unknown;
};

export const PropertyCommute: React.FC<PropertyCommuteProps> = ({
  property,
  analysisContent,
  commuteSearchOverlay = null,
}) => {
  const { t } = useLocalization();
  const [mapHost, setMapHost] = useState<HTMLDivElement | null>(null);
  const [streetViewHost, setStreetViewHost] = useState<HTMLDivElement | null>(null);
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
          label?: string;
          location_address?: string;
          address?: string;
          travel_time?: string | number;
          commute_tolerance?: number;
          encoded_polyline?: string | null;
        }>;
        commute_time?: string | number;
        commute_distance?: string | number;
      }
    | undefined;

  const hasTravelTimes =
    commute != null && Array.isArray(commute.travel_times) && commute.travel_times.length > 0;

  const commuteAnalysisFlat = unwrapPropertyAnalysisSection("commute", analysisContent);
  const hasAnalysisInput = useMemo(() => {
    if (commuteAnalysisFlat == null || commuteAnalysisFlat === "") return false;
    if (typeof commuteAnalysisFlat !== "object" || Array.isArray(commuteAnalysisFlat)) {
      return true;
    }
    return Object.keys(commuteAnalysisFlat as Record<string, unknown>).length > 0;
  }, [commuteAnalysisFlat]);

  const hasSimple =
    commute != null && (commute.commute_time != null || commute.commute_distance != null);

  const listingCoords = useMemo(() => getListingCoords(property), [property]);
  usePropertyCommuteMapUnavailableLog({
    commute,
    hasTravelTimes,
    listingCoords,
    property,
  });
  const commuteMapDestinations = useMemo(
    () => commuteDestinationsForMap(commute?.travel_times ?? []),
    [commute?.travel_times]
  );
  const address = typeof property.address === "string" ? property.address : "";
  usePropertyCommuteLocationMap({
    mapContainer: mapHost,
    streetViewContainer: streetViewHost,
    originLat: listingCoords?.lat ?? 0,
    originLng: listingCoords?.lng ?? 0,
    listingMarkerTitle: address,
    destinations: commuteMapDestinations,
    enabled: Boolean(commute && hasTravelTimes && listingCoords),
    searchOverlay: commuteSearchOverlay,
  });

  if (!commute && !hasAnalysisInput) return null;
  if (commute && !hasTravelTimes && !hasSimple && !hasAnalysisInput) return null;

  const { rest: commuteAnalysisBody, rating: commuteSectionRating } = stripSectionRatingField(
    commuteAnalysisFlat ?? null
  );
  const hasCommuteAnalysisBody =
    commuteAnalysisBody != null &&
    typeof commuteAnalysisBody === "object" &&
    !Array.isArray(commuteAnalysisBody) &&
    Object.keys(commuteAnalysisBody as Record<string, unknown>).length > 0;
  const sectionLabel = t("property_details.location_map_heading", {
    defaultValue: "Map",
  });

  return (
    <Box className="p-6">
      <PropertySectionHeader
        iconName="map-pin"
        title={sectionLabel}
        className="!mb-4"
        action={<PropertySectionRatingBadge rating={commuteSectionRating} />}
      />
      <SectionTintWrapper className="mt-2">
        {commute && hasTravelTimes ? (
          <Box className="flex flex-col gap-4">
            <Box className="flex flex-col gap-2">
              <Box className="text-text-secondary flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                <Box className="flex items-center gap-2">
                  <Box
                    className="h-3 w-3 shrink-0 rounded-full border border-black/10"
                    style={{ backgroundColor: color("olive.DEFAULT") }}
                  />
                  <BodyText as="span" size="xs">
                    {t("property_details.commute_legend_listing")}
                  </BodyText>
                </Box>
                <Box className="flex items-center gap-2">
                  <Box
                    className="h-3 w-3 shrink-0 rounded-full border border-black/10"
                    style={{ backgroundColor: color("brown.DEFAULT") }}
                  />
                  <BodyText as="span" size="xs">
                    {t("property_details.commute_legend_important_locations")}
                  </BodyText>
                </Box>
                {commuteSearchOverlay ? (
                  <Box className="flex items-center gap-2">
                    <Box
                      className="h-3 w-3 shrink-0 rounded border border-black/10"
                      style={{
                        backgroundColor: color("olive.DEFAULT"),
                        opacity: 0.35,
                      }}
                    />
                    <BodyText as="span" size="xs">
                      {t("property_details.commute_legend_search_area")}
                    </BodyText>
                  </Box>
                ) : null}
              </Box>
              {Array.isArray(commute.travel_times) && commute.travel_times.length > 0 ? (
                <Box className="flex flex-col gap-1">
                  {commute.travel_times.map((row, idx) => {
                    const destLabel = String(
                      row.location_name ?? row.label ?? row.name ?? row.address ?? `Stop ${idx + 1}`
                    );
                    const timeStr =
                      row.travel_time != null && String(row.travel_time).trim()
                        ? String(row.travel_time)
                        : t("property_details.commute_travel_time_unknown");
                    return (
                      <BodyText
                        key={`${destLabel}:${idx}`}
                        as="p"
                        size="xs"
                        className="text-text-secondary"
                      >
                        <BodyText as="span" className="text-foreground font-medium">
                          {t("property_details.commute_route_to", {
                            defaultValue: "Drive to {{label}}",
                            label: destLabel,
                          })}
                        </BodyText>{" "}
                        · {timeStr}
                      </BodyText>
                    );
                  })}
                </Box>
              ) : null}
            </Box>
            <Box className="min-h-0 min-w-0">
              {listingCoords ? (
                <Box className="border-border-card-subtle bg-background-surface overflow-hidden rounded-lg border">
                  <Box className="relative aspect-[4/3] max-h-[50vh] w-full">
                    <Box ref={setMapHost} className="absolute inset-0" />
                    <Box
                      ref={setStreetViewHost}
                      className="z-dropdown absolute inset-0 h-full w-full"
                      aria-hidden
                    />
                  </Box>
                </Box>
              ) : (
                <Box className="border-border-card-subtle bg-background-surface rounded-lg border p-4">
                  <BodyText as="p" size="sm" className="text-text-secondary">
                    {t("property_details.location_unavailable")}
                  </BodyText>
                </Box>
              )}
            </Box>
          </Box>
        ) : commute ? (
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
        ) : null}
        {hasCommuteAnalysisBody && (
          <Card border="light" className="mt-4">
            <CommuteAnalysisContent data={commuteAnalysisBody} />
          </Card>
        )}
      </SectionTintWrapper>
    </Box>
  );
};
