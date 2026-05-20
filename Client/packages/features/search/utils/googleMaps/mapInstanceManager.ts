import { log, LOG_CATEGORIES } from "packages/logger";
import { asError } from "packages/utils";
import { dateNow } from "packages/utils/date";
import { logWebMapsEnvDiagnostics } from "packages/utils/maps/cloudMapId/logWebMapsEnvDiagnostics";
import { getWindow } from "packages/utils/platform";

import { buildWebGoogleMapOptions } from "./buildWebGoogleMapOptions";

/**
 * Tracks and manages Google Map instances (create, cleanup, resize).
 */
export class MapInstanceManager {
  static mapInstanceCount = 0;
  static activeMapInstances = new Set<google.maps.Map>();

  createMap(
    container: HTMLElement,
    mapId: string | undefined,
    overrides?: Partial<google.maps.MapOptions>
  ): google.maps.Map | null {
    const existingMapInstance = Array.from(MapInstanceManager.activeMapInstances).find(
      (map) => map.getDiv() === container
    );
    if (existingMapInstance) return existingMapInstance;

    const win = getWindow() as Window & { google?: typeof google };
    if (!win?.google?.maps?.Map) return null;

    const effectiveMapId = mapId ?? undefined;
    log.info(LOG_CATEGORIES.MAP_RENDERING, "Applying map ID to Google Map instance", {
      mapId: effectiveMapId ?? "(none - default styling)",
      willUseCloudStyling: !!effectiveMapId,
    });

    try {
      const mapOptions = buildWebGoogleMapOptions(
        effectiveMapId,
        overrides as Parameters<typeof buildWebGoogleMapOptions>[1]
      );
      const map = new win.google.maps.Map(container, mapOptions as google.maps.MapOptions);
      MapInstanceManager.mapInstanceCount++;
      MapInstanceManager.activeMapInstances.add(map);
      logWebMapsEnvDiagnostics({ phase: "map_instance", map });
      log.info(LOG_CATEGORIES.MAP_RENDERING, "Google Map created successfully", {
        mapIdApplied: !!effectiveMapId,
        activeInstances: MapInstanceManager.activeMapInstances.size,
      });
      return map;
    } catch (err: unknown) {
      const error = asError(err);
      log.error(LOG_CATEGORIES.MAP_RENDERING, "Error creating Google Map", {
        error,
        mapIdAttempted: effectiveMapId ?? "(none)",
      });
      return null;
    }
  }

  triggerMapResize(map: google.maps.Map): void {
    const win = getWindow() as Window & { google?: typeof google };
    if (win?.google?.maps?.event && map) {
      win.google.maps.event.trigger(map, "resize");
    }
  }

  cleanupMapInstance(map: google.maps.Map): void {
    log.debug(LOG_CATEGORIES.MAP_RENDERING, "Cleaning up map instance", {
      mapInstanceCount: MapInstanceManager.mapInstanceCount,
      activeMapInstancesCount: MapInstanceManager.activeMapInstances.size,
      timestamp: dateNow().toISOString(),
    });

    try {
      const win = getWindow() as Window & { google?: typeof google };
      if (win?.google?.maps?.event) {
        win.google.maps.event.clearInstanceListeners(map);
        log.debug(LOG_CATEGORIES.MAP_RENDERING, "Cleared all event listeners");
      }

      if (MapInstanceManager.activeMapInstances.has(map)) {
        MapInstanceManager.activeMapInstances.delete(map);
        log.debug(LOG_CATEGORIES.MAP_RENDERING, "Map instance removed from tracking", {
          remainingInstances: MapInstanceManager.activeMapInstances.size,
          timestamp: dateNow().toISOString(),
        });
      } else {
        log.warn(LOG_CATEGORIES.MAP_RENDERING, "Map instance not found in tracking", {
          timestamp: dateNow().toISOString(),
        });
      }
    } catch (error) {
      log.warn(LOG_CATEGORIES.MAP_RENDERING, "Error during map cleanup", error);
    }
  }

  cleanupContainerMaps(container: HTMLElement): void {
    log.debug(LOG_CATEGORIES.MAP_RENDERING, "Cleaning up all maps for container", {
      timestamp: dateNow().toISOString(),
    });

    const mapsToCleanup = Array.from(MapInstanceManager.activeMapInstances).filter(
      (map) => map.getDiv() === container
    );

    log.debug(LOG_CATEGORIES.MAP_RENDERING, "Found maps to cleanup", {
      count: mapsToCleanup.length,
    });

    mapsToCleanup.forEach((map) => this.cleanupMapInstance(map));
    container.innerHTML = "";
  }

  hasMapInContainer(container: HTMLElement): boolean {
    return Array.from(MapInstanceManager.activeMapInstances).some(
      (map) => map.getDiv() === container
    );
  }

  getMapForContainer(container: HTMLElement): google.maps.Map | null {
    return (
      Array.from(MapInstanceManager.activeMapInstances).find((map) => map.getDiv() === container) ??
      null
    );
  }

  getMapInstanceStats(): {
    totalCreated: number;
    activeInstances: number;
    activeMapInstances: google.maps.Map[];
  } {
    return {
      totalCreated: MapInstanceManager.mapInstanceCount,
      activeInstances: MapInstanceManager.activeMapInstances.size,
      activeMapInstances: Array.from(MapInstanceManager.activeMapInstances),
    };
  }
}
