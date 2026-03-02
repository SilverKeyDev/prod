import { log, LOG_CATEGORIES } from "packages/logger";
import { asError } from "packages/utils";
import { dateNow } from "packages/utils/date";
import { getWindow } from "packages/utils/platform";

/**
 * Tracks and manages Google Map instances (create, cleanup, resize).
 */
export class MapInstanceManager {
  static mapInstanceCount = 0;
  static activeMapInstances = new Set<google.maps.Map>();

  createMap(container: HTMLElement, mapId: string | undefined): google.maps.Map | null {
    const existingMapInstance = Array.from(MapInstanceManager.activeMapInstances).find(
      (map) => map.getDiv() === container
    );
    if (existingMapInstance) return existingMapInstance;

    const win = getWindow() as Window & { google?: typeof google };
    if (!win?.google?.maps?.Map) return null;
    try {
      const map = new win.google.maps.Map(container, {
        center: { lat: 33.75, lng: -84.39 },
        zoom: 12,
        mapId: mapId ?? undefined,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
        scaleControl: false,
        rotateControl: false,
        keyboardShortcuts: false,
        gestureHandling: "greedy",
        disableDefaultUI: true,
      });
      MapInstanceManager.mapInstanceCount++;
      MapInstanceManager.activeMapInstances.add(map);
      return map;
    } catch (err: unknown) {
      const error = asError(err);
      log.error(LOG_CATEGORIES.MAP_RENDERING, "Error creating Google Map", error);
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
