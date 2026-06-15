import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Linking, StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from "react-native-maps";

import { useFeature, useLocalization } from "packages/contexts";
import { color } from "packages/design-tokens";
import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { PropertySectionHeader } from "packages/features/propertyDetails/components/visualizations";
import { log } from "packages/logger";
import { Button } from "packages/ui";
import { Box, Loading } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import { buildGoogleStreetViewUrl } from "packages/utils/product/maps/links/googleMapsLinks";
import {
  getGoogleMapIdForNative,
  getUseGoogleMapsProvider,
} from "packages/utils/product/maps/native/nativeGoogleMapsCloudConfig";
import { PROPERTY_DETAILS_MAP_REGION_DELTA } from "packages/utils/product/maps/native/propertyDetailsMapRegion";
import {
  getListingCoords,
  getListingCoordsUnavailableDiagnostics,
} from "packages/utils/transaction/propertyDetails/location/listingCoords";

import { PropertyDetailsMapOverlayControls } from "./PropertyDetailsMapOverlayControls.native";

const SEARCH_NATIVE_GOOGLE_MAPS_FLAG = "search_native_google_maps";

function buildGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}&ll=${lat},${lng}&z=19`;
}

export type PropertyLocationMapSectionProps = PropertyComponentProps & {
  isLoading?: boolean;
};

export function PropertyLocationMapSection({
  property,
  isLoading = false,
}: PropertyLocationMapSectionProps): React.ReactElement {
  const { t } = useLocalization();
  const coords = getListingCoords(property);
  const enabled = coords != null;
  const [satelliteMode, setSatelliteMode] = useState(false);
  const listingId = typeof property.id === "string" ? property.id : undefined;
  const loggedLocationUnavailableKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setSatelliteMode(false);
  }, [listingId]);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (enabled) {
      loggedLocationUnavailableKeyRef.current = null;
      return;
    }
    const diagnostics = getListingCoordsUnavailableDiagnostics(property);
    if (!diagnostics) return;
    const dedupeKey = `${listingId ?? ""}:${diagnostics.reason}:${
      diagnostics.parsedLat
    }:${diagnostics.parsedLng}:${diagnostics.fields.lat}:${
      diagnostics.fields.latitude
    }:${diagnostics.fields.lng}:${diagnostics.fields.longitude}`;
    if (loggedLocationUnavailableKeyRef.current === dedupeKey) return;
    loggedLocationUnavailableKeyRef.current = dedupeKey;
    log.info("PROPERTY_DETAILS", "Property location map unavailable", {
      listingId,
      ...diagnostics,
    });
  }, [enabled, isLoading, listingId, property]);

  const googleMapId = useMemo(() => getGoogleMapIdForNative(), []);
  const isNativeGoogleMapsEnabled = useFeature(SEARCH_NATIVE_GOOGLE_MAPS_FLAG);
  const useGoogleMapsProvider = isNativeGoogleMapsEnabled || getUseGoogleMapsProvider();
  const [layoutSize, setLayoutSize] = useState({ width: 0, height: 0 });
  const onMapContainerLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { width, height } = e.nativeEvent.layout;
      setLayoutSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height }
      );
    },
    []
  );
  const hasValidSize = layoutSize.width > 0 && layoutSize.height > 0;

  const initialRegion: Region | null = useMemo(() => {
    if (!coords) return null;
    return {
      latitude: coords.lat,
      longitude: coords.lng,
      latitudeDelta: PROPERTY_DETAILS_MAP_REGION_DELTA,
      longitudeDelta: PROPERTY_DETAILS_MAP_REGION_DELTA,
    };
  }, [coords]);

  const mapIdApplied = useGoogleMapsProvider && !!googleMapId;
  useEffect(() => {
    if (mapIdApplied) {
      log.info("PROPERTY_DETAILS", "Property details native map using Cloud Map ID", {
        googleMapId,
      });
    }
  }, [googleMapId, mapIdApplied]);

  const title = t("property_details.location_map_heading");
  const subtitle = t("property_details.location_map_subtitle");

  const openInFullScreen = useCallback(() => {
    if (!coords) return;
    const url = buildGoogleMapsUrl(coords.lat, coords.lng);
    void Linking.openURL(url);
  }, [coords]);

  const showRoadMap = useCallback(() => {
    setSatelliteMode(false);
  }, []);

  const showSatellite = useCallback(() => {
    setSatelliteMode(true);
  }, []);

  const openStreetView = useCallback(() => {
    if (!coords) return;
    void Linking.openURL(buildGoogleStreetViewUrl(coords.lat, coords.lng));
  }, [coords]);

  useEffect(() => {
    if (!enabled || !initialRegion) {
      return;
    }
    log.debug("PROPERTY_DETAILS", "PropertyDetailsMapSection native map shell", {
      listingId,
      layoutWidth: layoutSize.width,
      layoutHeight: layoutSize.height,
      hasValidSize,
      useGoogleMapsProvider,
      googleMapIdPresent: Boolean(googleMapId),
      coords: coords ? { lat: coords.lat, lng: coords.lng } : null,
      satelliteMode,
    });
  }, [
    coords,
    enabled,
    googleMapId,
    hasValidSize,
    initialRegion,
    layoutSize.height,
    layoutSize.width,
    listingId,
    satelliteMode,
    useGoogleMapsProvider,
  ]);

  return (
    <Box className="p-6">
      <PropertySectionHeader
        iconName="map-pin"
        title={title}
        subtitle={subtitle}
        className="!mb-4"
      />
      <SectionTintWrapper className="mt-2">
        {isLoading && !enabled ? (
          <Box className="flex min-h-52 items-center justify-center py-8">
            <Loading />
          </Box>
        ) : !enabled || !initialRegion ? (
          <BodyText as="p" size="sm" className="text-text-secondary">
            {t("property_details.location_unavailable")}
          </BodyText>
        ) : (
          <Box className="gap-3">
            <View onLayout={onMapContainerLayout} style={mapShellStyle.mapShell}>
              {hasValidSize ? (
                <>
                  <MapView
                    style={StyleSheet.absoluteFill}
                    mapType={satelliteMode ? "hybrid" : "standard"}
                    initialRegion={initialRegion}
                    provider={useGoogleMapsProvider ? PROVIDER_GOOGLE : undefined}
                    {...(useGoogleMapsProvider && googleMapId ? { googleMapId } : {})}
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
                        latitude: coords.lat,
                        longitude: coords.lng,
                      }}
                      title={typeof property.address === "string" ? property.address : undefined}
                      pinColor={color("olive.DEFAULT")}
                    />
                  </MapView>
                  <PropertyDetailsMapOverlayControls
                    satelliteMode={satelliteMode}
                    onRoadMap={showRoadMap}
                    onSatellite={showSatellite}
                    onStreetView={openStreetView}
                  />
                </>
              ) : null}
            </View>
            <Button variant="outline" size="sm" onPress={openInFullScreen}>
              {t("property_details.open_in_full_screen")}
            </Button>
          </Box>
        )}
      </SectionTintWrapper>
    </Box>
  );
}

const mapShellStyle = StyleSheet.create({
  mapShell: {
    width: "100%",
    height: 240,
    maxHeight: "50%",
    position: "relative",
    overflow: "hidden",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color("neutral.200"),
    backgroundColor: color("neutral.50"),
  },
});
