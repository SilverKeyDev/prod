import React from "react";

import { StyleSheet } from "react-native";
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from "react-native-maps";

import { color } from "packages/design-tokens";
import { MapControlsNative } from "packages/features/search/components/map/MapControls.native";
import { useSearchPageMapContainerNative } from "packages/features/search/hooks/ui/useSearchPageMapContainerNative";
import { getMatchScore, type SearchResult } from "packages/features/search/types";
import { Loading } from "packages/ui/components/asset/loading/Loading";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import { getNativeMapPinColorHex } from "packages/utils/format/mapMatchPinColors";
import { getIsochroneUnionFillNativeRgba } from "packages/utils/maps/isochroneUnionStyle";

import { searchPageMapContainerNativeStyles as styles } from "./searchPageMapContainerNative.styles";

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
  properties: SearchResult[];
  onMarkerSelect?: (index: number) => void;
  isochroneData?: unknown;
  showCommuteOverlay?: boolean;
};

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
  onMarkerSelect,
  isochroneData,
  showCommuteOverlay = true,
}: SearchPageMapContainerNativeProps): React.ReactElement {
  const {
    mapRef,
    googleMapId,
    useGoogleMapsProvider,
    onMapContainerLayout,
    hasValidSize,
    propertiesWithCoords,
    isochronePolygons,
    importantWaypoints,
    zoomIn,
    zoomOut,
    focusedIds,
    handleMarkerPress,
    handleRegionChangeComplete,
    polygonIndividualZ,
    polygonUnionZ,
    waypointZ,
    homeMarkerZ,
  } = useSearchPageMapContainerNative({
    properties,
    page,
    perPage,
    isochroneData,
    showCommuteOverlay,
    onMarkerSelect,
    onZoomIn,
    onZoomOut,
  });

  return (
    <Box style={styles.container}>
      {isLoading && (
        <Box style={styles.loadingOverlay}>
          <Loading />
          <Text className="text-text-secondary mt-3 text-sm">{loadingMessage}</Text>
        </Box>
      )}
      <Box style={styles.map} onLayout={onMapContainerLayout}>
        {hasValidSize ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={DEFAULT_REGION}
            provider={useGoogleMapsProvider ? PROVIDER_GOOGLE : undefined}
            {...(useGoogleMapsProvider && googleMapId ? { googleMapId } : {})}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={false}
            zoomControlEnabled={false}
            toolbarEnabled={false}
            onRegionChangeComplete={handleRegionChangeComplete}
          >
            {showCommuteOverlay
              ? isochronePolygons.individuals.map((coords, idx) => (
                  <Polygon
                    key={`isochrone-individual-${idx}`}
                    coordinates={coords}
                    strokeColor={color("brown.DEFAULT")}
                    strokeWidth={1}
                    fillColor="transparent"
                    zIndex={polygonIndividualZ}
                  />
                ))
              : null}
            {showCommuteOverlay && isochronePolygons.main ? (
              <Polygon
                key="isochrone-main"
                coordinates={isochronePolygons.main}
                strokeColor={color("olive.DEFAULT")}
                strokeWidth={2}
                fillColor={getIsochroneUnionFillNativeRgba()}
                zIndex={polygonUnionZ}
              />
            ) : null}
            {importantWaypoints.map((wp) => (
              <Marker
                key={`important-waypoint-${wp.address}`}
                coordinate={{ latitude: wp.lat, longitude: wp.lng }}
                title={wp.address}
                pinColor={color("brown.DEFAULT")}
                zIndex={waypointZ}
              />
            ))}
            {propertiesWithCoords.map((property) => (
              <Marker
                key={property.id}
                coordinate={{ latitude: property.lat, longitude: property.lng }}
                title={property.address}
                pinColor={getNativeMapPinColorHex({
                  isFocused: focusedIds.has(property.id),
                  score: getMatchScore(property),
                  focusedColor: color("olive.DEFAULT"),
                  fallbackUnfocusedColor: color("neutral.500"),
                })}
                zIndex={homeMarkerZ}
                onPress={() => handleMarkerPress(property.id)}
              />
            ))}
          </MapView>
        ) : null}
      </Box>
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
    </Box>
  );
}
