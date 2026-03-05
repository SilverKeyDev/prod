import React, { useCallback, useEffect, useMemo, useRef } from "react";

import { StyleSheet, View } from "react-native";
import MapView, { type MapView as MapViewType, Marker, PROVIDER_GOOGLE } from "react-native-maps";

import { env } from "packages/config";
import { color } from "packages/design-tokens";
import { MapControlsNative } from "packages/features/search/components/map/MapControls.native";
import type { SearchResult } from "packages/features/search/types";
import { Loading } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives/text";

const PROPERTIES_PER_PAGE = 1;
const DEFAULT_REGION = {
  latitude: 39.8283,
  longitude: -98.5795,
  latitudeDelta: 30,
  longitudeDelta: 30,
};

export type SearchPageMapContainerNativeProps = {
  isLoading: boolean;
  loadingMessage: string;
  page: number;
  total: number;
  perPage: number;
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  disabled: boolean;
  isSearching: boolean;
  /** Properties to show as markers (results or saved by tab) */
  properties: SearchResult[];
  /** Index of the focused property (drives which marker to highlight and center) */
  focusedIndex: number;
  /** Called when user selects a marker to sync currentPage */
  onMarkerSelect?: (index: number) => void;
};

function hasValidCoordinates(p: SearchResult): boolean {
  return (
    typeof p.lat === "number" &&
    typeof p.lng === "number" &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng)
  );
}

export function SearchPageMapContainerNative({
  isLoading,
  loadingMessage,
  page,
  total,
  perPage = PROPERTIES_PER_PAGE,
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
  disabled,
  isSearching,
  properties,
  focusedIndex,
  onMarkerSelect,
}: SearchPageMapContainerNativeProps): React.ReactElement {
  const mapRef = useRef<MapViewType>(null);

  const propertiesWithCoords = useMemo(() => properties.filter(hasValidCoordinates), [properties]);

  const fitToMarkers = useCallback(() => {
    if (propertiesWithCoords.length === 0 || !mapRef.current) return;
    mapRef.current.fitToCoordinates(
      propertiesWithCoords.map((p) => ({ latitude: p.lat, longitude: p.lng })),
      { edgePadding: { top: 48, right: 48, bottom: 48, left: 48 }, animated: true }
    );
  }, [propertiesWithCoords]);

  useEffect(() => {
    if (propertiesWithCoords.length > 0) {
      fitToMarkers();
    }
  }, [propertiesWithCoords.length, fitToMarkers]);

  const focusOnFocusedMarker = useCallback(() => {
    const focused = propertiesWithCoords[focusedIndex];
    if (!focused || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: focused.lat,
        longitude: focused.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      300
    );
  }, [propertiesWithCoords, focusedIndex]);

  useEffect(() => {
    if (
      propertiesWithCoords.length > 0 &&
      focusedIndex >= 0 &&
      focusedIndex < propertiesWithCoords.length
    ) {
      focusOnFocusedMarker();
    }
  }, [focusedIndex, propertiesWithCoords, focusOnFocusedMarker]);

  const zoomIn = useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.getCamera().then((camera) => {
      if (!mapRef.current || !camera) return;
      mapRef.current.setCamera({
        ...camera,
        zoom: (camera.zoom ?? 10) + 1,
      });
    });
    onZoomIn();
  }, [onZoomIn]);

  const zoomOut = useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.getCamera().then((camera) => {
      if (!mapRef.current || !camera) return;
      mapRef.current.setCamera({
        ...camera,
        zoom: Math.max(1, (camera.zoom ?? 10) - 1),
      });
    });
    onZoomOut();
  }, [onZoomOut]);

  const indexByPropertyId = useMemo(() => {
    const map = new Map<string, number>();
    propertiesWithCoords.forEach((p, i) => map.set(p.id, i));
    return map;
  }, [propertiesWithCoords]);

  const handleMarkerPress = useCallback(
    (propertyId: string) => {
      const index = indexByPropertyId.get(propertyId);
      if (index !== undefined && onMarkerSelect) {
        onMarkerSelect(index);
      }
    },
    [indexByPropertyId, onMarkerSelect]
  );

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Loading />
          <Text className="mt-3 text-sm text-gray-600">{loadingMessage}</Text>
        </View>
      )}
      {/* Styling parity with web: use Google Maps provider + Cloud Map ID (VITE_GOOGLE_MAPS_ID / EXPO_PUBLIC_GOOGLE_MAPS_ID). Web: mapInstanceManager.ts + scriptLoader mapId; UI hidden via maps.css. */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        provider={PROVIDER_GOOGLE}
        googleMapId={env.googleMapsId}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        zoomControlEnabled={false}
        toolbarEnabled={false}
      >
        {propertiesWithCoords.map((property, index) => (
          <Marker
            key={property.id}
            coordinate={{ latitude: property.lat, longitude: property.lng }}
            title={property.address}
            pinColor={index === focusedIndex ? color("olive.DEFAULT") : color("neutral.500")}
            onPress={() => handleMarkerPress(property.id)}
          />
        ))}
      </MapView>
      {!isSearching && (
        <MapControlsNative
          page={page}
          total={total}
          perPage={perPage}
          onPrev={onPrev}
          onNext={onNext}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          disabled={disabled}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderRadius: 16,
  },
});
