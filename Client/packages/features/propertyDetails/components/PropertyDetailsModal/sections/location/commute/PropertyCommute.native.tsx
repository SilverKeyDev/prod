import React, { useMemo } from "react";

import type { Region } from "react-native-maps";

import { useLocalization } from "packages/contexts";
import { PropertySectionRatingBadge } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/PropertySectionRatingBadge";
import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper.native";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { PropertySectionHeader } from "packages/features/propertyDetails/components/visualizations";
import { usePropertyCommuteMapUnavailableLog } from "packages/hooks/data/property/usePropertyCommuteMapUnavailableLog";
import { usePropertyCommuteNativeOverlays } from "packages/hooks/data/property/usePropertyCommuteNativeOverlays";
import { Box, Text } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import { PROPERTY_DETAILS_MAP_REGION_DELTA } from "packages/utils/maps/propertyDetailsMapRegion";
import {
  stripSectionRatingField,
  unwrapPropertyAnalysisSection,
} from "packages/utils/propertyDetails";
import { getListingCoords } from "packages/utils/propertyDetails/location/listingCoords";

import { PropertyCommuteMapLegendNative } from "./PropertyCommuteMapLegend.native";
import { PropertyCommuteNativeMap } from "./PropertyCommuteNativeMap";
import { CommuteAnalysisContent } from "./propertyCommuteRender";

type TravelTimeItem = {
  location_name?: string;
  name?: string;
  label?: string;
  location_address?: string;
  address?: string;
  travel_time?: string | number;
  commute_tolerance?: number;
  encoded_polyline?: string | null;
};

type PropertyCommuteProps = PropertyComponentProps & {
  analysisContent?: unknown;
};

export const PropertyCommute: React.FC<PropertyCommuteProps> = ({
  property,
  analysisContent,
  commuteSearchOverlay = null,
}) => {
  const { t } = useLocalization();
  const commute = (property as unknown as { commute_data?: unknown }).commute_data as
    | {
        map_url?: string;
        travel_times?: TravelTimeItem[];
        commute_time?: string | number;
        commute_distance?: string | number;
      }
    | undefined;

  const hasTravelTimes =
    commute != null && Array.isArray(commute.travel_times) && commute.travel_times.length > 0;

  const { nativeRouteOverlays, destinationMarkers, isochronePolygons } =
    usePropertyCommuteNativeOverlays({
      travelTimes: commute?.travel_times,
      commuteSearchOverlay,
    });

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

  const initialRegion: Region | null = useMemo(() => {
    if (!listingCoords) return null;
    return {
      latitude: listingCoords.lat,
      longitude: listingCoords.lng,
      latitudeDelta: PROPERTY_DETAILS_MAP_REGION_DELTA,
      longitudeDelta: PROPERTY_DETAILS_MAP_REGION_DELTA,
    };
  }, [listingCoords]);

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

  const listingTitle = typeof property.address === "string" ? property.address : undefined;

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
          <Box className="gap-4">
            <PropertyCommuteMapLegendNative
              commuteSearchOverlay={commuteSearchOverlay}
              travelTimes={commute.travel_times}
            />
            {listingCoords && initialRegion ? (
              <PropertyCommuteNativeMap
                initialRegion={initialRegion}
                listingLat={listingCoords.lat}
                listingLng={listingCoords.lng}
                listingTitle={listingTitle}
                nativeRouteOverlays={nativeRouteOverlays}
                destinationMarkers={destinationMarkers}
                isochronePolygons={isochronePolygons}
                openStreetViewLabel={t("property_details.open_street_view")}
              />
            ) : (
              <Box className="border-border bg-background-surface rounded-lg border p-4">
                <BodyText as="p" size="sm" className="text-text-secondary">
                  {t("property_details.location_unavailable")}
                </BodyText>
              </Box>
            )}
          </Box>
        ) : commute ? (
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
        ) : null}
        {hasCommuteAnalysisBody && (
          <Box className="border-border bg-background-surface mt-4 rounded-lg border p-4">
            <CommuteAnalysisContent data={commuteAnalysisBody} />
          </Box>
        )}
      </SectionTintWrapper>
    </Box>
  );
};
