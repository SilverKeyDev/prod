import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Linking, StyleSheet, View } from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type Region,
} from "react-native-maps";

import { useFeature, useLocalization } from "packages/contexts";
import { color } from "packages/design-tokens";
import { PropertySectionRatingBadge } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/PropertySectionRatingBadge";
import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper.native";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { PropertySectionHeader } from "packages/features/propertyDetails/components/visualizations";
import { log, LOG_CATEGORIES } from "packages/logger";
import Button from "packages/ui/components/button/Button";
import { Box, Text } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import { buildGoogleStreetViewUrl } from "packages/utils/maps/googleMapsLinks";
import {
  getGoogleMapIdForNative,
  getUseGoogleMapsProvider,
} from "packages/utils/maps/nativeGoogleMapsCloudConfig";
import { PROPERTY_DETAILS_MAP_REGION_DELTA } from "packages/utils/maps/propertyDetailsMapRegion";
import {
  stripSectionRatingField,
  unwrapPropertyAnalysisSection,
} from "packages/utils/propertyDetails";
import {
  getListingCoords,
  getListingCoordsUnavailableDiagnostics,
} from "packages/utils/propertyDetails/listingCoords";

import { CommuteAnalysisContent } from "./propertyCommuteRender";

const SEARCH_NATIVE_GOOGLE_MAPS_FLAG = "search_native_google_maps";

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
  const [layoutSize, setLayoutSize] = useState({ width: 0, height: 0 });
  const onMapContainerLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { width, height } = e.nativeEvent.layout;
      setLayoutSize((prev) =>
        prev.width === width && prev.height === height
          ? prev
          : { width, height },
      );
    },
    [],
  );
  const hasValidSize = layoutSize.width > 0 && layoutSize.height > 0;
  const googleMapId = useMemo(() => getGoogleMapIdForNative(), []);
  const isNativeGoogleMapsEnabled = useFeature(SEARCH_NATIVE_GOOGLE_MAPS_FLAG);
  const useGoogleMapsProvider =
    isNativeGoogleMapsEnabled || getUseGoogleMapsProvider();
  const mapIdApplied = useGoogleMapsProvider && !!googleMapId;
  useEffect(() => {
    if (mapIdApplied) {
      log.info(
        LOG_CATEGORIES.PROPERTY_DETAILS,
        "Property commute native map using Cloud Map ID",
        {
          googleMapId,
        },
      );
    }
  }, [googleMapId, mapIdApplied]);
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
  const initialRegion: Region | null = useMemo(() => {
    if (!listingCoords) return null;
    return {
      latitude: listingCoords.lat,
      longitude: listingCoords.lng,
      latitudeDelta: PROPERTY_DETAILS_MAP_REGION_DELTA,
      longitudeDelta: PROPERTY_DETAILS_MAP_REGION_DELTA,
    };
  }, [listingCoords]);

  const openStreetView = useCallback(() => {
    if (!listingCoords) return;
    const url = buildGoogleStreetViewUrl(listingCoords.lat, listingCoords.lng);
    void Linking.openURL(url);
  }, [listingCoords]);

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
          <Box className="gap-4">
            {listingCoords && initialRegion ? (
              <Box className="border-border bg-background-surface overflow-hidden rounded-lg border">
                <Box className="gap-3">
                  <View onLayout={onMapContainerLayout} style={styles.mapShell}>
                    {hasValidSize ? (
                      <MapView
                        style={StyleSheet.absoluteFill}
                        initialRegion={initialRegion}
                        provider={
                          useGoogleMapsProvider ? PROVIDER_GOOGLE : undefined
                        }
                        {...(useGoogleMapsProvider && googleMapId
                          ? { googleMapId }
                          : {})}
                        showsUserLocation={false}
                        showsMyLocationButton={false}
                        showsCompass={false}
                        zoomControlEnabled={false}
                        toolbarEnabled={false}
                        rotateEnabled
                        scrollEnabled
                        pitchEnabled
                      >
                        <Marker
                          coordinate={{
                            latitude: listingCoords.lat,
                            longitude: listingCoords.lng,
                          }}
                          title={
                            typeof property.address === "string"
                              ? property.address
                              : undefined
                          }
                          pinColor={color("olive.DEFAULT")}
                        />
                      </MapView>
                    ) : null}
                  </View>
                  <Box className="px-3 pb-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={openStreetView}
                    >
                      {t("property_details.open_street_view")}
                    </Button>
                  </Box>
                </Box>
              </Box>
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

const styles = StyleSheet.create({
  mapShell: {
    width: "100%",
    height: 240,
    maxHeight: "50%",
    position: "relative",
    overflow: "hidden",
    borderRadius: 8,
    borderBottomWidth: 0,
    backgroundColor: color("neutral.50"),
  },
});
