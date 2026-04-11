import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { StyleSheet } from "react-native";
import MapView, {
  type MapView as MapViewType,
  Marker,
  Polygon,
  PROVIDER_GOOGLE,
  type Region,
} from "react-native-maps";

import { useFeature } from "packages/contexts";
import { color } from "packages/design-tokens";
import { MapControlsNative } from "packages/features/search/components/map/MapControls.native";
import type { SearchResult } from "packages/features/search/types";
import type { IsochroneData } from "packages/features/search/types/isochrone";
import {
  searchMapOverlayBaseZIndex,
  searchMapPolygonIndividualZIndex,
  searchMapPolygonUnionZIndex,
} from "packages/features/search/types/search/mapOverlayLayerOrder";
import { importantWaypointsFromIsochrone } from "packages/features/search/utils/importantWaypointsFromIsochrone";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useFiltersStore } from "packages/store";
import { Loading } from "packages/ui/components/asset/loading/Loading";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import { getNativeMapPinColorHex } from "packages/utils/format/listingStatusMapPinColors";
import {
  getGoogleMapIdForNative,
  getUseGoogleMapsProvider,
} from "packages/utils/maps/nativeGoogleMapsCloudConfig";

const PROPERTIES_PER_PAGE = 1;

const SEARCH_NATIVE_POLYGON_INDIVIDUAL_Z = searchMapPolygonIndividualZIndex();
const SEARCH_NATIVE_POLYGON_UNION_Z = searchMapPolygonUnionZIndex();
const SEARCH_NATIVE_WAYPOINT_Z = searchMapOverlayBaseZIndex("waypoints");
const SEARCH_NATIVE_HOME_MARKER_Z = searchMapOverlayBaseZIndex("homeMarkers");

const DEFAULT_REGION = {
  latitude: 39.8283,
  longitude: -98.5795,
  latitudeDelta: 30,
  longitudeDelta: 30,
};

const SEARCH_NATIVE_GOOGLE_MAPS_FLAG = "search_native_google_maps";

type LatLng = { latitude: number; longitude: number };

/**
 * Convert GeoJSON ring ([lng, lat][] or number[][]) to react-native-maps coordinates.
 */
function geoJsonRingToCoordinates(ring: number[][]): LatLng[] {
  return ring.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
}

/**
 * Parse isochrone API response into polygon coordinate arrays for native map.
 * Returns { main: LatLng[] | null, individuals: LatLng[][] }.
 */
function parseIsochroneForNativeMap(isochroneData: unknown): {
  main: LatLng[] | null;
  individuals: LatLng[][];
} {
  const raw = isochroneData as {
    isochrone?: {
      geometry?: { type?: string; coordinates?: number[][][] | number[][][][] };
    };
    individual_isochrones?: Array<{
      isochrone?: {
        geometry?: {
          type?: string;
          coordinates?: number[][][] | number[][][][];
        };
      };
    }>;
  };
  const individuals: LatLng[][] = [];
  if (raw.individual_isochrones && Array.isArray(raw.individual_isochrones)) {
    for (const item of raw.individual_isochrones) {
      const geom = item.isochrone?.geometry;
      if (!geom?.coordinates || !geom?.type) continue;
      let coords: number[][][];
      if (geom.type === "Polygon") {
        coords = geom.coordinates as number[][][];
      } else if (geom.type === "MultiPolygon") {
        coords = (geom.coordinates as number[][][][])[0] ?? [];
      } else {
        continue;
      }
      const outer = coords[0];
      if (outer?.length) {
        individuals.push(geoJsonRingToCoordinates(outer));
      }
    }
  }
  let main: LatLng[] | null = null;
  if (raw.isochrone?.geometry?.coordinates) {
    const geom = raw.isochrone.geometry;
    if (!geom?.type) {
      return { main: null, individuals };
    }
    let coords: number[][][];
    if (geom.type === "Polygon") {
      coords = geom.coordinates as number[][][];
    } else if (geom.type === "MultiPolygon") {
      coords = (geom.coordinates as number[][][][])[0] ?? [];
    } else {
      return { main: null, individuals };
    }
    const outer = coords[0];
    if (outer?.length) {
      main = geoJsonRingToCoordinates(outer);
    }
  }
  return { main, individuals };
}

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
  /** Called when user selects a marker to sync currentPage */
  onMarkerSelect?: (index: number) => void;
  /** Isochrone polygon data from search API (same shape as web) – rendered as overlay */
  isochroneData?: unknown;
  /** When false, isochrone polygons are not drawn (viewport search / user preference). */
  showCommuteOverlay?: boolean;
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
  onMarkerSelect,
  isochroneData,
  showCommuteOverlay = true,
}: SearchPageMapContainerNativeProps): React.ReactElement {
  const mapRef = useRef<MapViewType>(null);
  const setLastMapRegion = useFiltersStore((s) => s.setLastMapRegion);
  const googleMapId = useMemo(() => getGoogleMapIdForNative(), []);
  const [layoutSize, setLayoutSize] = useState({ width: 0, height: 0 });
  const isNativeGoogleMapsEnabled = useFeature(SEARCH_NATIVE_GOOGLE_MAPS_FLAG);
  const useGoogleMapsProvider =
    isNativeGoogleMapsEnabled || getUseGoogleMapsProvider();
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

  const mapIdApplied = useGoogleMapsProvider && !!googleMapId;
  useEffect(() => {
    if (mapIdApplied) {
      log.info(
        LOG_CATEGORIES.MAP_RENDERING,
        "Applying Cloud Map ID to native MapView (Google provider)",
        {
          googleMapId,
        },
      );
    } else {
      log.info(
        LOG_CATEGORIES.MAP_RENDERING,
        "Native map not using Cloud Map ID",
        {
          reason: !useGoogleMapsProvider
            ? "Apple Maps (simulator or non-Google)"
            : "no map ID configured",
        },
      );
    }
  }, [googleMapId, mapIdApplied, useGoogleMapsProvider]);

  const propertiesWithCoords = useMemo(
    () => properties.filter(hasValidCoordinates),
    [properties],
  );

  const isochronePolygons = useMemo(() => {
    if (!isochroneData) return { main: null, individuals: [] as LatLng[][] };
    try {
      return parseIsochroneForNativeMap(isochroneData);
    } catch (e) {
      log.warn(
        LOG_CATEGORIES.MAP_RENDERING,
        "Failed to parse isochrone for native map",
        e,
      );
      return { main: null, individuals: [] as LatLng[][] };
    }
  }, [isochroneData]);

  const importantWaypoints = useMemo(() => {
    if (
      !showCommuteOverlay ||
      !isochroneData ||
      typeof isochroneData !== "object"
    ) {
      return [];
    }
    try {
      return importantWaypointsFromIsochrone(isochroneData as IsochroneData);
    } catch (e) {
      log.warn(
        LOG_CATEGORIES.MAP_RENDERING,
        "Failed to parse important waypoints for native map",
        e,
      );
      return [];
    }
  }, [isochroneData, showCommuteOverlay]);

  const fitToMarkers = useCallback(() => {
    if (propertiesWithCoords.length === 0 || !mapRef.current) return;
    mapRef.current.fitToCoordinates(
      propertiesWithCoords.map((p) => ({ latitude: p.lat, longitude: p.lng })),
      {
        edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
        animated: true,
      },
    );
  }, [propertiesWithCoords]);

  useEffect(() => {
    if (propertiesWithCoords.length > 0) {
      fitToMarkers();
    }
  }, [propertiesWithCoords.length, fitToMarkers]);

  const leaderProperty = useMemo(() => {
    if (properties.length === 0) return null;
    const idx = Math.min(page, Math.max(0, properties.length - 1));
    const p = properties[idx];
    return p && hasValidCoordinates(p) ? p : null;
  }, [properties, page]);

  const focusOnFocusedMarker = useCallback(() => {
    if (!leaderProperty || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: leaderProperty.lat,
        longitude: leaderProperty.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      300,
    );
  }, [leaderProperty]);

  useEffect(() => {
    if (leaderProperty) {
      focusOnFocusedMarker();
    }
  }, [leaderProperty, focusOnFocusedMarker]);

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
    properties.forEach((p, i) => map.set(p.id, i));
    return map;
  }, [properties]);

  const focusedIds = useMemo(() => {
    const slice = properties.slice(page, page + perPage);
    return new Set(slice.map((p) => p.id));
  }, [properties, page, perPage]);

  const handleMarkerPress = useCallback(
    (propertyId: string) => {
      const index = indexByPropertyId.get(propertyId);
      if (index !== undefined && onMarkerSelect) {
        onMarkerSelect(index);
      }
    },
    [indexByPropertyId, onMarkerSelect],
  );

  const handleRegionChangeComplete = useCallback(
    (r: Region) => {
      setLastMapRegion({
        latitude: r.latitude,
        longitude: r.longitude,
        latitudeDelta: r.latitudeDelta,
        longitudeDelta: r.longitudeDelta,
      });
    },
    [setLastMapRegion],
  );

  return (
    <Box style={styles.container}>
      {isLoading && (
        <Box style={styles.loadingOverlay}>
          <Loading />
          <Text className="text-text-secondary mt-3 text-sm">
            {loadingMessage}
          </Text>
        </Box>
      )}
      {/* Measure before rendering MapView to avoid CAMetalLayer setDrawableSize 0x0 (GeoServices / blank map). */}
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
                    zIndex={SEARCH_NATIVE_POLYGON_INDIVIDUAL_Z}
                  />
                ))
              : null}
            {showCommuteOverlay && isochronePolygons.main ? (
              <Polygon
                key="isochrone-main"
                coordinates={isochronePolygons.main}
                strokeColor={color("olive.DEFAULT")}
                strokeWidth={2}
                fillColor="rgba(163, 177, 138, 0.15)"
                zIndex={SEARCH_NATIVE_POLYGON_UNION_Z}
              />
            ) : null}
            {importantWaypoints.map((wp) => (
              <Marker
                key={`important-waypoint-${wp.address}`}
                coordinate={{ latitude: wp.lat, longitude: wp.lng }}
                title={wp.address}
                pinColor={color("brown.DEFAULT")}
                zIndex={SEARCH_NATIVE_WAYPOINT_Z}
              />
            ))}
            {propertiesWithCoords.map((property) => (
              <Marker
                key={property.id}
                coordinate={{ latitude: property.lat, longitude: property.lng }}
                title={property.address}
                pinColor={getNativeMapPinColorHex({
                  isFocused: focusedIds.has(property.id),
                  listingStatus: property.listingStatus,
                  homeStatus: property.homeStatus,
                  focusedColor: color("olive.DEFAULT"),
                  activeUnfocusedColor: color("neutral.500"),
                })}
                zIndex={SEARCH_NATIVE_HOME_MARKER_Z}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
  },
  map: {
    flex: 1,
    width: "100%",
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
