import React, { useCallback, useState } from "react";

import { Linking, StyleSheet, View } from "react-native";
import MapView, {
  Marker,
  Polygon,
  Polyline,
  PROVIDER_GOOGLE,
  type Region,
} from "react-native-maps";

import { color } from "packages/design-tokens";
import { useFeature } from "packages/hooks/store/featureFlags/useFeature";
import { log } from "packages/logger";
import { Button } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import { getIsochroneUnionFillNativeRgba } from "packages/utils/product/maps/isochrone/isochroneUnionStyle";
import { buildGoogleStreetViewUrl } from "packages/utils/product/maps/links/googleMapsLinks";
import {
  getGoogleMapIdForNative,
  getUseGoogleMapsProvider,
} from "packages/utils/product/maps/native/nativeGoogleMapsCloudConfig";
import {
  COMMUTE_NATIVE_POLYGON_INDIVIDUAL_Z,
  COMMUTE_NATIVE_POLYGON_UNION_Z,
} from "packages/utils/product/maps/native/propertyCommuteNative.constants";
import type {
  IsochronePolygonsNative,
  NativeDestinationMarker,
  NativeRouteOverlay,
} from "packages/utils/product/maps/native/propertyCommuteNative.types";

const SEARCH_NATIVE_GOOGLE_MAPS_FLAG = "search_native_google_maps";

type PropertyCommuteNativeMapProps = {
  initialRegion: Region;
  listingLat: number;
  listingLng: number;
  listingTitle: string | undefined;
  nativeRouteOverlays: NativeRouteOverlay[];
  destinationMarkers: NativeDestinationMarker[];
  isochronePolygons: IsochronePolygonsNative;
  openStreetViewLabel: string;
};

const mapShellStyle = StyleSheet.create({
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

export function PropertyCommuteNativeMap({
  initialRegion,
  listingLat,
  listingLng,
  listingTitle,
  nativeRouteOverlays,
  destinationMarkers,
  isochronePolygons,
  openStreetViewLabel,
}: PropertyCommuteNativeMapProps): React.ReactElement {
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
  const googleMapId = React.useMemo(() => getGoogleMapIdForNative(), []);
  const isNativeGoogleMapsEnabled = useFeature(SEARCH_NATIVE_GOOGLE_MAPS_FLAG);
  const useGoogleMapsProvider = isNativeGoogleMapsEnabled || getUseGoogleMapsProvider();
  const mapIdApplied = useGoogleMapsProvider && !!googleMapId;

  React.useEffect(() => {
    if (mapIdApplied) {
      log.info("PROPERTY_DETAILS", "Property commute native map using Cloud Map ID", {
        googleMapId,
      });
    }
  }, [googleMapId, mapIdApplied]);

  const openStreetView = useCallback(() => {
    const url = buildGoogleStreetViewUrl(listingLat, listingLng);
    void Linking.openURL(url);
  }, [listingLat, listingLng]);

  return (
    <Box className="border-border bg-background-surface overflow-hidden rounded-lg border">
      <Box className="gap-3">
        <View onLayout={onMapContainerLayout} style={mapShellStyle.mapShell}>
          {hasValidSize ? (
            <MapView
              style={StyleSheet.absoluteFill}
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
              {isochronePolygons.individuals.map((coords, idx) => (
                <Polygon
                  key={`pd-isochrone-ind-${idx}`}
                  coordinates={coords}
                  strokeColor={color("brown.DEFAULT")}
                  strokeWidth={1.5}
                  fillColor="transparent"
                  zIndex={COMMUTE_NATIVE_POLYGON_INDIVIDUAL_Z}
                />
              ))}
              {isochronePolygons.main ? (
                <Polygon
                  key="pd-isochrone-main"
                  coordinates={isochronePolygons.main}
                  strokeColor={color("olive.DEFAULT")}
                  strokeWidth={2.5}
                  fillColor={getIsochroneUnionFillNativeRgba()}
                  zIndex={COMMUTE_NATIVE_POLYGON_UNION_Z}
                />
              ) : null}
              {nativeRouteOverlays.map((line) => (
                <Polyline
                  key={line.key}
                  coordinates={line.coordinates}
                  strokeColor={line.color}
                  strokeWidth={4}
                />
              ))}
              <Marker
                coordinate={{ latitude: listingLat, longitude: listingLng }}
                title={listingTitle}
                pinColor={color("olive.DEFAULT")}
              />
              {destinationMarkers.map((dm) => (
                <Marker
                  key={dm.key}
                  coordinate={{
                    latitude: dm.latitude,
                    longitude: dm.longitude,
                  }}
                  title={dm.title}
                  pinColor={color("brown.DEFAULT")}
                />
              ))}
            </MapView>
          ) : null}
        </View>
        <Box className="px-3 pb-3">
          <Button variant="outline" size="sm" onPress={openStreetView}>
            {openStreetViewLabel}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
