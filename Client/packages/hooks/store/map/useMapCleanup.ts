import { useCallback, useEffect, useRef } from "react";

import { log, LOG_CATEGORIES } from "logger";

import {
  clearMarkers,
  clearOverlays,
  clearPolygons,
  forceGCHelper,
  runFullMapCleanup,
} from "./mapCleanupHelpers";

export type MapCleanupOptions = {
  googleMapRef: React.MutableRefObject<google.maps.Map | null>;
  markersRef?: React.MutableRefObject<
    google.maps.marker.AdvancedMarkerElement[]
  >;
  overlaysRef?: React.MutableRefObject<google.maps.OverlayView[]>;
  polygonsRef?: React.MutableRefObject<google.maps.Polygon[]>;
  individualPolygonsRef?: React.MutableRefObject<google.maps.Polygon[]>;
  importantMarkersRef?: React.MutableRefObject<
    google.maps.marker.AdvancedMarkerElement[]
  >;
  enableMemoryMonitoring?: boolean;
};

export type MapCleanupReturn = {
  cleanup: () => void;
  cleanupMarkers: () => void;
  cleanupOverlays: () => void;
  cleanupPolygons: () => void;
  getMemoryStats: () => {
    markers: number;
    overlays: number;
    polygons: number;
    totalElements: number;
  };
  forceGC: () => void;
};

/**
 * Hook for managing Google Maps cleanup and memory management
 */
export function useMapCleanup({
  googleMapRef,
  markersRef,
  overlaysRef,
  polygonsRef,
  individualPolygonsRef,
  importantMarkersRef,
  enableMemoryMonitoring = false,
}: MapCleanupOptions): MapCleanupReturn {
  const cleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const memoryStatsRef = useRef({
    markers: 0,
    overlays: 0,
    polygons: 0,
    totalElements: 0,
  });

  const cleanupMarkers = useCallback(() => {
    clearMarkers(markersRef, importantMarkersRef, memoryStatsRef);
  }, [markersRef, importantMarkersRef]);

  const cleanupOverlays = useCallback(() => {
    clearOverlays(overlaysRef, memoryStatsRef);
  }, [overlaysRef]);

  const cleanupPolygons = useCallback(() => {
    clearPolygons(polygonsRef, individualPolygonsRef, memoryStatsRef);
  }, [polygonsRef, individualPolygonsRef]);

  const cleanup = useCallback(() => {
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
      log.debug(
        LOG_CATEGORIES.MAP_RENDERING,
        "Cleared pending cleanup timeout",
      );
    }
    runFullMapCleanup(
      googleMapRef,
      cleanupMarkers,
      cleanupOverlays,
      cleanupPolygons,
      memoryStatsRef,
    );
  }, [googleMapRef, cleanupMarkers, cleanupOverlays, cleanupPolygons]);

  const getMemoryStats = useCallback(() => {
    const stats = {
      markers: markersRef?.current?.length || 0,
      overlays: overlaysRef?.current?.length || 0,
      polygons:
        (polygonsRef?.current?.length || 0) +
        (individualPolygonsRef?.current?.length || 0),
      totalElements: 0,
    };
    stats.totalElements = stats.markers + stats.overlays + stats.polygons;
    memoryStatsRef.current = stats;
    return stats;
  }, [markersRef, overlaysRef, polygonsRef, individualPolygonsRef]);

  const forceGC = useCallback(() => {
    forceGCHelper();
  }, []);

  useEffect(() => {
    if (!enableMemoryMonitoring) return;
    const interval = setInterval(() => {
      const stats = getMemoryStats();
      if (stats.totalElements > 100) {
        log.warn(
          LOG_CATEGORIES.MAP_RENDERING,
          "High memory usage detected",
          stats,
        );
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [enableMemoryMonitoring, getMemoryStats]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    cleanup,
    cleanupMarkers,
    cleanupOverlays,
    cleanupPolygons,
    getMemoryStats,
    forceGC,
  };
}
