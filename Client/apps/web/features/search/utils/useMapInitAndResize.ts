import { useEffect, useRef, useCallback, useMemo } from "react";

import { googleMapsService } from "../../../../../packages/services/googleMaps";

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
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    return isDesktop
      ? params.desktopMapRef.current
      : params.mobileMapRef.current;
  }, [params.desktopMapRef, params.mobileMapRef]);

  // Handle resize/orientation changes (SSR-safe)
  useEffect(() => {
    // SSR-safe guard
    if (typeof window === "undefined") return;

    const onResize = () => {
      const container = getVisibleMapEl();
      if (!container || !googleMapRef.current) return;

      // If the map was created in a different container, we need to recreate it
      // But first check if the map is already in the correct container
      const mapDiv = googleMapRef.current.getDiv();
      if (container.contains(mapDiv)) {
        // Map is already in the correct container, just trigger resize
        if (window.google?.maps?.event) {
          window.google.maps.event.trigger(googleMapRef.current, "resize");
        }
        return;
      }

      // Map is in wrong container, recreate it
      console.log("🔄 [MAP_RESIZE] Map in wrong container, recreating:", {
        currentContainer: mapDiv.parentElement,
        targetContainer: container,
        timestamp: new Date().toISOString(),
      });

      // Check if the target container already has a map
      const existingMap = googleMapsService.getMapForContainer(container);
      if (existingMap) {
        console.log(
          "✅ [MAP_RESIZE] Target container already has a map, reusing:",
          {
            existingMap,
            container,
            timestamp: new Date().toISOString(),
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

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableParams.createMap, getVisibleMapEl]);

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
      console.log("✅ [MAP_INIT] Container already has a map, reusing:", {
        existingMap,
        container,
        timestamp: new Date().toISOString(),
      });
      googleMapRef.current = existingMap;
      return;
    }

    const map = stableParams.createMap(container);
    if (!map) {
      return;
    }

    googleMapRef.current = map;

    // Force map resize after creation (SSR-safe)
    setTimeout(() => {
      if (
        typeof window !== "undefined" &&
        window.google?.maps?.event &&
        googleMapRef.current
      ) {
        window.google.maps.event.trigger(googleMapRef.current, "resize");
      }
    }, 100);
  }, [
    stableParams.isLocalStorageLoaded,
    stableParams.isGoogleMapsLoaded,
    stableParams.createMap,
    getVisibleMapEl,
  ]);

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
      console.log("✅ [ENSURE_MAP] Container already has a map, reusing:", {
        existingMap,
        container,
        timestamp: new Date().toISOString(),
      });
      googleMapRef.current = existingMap;
      return;
    }

    const map = stableParams.createMap(container);
    if (!map) {
      return;
    }

    googleMapRef.current = map;

    // Force map resize after creation (SSR-safe)
    setTimeout(() => {
      if (
        typeof window !== "undefined" &&
        window.google?.maps?.event &&
        googleMapRef.current
      ) {
        window.google.maps.event.trigger(googleMapRef.current, "resize");
      }
    }, 100);
  }, [
    stableParams.isLocalStorageLoaded,
    stableParams.isGoogleMapsLoaded,
    stableParams.createMap,
    getVisibleMapEl,
  ]);

  return {
    googleMapRef,
    ensureMapMounted,
  };
}
