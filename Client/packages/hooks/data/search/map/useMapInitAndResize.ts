import { useCallback, useEffect, useMemo, useRef } from "react";

import { log, LOG_CATEGORIES } from "logger";

import { screenUp } from "packages/schemas/app/ui/screens";
import { googleMapsService } from "packages/services/search/googleMaps";
import { dateNow } from "packages/utils/core/date";
import { getWindow } from "packages/utils/core/platform";

export function useMapInitAndResize(params: {
  isLocalStorageLoaded: boolean;
  isGoogleMapsLoaded: boolean;
  createMap: (el: HTMLElement) => google.maps.Map | null;
  mobileMapRef: React.RefObject<HTMLDivElement>;
  desktopMapRef: React.RefObject<HTMLDivElement>;
}): {
  googleMapRef: React.MutableRefObject<google.maps.Map | null>;
  ensureMapMounted: () => void;
} {
  const googleMapRef = useRef<google.maps.Map | null>(null);

  // Memoize stable dependencies to prevent unnecessary re-renders
  const stableParams = useMemo(
    () => ({
      isLocalStorageLoaded: params.isLocalStorageLoaded,
      isGoogleMapsLoaded: params.isGoogleMapsLoaded,
      createMap: params.createMap,
    }),
    [params.isLocalStorageLoaded, params.isGoogleMapsLoaded, params.createMap],
  );

  // Helper: which container is visible? (memoized to prevent re-renders)
  const getVisibleMapEl = useCallback(() => {
    const win = getWindow();
    const isDesktop = win?.matchMedia(screenUp("md")).matches ?? false;
    return isDesktop
      ? params.desktopMapRef.current
      : params.mobileMapRef.current;
  }, [params.desktopMapRef, params.mobileMapRef]);

  // Handle resize/orientation changes (SSR-safe)
  useEffect(() => {
    const win = getWindow();
    if (!win) return;

    const onResize = () => {
      const container = getVisibleMapEl();
      if (!container || !googleMapRef.current) return;

      // If the map was created in a different container, we need to recreate it
      // But first check if the map is already in the correct container
      const mapDiv = googleMapRef.current.getDiv();
      if (container.contains(mapDiv)) {
        // Map is already in the correct container, just trigger resize
        if ((win as Window & { google?: typeof google }).google?.maps?.event) {
          (win as Window & { google: typeof google }).google.maps.event.trigger(
            googleMapRef.current,
            "resize",
          );
        }
        return;
      }

      // Map is in wrong container, recreate it
      log.debug(
        LOG_CATEGORIES.POLLING,
        "[MAP_RESIZE] Map in wrong container, recreating",
        {
          currentContainer: mapDiv.parentElement,
          targetContainer: container,
          timestamp: dateNow().toISOString(),
        },
      );

      // Check if the target container already has a map
      const existingMap = googleMapsService.getMapForContainer(container);
      if (existingMap) {
        log.debug(
          LOG_CATEGORIES.POLLING,
          "[MAP_RESIZE] Target container already has a map, reusing",
          {
            existingMap,
            container,
            timestamp: dateNow().toISOString(),
          },
        );
        googleMapRef.current = existingMap;
      } else {
        const map = stableParams.createMap(container);
        if (map) {
          googleMapRef.current = map;
        }
      }
    };

    win.addEventListener("resize", onResize);
    win.addEventListener("orientationchange", onResize);

    return () => {
      win.removeEventListener("resize", onResize);
      win.removeEventListener("orientationchange", onResize);
    };
  }, [stableParams, getVisibleMapEl]);

  // Initialize Google Maps automatically when conditions are met
  useEffect(() => {
    // Only initialize if prerequisites are ready and no map exists
    if (
      !stableParams.isLocalStorageLoaded ||
      !stableParams.isGoogleMapsLoaded ||
      googleMapRef.current
    ) {
      return;
    }

    const container = getVisibleMapEl();
    if (!container) {
      return;
    }

    // Check if container already has a map instance
    const existingMap = googleMapsService.getMapForContainer(container);
    if (existingMap) {
      log.debug(
        LOG_CATEGORIES.POLLING,
        "[MAP_INIT] Container already has a map, reusing",
        {
          existingMap,
          container,
          timestamp: dateNow().toISOString(),
        },
      );
      googleMapRef.current = existingMap;
      return;
    }

    const map = stableParams.createMap(container);
    if (!map) {
      return;
    }

    googleMapRef.current = map;

    // Force map resize after creation (SSR-safe)
    const winForResize = getWindow();
    setTimeout(() => {
      if (
        winForResize &&
        (winForResize as Window & { google?: typeof google }).google?.maps
          ?.event &&
        googleMapRef.current
      ) {
        (
          winForResize as Window & { google: typeof google }
        ).google.maps.event.trigger(googleMapRef.current, "resize");
      }
    }, 100);
  }, [stableParams, getVisibleMapEl]);

  const ensureMapMounted = useCallback(() => {
    if (
      !stableParams.isLocalStorageLoaded ||
      !stableParams.isGoogleMapsLoaded ||
      googleMapRef.current
    ) {
      return;
    }

    const container = getVisibleMapEl();
    if (!container) {
      return;
    }

    // Check if container already has a map instance
    const existingMap = googleMapsService.getMapForContainer(container);
    if (existingMap) {
      log.debug(
        LOG_CATEGORIES.POLLING,
        "[ENSURE_MAP] Container already has a map, reusing",
        {
          existingMap,
          container,
          timestamp: dateNow().toISOString(),
        },
      );
      googleMapRef.current = existingMap;
      return;
    }

    const map = stableParams.createMap(container);
    if (!map) {
      return;
    }

    googleMapRef.current = map;

    // Force map resize after creation (SSR-safe)
    const winForResize2 = getWindow();
    setTimeout(() => {
      if (
        winForResize2 &&
        (winForResize2 as Window & { google?: typeof google }).google?.maps
          ?.event &&
        googleMapRef.current
      ) {
        (
          winForResize2 as Window & { google: typeof google }
        ).google.maps.event.trigger(googleMapRef.current, "resize");
      }
    }, 100);
  }, [stableParams, getVisibleMapEl]);

  return {
    googleMapRef,
    ensureMapMounted,
  };
}
