import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { MapView as MapViewType } from "react-native-maps";
import type { Region } from "react-native-maps";

import { useFeature } from "packages/contexts";
import type { SearchResult } from "packages/features/search/types";
import type { IsochroneData } from "packages/features/search/types/isochrone";
import {
  searchMapOverlayBaseZIndex,
  searchMapPolygonIndividualZIndex,
  searchMapPolygonUnionZIndex,
} from "packages/features/search/types/search/map/mapOverlayLayerOrder";
import { importantWaypointsFromIsochrone } from "packages/features/search/utils/map/importantWaypointsFromIsochrone";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useFiltersStore } from "packages/store";
import {
  getGoogleMapIdForNative,
  getUseGoogleMapsProvider,
} from "packages/utils/maps/native/nativeGoogleMapsCloudConfig";
import { parseIsochroneForNativeMap } from "packages/utils/maps/native/parseIsochroneForNativeMap";

const SEARCH_NATIVE_GOOGLE_MAPS_FLAG = "search_native_google_maps";

type LatLng = { latitude: number; longitude: number };

function hasValidCoordinates(p: SearchResult): boolean {
  return (
    typeof p.lat === "number" &&
    typeof p.lng === "number" &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng)
  );
}

export function useSearchPageMapContainerNative({
  properties,
  page,
  perPage,
  isochroneData,
  showCommuteOverlay = true,
  onMarkerSelect,
  onZoomIn,
  onZoomOut,
}: {
  properties: SearchResult[];
  page: number;
  perPage: number;
  isochroneData?: unknown;
  showCommuteOverlay?: boolean;
  onMarkerSelect?: (index: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  const mapRef = useRef<MapViewType>(null);
  const setLastMapRegion = useFiltersStore((s) => s.setLastMapRegion);
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

  const importantWaypoints = useMemo(() => {
    if (!showCommuteOverlay || !isochroneData || typeof isochroneData !== "object") {
      return [];
    }
    try {
      return importantWaypointsFromIsochrone(isochroneData as IsochroneData);
    } catch (e) {
      log.warn(
        LOG_CATEGORIES.MAP_RENDERING,
        "Failed to parse important waypoints for native map",
        e
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
      }
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
      300
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
    const idToIndex = new Map<string, number>();
    properties.forEach((p, i) => idToIndex.set(p.id, i));
    return idToIndex;
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
    [indexByPropertyId, onMarkerSelect]
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
    [setLastMapRegion]
  );

  return {
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
    polygonIndividualZ: searchMapPolygonIndividualZIndex(),
    polygonUnionZ: searchMapPolygonUnionZIndex(),
    waypointZ: searchMapOverlayBaseZIndex("waypoints"),
    homeMarkerZ: searchMapOverlayBaseZIndex("homeMarkers"),
  };
}
