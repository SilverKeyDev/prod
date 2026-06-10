import type React from "react";

import { googleMapsService } from "packages/features/search";
import { log } from "packages/logger";
import { dateNow } from "packages/utils/core/date";
import { getWindow } from "packages/utils/core/platform";

type MemoryStatsRef = React.MutableRefObject<{
  markers: number;
  overlays: number;
  polygons: number;
  totalElements: number;
}>;

export function clearMarkers(
  markersRef: React.MutableRefObject<google.maps.marker.AdvancedMarkerElement[]> | undefined,
  importantMarkersRef:
    | React.MutableRefObject<google.maps.marker.AdvancedMarkerElement[]>
    | undefined,
  memoryStatsRef: MemoryStatsRef
) {
  log.debug("MAP_RENDERING", "Starting marker cleanup", {
    markersCount: markersRef?.current?.length || 0,
    importantMarkersCount: importantMarkersRef?.current?.length || 0,
    timestamp: dateNow().toISOString(),
  });

  if (markersRef?.current) {
    markersRef.current.forEach((marker, index) => {
      try {
        if (marker && typeof marker === "object" && "map" in marker) {
          (marker as { map: google.maps.Map | null }).map = null;
          log.debug("MAP_RENDERING", "Cleaned up marker", {
            index: index + 1,
          });
        }
      } catch (error) {
        log.warn("MAP_RENDERING", "Error cleaning up marker", {
          index: index + 1,
          error,
        });
      }
    });
    markersRef.current = [];
    memoryStatsRef.current.markers = 0;
    log.debug("MAP_RENDERING", "All markers cleaned up");
  }

  if (importantMarkersRef?.current) {
    importantMarkersRef.current.forEach((marker, index) => {
      try {
        if (marker && typeof marker === "object" && "map" in marker) {
          (marker as { map: google.maps.Map | null }).map = null;
          log.debug("MAP_RENDERING", "Cleaned up important marker", {
            index: index + 1,
          });
        }
      } catch (error) {
        log.warn("MAP_RENDERING", "Error cleaning up important marker", {
          index: index + 1,
          error,
        });
      }
    });
    importantMarkersRef.current = [];
    log.debug("MAP_RENDERING", "All important markers cleaned up");
  }
}

export function clearOverlays(
  overlaysRef: React.MutableRefObject<google.maps.OverlayView[]> | undefined,
  memoryStatsRef: MemoryStatsRef
) {
  log.debug("MAP_RENDERING", "Starting overlay cleanup", {
    overlaysCount: overlaysRef?.current?.length || 0,
    timestamp: dateNow().toISOString(),
  });

  if (overlaysRef?.current) {
    overlaysRef.current.forEach((overlay, index) => {
      try {
        if (overlay && typeof overlay === "object" && "setMap" in overlay) {
          (overlay as { setMap: (map: google.maps.Map | null) => void }).setMap(null);
          log.debug("MAP_RENDERING", "Cleaned up overlay", {
            index: index + 1,
          });
        }
      } catch (error) {
        log.warn("MAP_RENDERING", "Error cleaning up overlay", {
          index: index + 1,
          error,
        });
      }
    });
    overlaysRef.current = [];
    memoryStatsRef.current.overlays = 0;
    log.debug("MAP_RENDERING", "All overlays cleaned up");
  }
}

export function clearPolygons(
  polygonsRef: React.MutableRefObject<google.maps.Polygon[]> | undefined,
  individualPolygonsRef: React.MutableRefObject<google.maps.Polygon[]> | undefined,
  memoryStatsRef: MemoryStatsRef
) {
  log.debug("MAP_RENDERING", "Starting polygon cleanup", {
    polygonsCount: polygonsRef?.current?.length || 0,
    individualPolygonsCount: individualPolygonsRef?.current?.length || 0,
    timestamp: dateNow().toISOString(),
  });

  if (polygonsRef?.current) {
    polygonsRef.current.forEach((polygon, index) => {
      try {
        if (polygon && typeof polygon === "object" && "setMap" in polygon) {
          (polygon as { setMap: (map: google.maps.Map | null) => void }).setMap(null);
          log.debug("MAP_RENDERING", "Cleaned up polygon", {
            index: index + 1,
          });
        }
      } catch (error) {
        log.warn("MAP_RENDERING", "Error cleaning up polygon", {
          index: index + 1,
          error,
        });
      }
    });
    polygonsRef.current = [];
    log.debug("MAP_RENDERING", "All polygons cleaned up");
  }

  if (individualPolygonsRef?.current) {
    individualPolygonsRef.current.forEach((polygon, index) => {
      try {
        if (polygon && typeof polygon === "object" && "setMap" in polygon) {
          (polygon as { setMap: (map: google.maps.Map | null) => void }).setMap(null);
          log.debug("MAP_RENDERING", "Cleaned up individual polygon", {
            index: index + 1,
          });
        }
      } catch (error) {
        log.warn("MAP_RENDERING", "Error cleaning up individual polygon", {
          index: index + 1,
          error,
        });
      }
    });
    individualPolygonsRef.current = [];
    log.debug("MAP_RENDERING", "All individual polygons cleaned up");
  }

  memoryStatsRef.current.polygons = 0;
}

export function runFullMapCleanup(
  googleMapRef: React.MutableRefObject<google.maps.Map | null>,
  cleanupMarkers: () => void,
  cleanupOverlays: () => void,
  cleanupPolygons: () => void,
  memoryStatsRef: MemoryStatsRef
) {
  log.debug("MAP_RENDERING", "Starting complete map cleanup", {
    hasMapInstance: !!googleMapRef.current,
    timestamp: dateNow().toISOString(),
  });

  log.debug("MAP_RENDERING", "Cleaning up map elements");
  cleanupMarkers();
  cleanupOverlays();
  cleanupPolygons();

  if (googleMapRef.current) {
    try {
      log.debug("MAP_RENDERING", "Clearing map instance and event listeners");
      googleMapsService.cleanupMapInstance(googleMapRef.current);
      log.debug("MAP_RENDERING", "Used service cleanup method");
      googleMapRef.current = null;
      log.debug("MAP_RENDERING", "Cleared map reference");
    } catch (error) {
      log.warn("MAP_RENDERING", "Error clearing map reference", error);
    }
  } else {
    log.debug("MAP_RENDERING", "No map instance to clear");
  }

  memoryStatsRef.current.totalElements = 0;
  log.debug("MAP_RENDERING", "Complete map cleanup finished", {
    timestamp: dateNow().toISOString(),
  });
}

export function forceGCHelper(): void {
  const win = getWindow() as Window & { gc?: () => void };
  if (win && "gc" in win) {
    try {
      win.gc?.();
      log.debug("MAP_RENDERING", "Forced garbage collection");
    } catch (error) {
      log.warn("MAP_RENDERING", "Garbage collection not available", error);
    }
  } else {
    log.warn("MAP_RENDERING", "Garbage collection not available in this environment");
  }
}
