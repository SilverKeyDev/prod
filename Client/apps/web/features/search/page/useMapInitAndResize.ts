import { useEffect, useRef, useCallback } from "react";

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

  // Helper: which container is visible?
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

      // If the map was created in the hidden container, re-attach by recreating it
      if (
        googleMapRef.current &&
        !container.contains(googleMapRef.current.getDiv())
      ) {
        const map = params.createMap(container);
        if (map) {
          googleMapRef.current = map;
        }
      }

      if (window.google?.maps?.event && googleMapRef.current) {
        window.google.maps.event.trigger(googleMapRef.current, "resize");
      }
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.createMap, getVisibleMapEl]);

  // Initialize Google Maps automatically when conditions are met
  useEffect(() => {
    const initializeMap = () => {
      if (!params.isLocalStorageLoaded || !params.isGoogleMapsLoaded) return;

      const container = getVisibleMapEl();
      if (!container) return;

      const map = params.createMap(container);
      if (!map) {
        console.error("❌ Failed to create map");
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
    };

    // Only initialize map after localStorage loading is complete and Google Maps is loaded
    if (params.isLocalStorageLoaded && params.isGoogleMapsLoaded) {
      initializeMap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params.isLocalStorageLoaded,
    params.isGoogleMapsLoaded,
    params.createMap,
    getVisibleMapEl,
  ]);

  const ensureMapMounted = useCallback(() => {
    if (!params.isLocalStorageLoaded || !params.isGoogleMapsLoaded) return;

    const container = getVisibleMapEl();
    if (!container) return;

    const map = params.createMap(container);
    if (!map) {
      console.error("❌ Failed to create map");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params.isLocalStorageLoaded,
    params.isGoogleMapsLoaded,
    params.createMap,
    getVisibleMapEl,
  ]);

  return {
    googleMapRef,
    ensureMapMounted,
  };
}
