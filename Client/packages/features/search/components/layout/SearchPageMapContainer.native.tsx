import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Constants from "expo-constants";
import { Platform, StyleSheet, View } from "react-native";
import MapView, {
  type MapView as MapViewType,
  Marker,
  Polygon,
  PROVIDER_GOOGLE,
} from "react-native-maps";

import { env, getEnv } from "packages/config";
import { useFeature } from "packages/contexts";
import { color } from "packages/design-tokens";
import { MapControlsNative } from "packages/features/search/components/map/MapControls.native";
import type { SearchResult } from "packages/features/search/types";
import { log, LOG_CATEGORIES } from "packages/logger";
import { Loading } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";

const PROPERTIES_PER_PAGE = 1;
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
    isochrone?: { geometry?: { type?: string; coordinates?: number[][][] | number[][][][] } };
    individual_isochrones?: Array<{
      isochrone?: { geometry?: { type?: string; coordinates?: number[][][] | number[][][][] } };
    }>;
  };
  const individuals: LatLng[][] = [];
  if (raw.individual_isochrones && Array.isArray(raw.individual_isochrones)) {
    for (const item of raw.individual_isochrones) {
      const geom = item.isochrone?.geometry;
      if (!geom?.coordinates) continue;
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

/**
 * Resolve Google Cloud Map ID for native maps using config-backed env access.
 * On iOS, EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS is preferred (GMSMapID). Falls back to
 * EXPO_PUBLIC_GOOGLE_MAPS_ID, VITE_GOOGLE_MAPS_ID, or env.googleMapsId.
 */
function getGoogleMapIdForNative(): string {
  const envCfg = getEnv();
  const isIOS = Platform.OS.toLowerCase().startsWith("ios");
  const fromIos = isIOS ? String(envCfg.getRaw("EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS") ?? "").trim() : "";
  const fromExpo = String(envCfg.getRaw("EXPO_PUBLIC_GOOGLE_MAPS_ID") ?? "").trim();
  const fromVite = String(envCfg.getRaw("VITE_GOOGLE_MAPS_ID") ?? "").trim();
  const fromEnv = (env.googleMapsId ?? "").trim();
  const mapId = (fromIos || fromExpo || fromVite || fromEnv || "").trim();

  if (!mapId) {
    log.warn(
      LOG_CATEGORIES.MAP_RENDERING,
      "Google Cloud Map ID not set (EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS on iOS, or EXPO_PUBLIC_GOOGLE_MAPS_ID / VITE_GOOGLE_MAPS_ID) - map will use default styling"
    );
    return mapId;
  }

  const source = fromIos
    ? "EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS"
    : fromExpo
      ? "EXPO_PUBLIC_GOOGLE_MAPS_ID"
      : fromVite
        ? "VITE_GOOGLE_MAPS_ID"
        : "env.googleMapsId";

  log.info(LOG_CATEGORIES.MAP_RENDERING, "Native map ID resolved for Cloud styling", {
    mapId,
    source,
    platform: Platform.OS,
  });

  return mapId;
}

/**
 * Prefer Google Maps when configured. On Android we always use Google.
 * On iOS: use Google on real devices. When Constants.isDevice is undefined we
 * treat as device (use Google). On Simulator (isDevice === false) we use Apple
 * Maps by default to avoid a Metal renderer crash; set
 * EXPO_PUBLIC_USE_GOOGLE_MAPS_IOS_SIMULATOR=true to force Google in simulator.
 * Env access is routed through the shared config helper.
 */
function getUseGoogleMapsProvider(): boolean {
  const isIOS = Platform.OS.toLowerCase().startsWith("ios");
  if (!isIOS) return true;
  const isSimulator = Constants.isDevice === false;
  const envCfg = getEnv();
  const forceGoogleInSimulator =
    String(envCfg.getRaw("EXPO_PUBLIC_USE_GOOGLE_MAPS_IOS_SIMULATOR") ?? "") === "true";
  return !isSimulator || forceGoogleInSimulator;
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
  /** Index of the focused property (drives which marker to highlight and center) */
  focusedIndex: number;
  /** Called when user selects a marker to sync currentPage */
  onMarkerSelect?: (index: number) => void;
  /** Isochrone polygon data from search API (same shape as web) – rendered as overlay */
  isochroneData?: unknown;
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
  isochroneData,
}: SearchPageMapContainerNativeProps): React.ReactElement {
  const mapRef = useRef<MapViewType>(null);
  const googleMapId = useMemo(() => getGoogleMapIdForNative(), []);
  const [layoutSize, setLayoutSize] = useState({ width: 0, height: 0 });
  const isNativeGoogleMapsEnabled = useFeature(SEARCH_NATIVE_GOOGLE_MAPS_FLAG);
  const useGoogleMapsProvider = isNativeGoogleMapsEnabled || getUseGoogleMapsProvider();
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

  const mapIdApplied = useGoogleMapsProvider && !!googleMapId;
  useEffect(() => {
    if (mapIdApplied) {
      log.info(
        LOG_CATEGORIES.MAP_RENDERING,
        "Applying Cloud Map ID to native MapView (Google provider)",
        {
          googleMapId,
        }
      );
    } else {
      log.info(LOG_CATEGORIES.MAP_RENDERING, "Native map not using Cloud Map ID", {
        reason: !useGoogleMapsProvider
          ? "Apple Maps (simulator or non-Google)"
          : "no map ID configured",
      });
    }
  }, [googleMapId, mapIdApplied, useGoogleMapsProvider]);

  const propertiesWithCoords = useMemo(() => properties.filter(hasValidCoordinates), [properties]);

  const isochronePolygons = useMemo(() => {
    if (!isochroneData) return { main: null, individuals: [] as LatLng[][] };
    try {
      return parseIsochroneForNativeMap(isochroneData);
    } catch (e) {
      log.warn(LOG_CATEGORIES.MAP_RENDERING, "Failed to parse isochrone for native map", e);
      return { main: null, individuals: [] as LatLng[][] };
    }
  }, [isochroneData]);

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
      {/* Measure before rendering MapView to avoid CAMetalLayer setDrawableSize 0x0 (GeoServices / blank map). */}
      <View style={styles.map} onLayout={onMapContainerLayout}>
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
          >
            {isochronePolygons.individuals.map((coords, idx) => (
              <Polygon
                key={`isochrone-individual-${idx}`}
                coordinates={coords}
                strokeColor={color("brown.DEFAULT")}
                strokeWidth={1}
                fillColor="transparent"
              />
            ))}
            {isochronePolygons.main ? (
              <Polygon
                key="isochrone-main"
                coordinates={isochronePolygons.main}
                strokeColor={color("olive.DEFAULT")}
                strokeWidth={2}
                fillColor="rgba(163, 177, 138, 0.15)"
              />
            ) : null}
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
        ) : null}
      </View>
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
