import React, { useEffect, useMemo, useRef, useState } from "react";

import { useLocalization } from "packages/contexts";
import { PropertySectionRatingBadge } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/PropertySectionRatingBadge";
import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { PropertySectionHeader } from "packages/features/propertyDetails/components/visualizations";
import { usePropertyCommuteLocationMap } from "packages/hooks/data/property/usePropertyCommuteLocationMap";
import { log, LOG_CATEGORIES } from "packages/logger";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import {
  stripSectionRatingField,
  unwrapPropertyAnalysisSection,
} from "packages/utils/propertyDetails";
import { commuteDestinationsForMap } from "packages/utils/propertyDetails/commuteMapDestinations";
import {
  getListingCoords,
  getListingCoordsUnavailableDiagnostics,
} from "packages/utils/propertyDetails/listingCoords";

import { CommuteAnalysisContent } from "./propertyCommuteRender";

type PropertyCommuteProps = PropertyComponentProps & {
  analysisContent?: unknown;
};

export const PropertyCommute: React.FC<PropertyCommuteProps> = ({
  property,
  analysisContent,
}) => {
  const { t } = useLocalization();
  const [mapHost, setMapHost] = useState<HTMLDivElement | null>(null);
  const [streetViewHost, setStreetViewHost] = useState<HTMLDivElement | null>(
    null,
  );
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

  const commuteAnalysisFlat = unwrapPropertyAnalysisSection(
    "commute",
    analysisContent,
  );
  const hasAnalysisInput = useMemo(() => {
    if (commuteAnalysisFlat == null || commuteAnalysisFlat === "") return false;
    if (
      typeof commuteAnalysisFlat !== "object" ||
      Array.isArray(commuteAnalysisFlat)
    ) {
      return true;
    }
    return (
      Object.keys(commuteAnalysisFlat as Record<string, unknown>).length > 0
    );
  }, [commuteAnalysisFlat]);

  const hasSimple =
    commute != null &&
    (commute.commute_time != null || commute.commute_distance != null);

  const listingCoords = useMemo(() => getListingCoords(property), [property]);
  const loggedCommuteMapUnavailableKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!commute || !hasTravelTimes || listingCoords) {
      if (!commute || !hasTravelTimes) {
        loggedCommuteMapUnavailableKeyRef.current = null;
      }
      return;
    }
    const diagnostics = getListingCoordsUnavailableDiagnostics(property);
    if (!diagnostics) return;
    const listingId = typeof property.id === "string" ? property.id : undefined;
    const dedupeKey = `commute:${listingId ?? ""}:${diagnostics.reason}:${
      diagnostics.parsedLat
    }:${diagnostics.parsedLng}:${diagnostics.fields.lat}:${
      diagnostics.fields.latitude
    }:${diagnostics.fields.lng}:${diagnostics.fields.longitude}`;
    if (loggedCommuteMapUnavailableKeyRef.current === dedupeKey) return;
    loggedCommuteMapUnavailableKeyRef.current = dedupeKey;
    log.info(
      LOG_CATEGORIES.PROPERTY_DETAILS,
      "Property commute map unavailable (no listing coords)",
      {
        listingId,
        ...diagnostics,
      },
    );
  }, [commute, hasTravelTimes, listingCoords, property]);
  const commuteMapDestinations = useMemo(
    () => commuteDestinationsForMap(commute?.travel_times ?? []),
    [commute?.travel_times],
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
  });

  if (!commute && !hasAnalysisInput) return null;
  if (commute && !hasTravelTimes && !hasSimple && !hasAnalysisInput)
    return null;

  const { rest: commuteAnalysisBody, rating: commuteSectionRating } =
    stripSectionRatingField(commuteAnalysisFlat ?? null);
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
            <Box className="min-h-0 min-w-0">
              {listingCoords ? (
                <Box className="border-border-card-subtle bg-background-surface overflow-hidden rounded-lg border">
                  <Box className="relative aspect-[4/3] max-h-[50vh] w-full">
                    <Box ref={setMapHost} className="absolute inset-0" />
                    <Box
                      ref={setStreetViewHost}
                      className="absolute inset-0 z-10 h-full w-full"
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
