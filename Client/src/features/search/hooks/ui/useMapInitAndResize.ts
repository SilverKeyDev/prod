import { useEffect, useRef, useCallback } from 'react';

export function useMapInitAndResize(params: {
  isLocalStorageLoaded: boolean;
  isGoogleMapsLoaded: boolean;
  createMap: (el: HTMLElement) => google.maps.Map | null;
  mapRef: React.RefObject<HTMLDivElement>;
}): {
  googleMapRef: React.MutableRefObject<google.maps.Map | null>;
  ensureMapMounted: () => void;
} {
  const googleMapRef = useRef<google.maps.Map | null>(null);

  // Extract individual functions to prevent dependency issues
  const { isGoogleMapsLoaded, createMap, mapRef } = params;

  // Helper: which container is visible?
  const getVisibleMapEl = useCallback(() => {
    return mapRef.current;
  }, [mapRef]);

  // Handle resize/orientation changes (SSR-safe)
  useEffect(() => {
    // SSR-safe guard
    if (typeof window === 'undefined') return;

    const onResize = () => {
      const container = getVisibleMapEl();
      if (!container || !googleMapRef.current) return;

      // If the map was created in the hidden container, re-attach by recreating it
      if (googleMapRef.current && !container.contains(googleMapRef.current.getDiv())) {
        const map = createMap(container);
        if (map) {
          googleMapRef.current = map;
        }
      }

      if (window.google?.maps?.event && googleMapRef.current) {
        window.google.maps.event.trigger(googleMapRef.current, 'resize');
      }
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [createMap, getVisibleMapEl]);

  // Initialize Google Maps immediately when Google Maps is loaded (don't wait for localStorage)
  useEffect(() => {
    const initializeMap = (retryCount = 0) => {
      
      if (!isGoogleMapsLoaded) {
        console.error('🗺️ [MAP_INIT] Google Maps not loaded yet, skipping');
        return;
      }

      // CRITICAL FIX: Don't recreate map if it already exists
      if (googleMapRef.current) {
        return;
      }

      // Get current container and createMap function (not dependencies)
      const container = getVisibleMapEl();
      
      if (!container) {
        if (retryCount < 5) {
          console.error(`🗺️ [MAP_INIT] No container found, retrying ${retryCount + 1}/5 in 100ms`);
          // Retry after a short delay to allow DOM to render
          setTimeout(() => {
            initializeMap(retryCount + 1);
          }, 100);
        } else {
          console.error('🗺️ [MAP_INIT] Container not found after 5 retries, giving up');
        }
        return;
      }
      const map = createMap(container);
      if (!map) {
        console.error('❌ [MAP_INIT] Failed to create map');
        return;
      }

      googleMapRef.current = map;

      // Force map resize after creation (SSR-safe)
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.google?.maps?.event && googleMapRef.current) {
          window.google.maps.event.trigger(googleMapRef.current, 'resize');
        }
      }, 100);
    };
    // Initialize map immediately when Google Maps is loaded
    if (isGoogleMapsLoaded) {
      initializeMap();
    }
  }, [isGoogleMapsLoaded]); // Only depend on isGoogleMapsLoaded to prevent recreation

  const ensureMapMounted = useCallback(() => {
    if (!isGoogleMapsLoaded) return;

    const container = getVisibleMapEl();
    if (!container) return;

    const map = createMap(container);
    if (!map) {
      console.error('❌ Failed to create map');
      return;
    }

    googleMapRef.current = map;

    // Force map resize after creation (SSR-safe)
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.google?.maps?.event && googleMapRef.current) {
        window.google.maps.event.trigger(googleMapRef.current, 'resize');
      }
    }, 100);
  }, [isGoogleMapsLoaded, createMap, getVisibleMapEl]);

  return {
    googleMapRef,
    ensureMapMounted,
  };
}
