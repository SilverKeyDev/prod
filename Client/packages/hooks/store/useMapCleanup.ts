import { useCallback, useRef, useEffect, useState } from "react";

import { googleMapsService } from "../../services/googleMaps";

export type MapCleanupOptions = {
  /** Google Maps instance reference */
  googleMapRef: React.MutableRefObject<google.maps.Map | null>;
  /** Markers reference */
  markersRef?: React.MutableRefObject<
    google.maps.marker.AdvancedMarkerElement[]
  >;
  /** Overlays reference */
  overlaysRef?: React.MutableRefObject<google.maps.OverlayView[]>;
  /** Polygons reference */
  polygonsRef?: React.MutableRefObject<google.maps.Polygon[]>;
  /** Individual polygons reference */
  individualPolygonsRef?: React.MutableRefObject<google.maps.Polygon[]>;
  /** Important markers reference */
  importantMarkersRef?: React.MutableRefObject<
    google.maps.marker.AdvancedMarkerElement[]
  >;
  /** Whether to enable memory monitoring */
  enableMemoryMonitoring?: boolean;
};

export type MapCleanupReturn = {
  /** Clean up all map elements */
  cleanup: () => void;
  /** Clean up markers only */
  cleanupMarkers: () => void;
  /** Clean up overlays only */
  cleanupOverlays: () => void;
  /** Clean up polygons only */
  cleanupPolygons: () => void;
  /** Get memory usage statistics */
  getMemoryStats: () => {
    markers: number;
    overlays: number;
    polygons: number;
    totalElements: number;
  };
  /** Force garbage collection (if available) */
  forceGC: () => void;
};

/**
 * Hook for managing Google Maps cleanup and memory management
 * Prevents memory leaks by properly disposing of map elements
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

  // Clean up markers
  const cleanupMarkers = useCallback(() => {
    console.log("🧹 [MAP_CLEANUP] Starting marker cleanup:", {
      markersCount: markersRef?.current?.length || 0,
      importantMarkersCount: importantMarkersRef?.current?.length || 0,
      timestamp: new Date().toISOString(),
    });

    if (markersRef?.current) {
      markersRef.current.forEach((marker, index) => {
        try {
          if (marker && typeof marker === "object" && "map" in marker) {
            (marker as { map: google.maps.Map | null }).map = null;
            console.log(`✅ [MAP_CLEANUP] Cleaned up marker ${index + 1}`);
          }
        } catch (error) {
          console.warn(
            `⚠️ [MAP_CLEANUP] Error cleaning up marker ${index + 1}:`,
            error,
          );
        }
      });
      markersRef.current = [];
      memoryStatsRef.current.markers = 0;
      console.log("✅ [MAP_CLEANUP] All markers cleaned up");
    }

    if (importantMarkersRef?.current) {
      importantMarkersRef.current.forEach((marker, index) => {
        try {
          if (marker && typeof marker === "object" && "map" in marker) {
            (marker as { map: google.maps.Map | null }).map = null;
            console.log(
              `✅ [MAP_CLEANUP] Cleaned up important marker ${index + 1}`,
            );
          }
        } catch (error) {
          console.warn(
            `⚠️ [MAP_CLEANUP] Error cleaning up important marker ${index + 1}:`,
            error,
          );
        }
      });
      importantMarkersRef.current = [];
      console.log("✅ [MAP_CLEANUP] All important markers cleaned up");
    }
  }, [markersRef, importantMarkersRef]);

  // Clean up overlays
  const cleanupOverlays = useCallback(() => {
    console.log("🧹 [MAP_CLEANUP] Starting overlay cleanup:", {
      overlaysCount: overlaysRef?.current?.length || 0,
      timestamp: new Date().toISOString(),
    });

    if (overlaysRef?.current) {
      overlaysRef.current.forEach((overlay, index) => {
        try {
          if (overlay && typeof overlay === "object" && "setMap" in overlay) {
            (
              overlay as { setMap: (map: google.maps.Map | null) => void }
            ).setMap(null);
            console.log(`✅ [MAP_CLEANUP] Cleaned up overlay ${index + 1}`);
          }
        } catch (error) {
          console.warn(
            `⚠️ [MAP_CLEANUP] Error cleaning up overlay ${index + 1}:`,
            error,
          );
        }
      });
      overlaysRef.current = [];
      memoryStatsRef.current.overlays = 0;
      console.log("✅ [MAP_CLEANUP] All overlays cleaned up");
    }
  }, [overlaysRef]);

  // Clean up polygons
  const cleanupPolygons = useCallback(() => {
    console.log("🧹 [MAP_CLEANUP] Starting polygon cleanup:", {
      polygonsCount: polygonsRef?.current?.length || 0,
      individualPolygonsCount: individualPolygonsRef?.current?.length || 0,
      timestamp: new Date().toISOString(),
    });

    if (polygonsRef?.current) {
      polygonsRef.current.forEach((polygon, index) => {
        try {
          if (polygon && typeof polygon === "object" && "setMap" in polygon) {
            (
              polygon as { setMap: (map: google.maps.Map | null) => void }
            ).setMap(null);
            console.log(`✅ [MAP_CLEANUP] Cleaned up polygon ${index + 1}`);
          }
        } catch (error) {
          console.warn(
            `⚠️ [MAP_CLEANUP] Error cleaning up polygon ${index + 1}:`,
            error,
          );
        }
      });
      polygonsRef.current = [];
      console.log("✅ [MAP_CLEANUP] All polygons cleaned up");
    }

    if (individualPolygonsRef?.current) {
      individualPolygonsRef.current.forEach((polygon, index) => {
        try {
          if (polygon && typeof polygon === "object" && "setMap" in polygon) {
            (
              polygon as { setMap: (map: google.maps.Map | null) => void }
            ).setMap(null);
            console.log(
              `✅ [MAP_CLEANUP] Cleaned up individual polygon ${index + 1}`,
            );
          }
        } catch (error) {
          console.warn(
            `⚠️ [MAP_CLEANUP] Error cleaning up individual polygon ${index + 1}:`,
            error,
          );
        }
      });
      individualPolygonsRef.current = [];
      console.log("✅ [MAP_CLEANUP] All individual polygons cleaned up");
    }

    memoryStatsRef.current.polygons = 0;
  }, [polygonsRef, individualPolygonsRef]);

  // Complete cleanup
  const cleanup = useCallback(() => {
    console.log("🧹 [MAP_CLEANUP] Starting complete map cleanup:", {
      hasMapInstance: !!googleMapRef.current,
      mapInstanceStats: googleMapRef.current
        ? {
            mapId: googleMapRef.current.getMapId?.() || "unknown",
            container: googleMapRef.current.getDiv(),
            zoom: googleMapRef.current.getZoom(),
            center: googleMapRef.current.getCenter(),
          }
        : null,
      timestamp: new Date().toISOString(),
    });

    // Clear any pending cleanup
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
      console.log("✅ [MAP_CLEANUP] Cleared pending cleanup timeout");
    }

    // Clean up all elements
    console.log("🧹 [MAP_CLEANUP] Cleaning up map elements...");
    cleanupMarkers();
    cleanupOverlays();
    cleanupPolygons();

    // Clear the map reference
    if (googleMapRef.current) {
      try {
        console.log(
          "🧹 [MAP_CLEANUP] Clearing map instance and event listeners",
        );

        // Use the service's cleanup method for proper cleanup
        googleMapsService.cleanupMapInstance(googleMapRef.current);
        console.log("✅ [MAP_CLEANUP] Used service cleanup method");

        // Clear the map reference
        googleMapRef.current = null;
        console.log("✅ [MAP_CLEANUP] Cleared map reference");
      } catch (error) {
        console.warn("⚠️ [MAP_CLEANUP] Error clearing map reference:", error);
      }
    } else {
      console.log("ℹ️ [MAP_CLEANUP] No map instance to clear");
    }

    // Update memory stats
    memoryStatsRef.current.totalElements = 0;

    console.log("✅ [MAP_CLEANUP] Complete map cleanup finished:", {
      timestamp: new Date().toISOString(),
    });
  }, [googleMapRef, cleanupMarkers, cleanupOverlays, cleanupPolygons]);

  // Get memory statistics
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

  // Force garbage collection (if available)
  const forceGC = useCallback(() => {
    if (typeof window !== "undefined" && "gc" in window) {
      try {
        (window as { gc?: () => void }).gc?.();
        console.log("🗑️ Forced garbage collection");
      } catch (error) {
        console.warn("⚠️ Garbage collection not available:", error);
      }
    } else {
      console.warn("⚠️ Garbage collection not available in this environment");
    }
  }, []);

  // Memory monitoring
  useEffect(() => {
    if (!enableMemoryMonitoring) return;

    const interval = setInterval(() => {
      const stats = getMemoryStats();
      if (stats.totalElements > 100) {
        console.warn("⚠️ High memory usage detected:", stats);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [enableMemoryMonitoring, getMemoryStats]);

  // Cleanup on unmount
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

// Memory monitoring utilities
export function useMemoryMonitoring() {
  const [memoryUsage, setMemoryUsage] = useState<{
    used: number;
    total: number;
    percentage: number;
  }>({
    used: 0,
    total: 0,
    percentage: 0,
  });

  const checkMemoryUsage = useCallback(() => {
    type PerformanceWithMemory = Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };
    if (
      typeof window !== "undefined" &&
      "performance" in window &&
      "memory" in (window.performance as PerformanceWithMemory)
    ) {
      const { memory } = window.performance as PerformanceWithMemory;
      const used = memory?.usedJSHeapSize ?? 0;
      const total = memory?.totalJSHeapSize ?? 0;
      const percentage = total > 0 ? (used / total) * 100 : 0;

      setMemoryUsage({ used, total, percentage });

      if (percentage > 80) {
        console.warn("⚠️ High memory usage detected:", {
          used,
          total,
          percentage,
        });

        // Trigger garbage collection if available
        if (typeof window !== "undefined" && "gc" in window) {
          try {
            (window as { gc?: () => void }).gc?.();
            console.log(
              "🗑️ Triggered garbage collection due to high memory usage",
            );
          } catch (error) {
            console.warn("⚠️ Could not trigger garbage collection:", error);
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(checkMemoryUsage, 30000); // Reduced frequency to 30 seconds
    return () => clearInterval(interval);
  }, [checkMemoryUsage]);

  return { memoryUsage, checkMemoryUsage };
}
