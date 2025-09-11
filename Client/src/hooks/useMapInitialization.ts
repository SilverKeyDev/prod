import { useEffect, useRef } from 'react';
import { useGoogleMaps } from '../context/GoogleMapsContext';

interface UseMapInitializationProps {
  isLocalStorageLoaded: boolean;
  onMapReady?: (map: google.maps.Map) => void;
}

interface UseMapInitializationReturn {
  mobileMapRef: React.RefObject<HTMLDivElement>;
  desktopMapRef: React.RefObject<HTMLDivElement>;
  googleMapRef: React.RefObject<google.maps.Map | null>;
}

const DESKTOP_QUERY = '(min-width: 768px)';

export const useMapInitialization = ({
  isLocalStorageLoaded,
  onMapReady,
}: UseMapInitializationProps): UseMapInitializationReturn => {
  const { isLoaded: isGoogleMapsLoaded, createMap } = useGoogleMaps();

  const mobileMapRef = useRef<HTMLDivElement>(null);
  const desktopMapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);

  // Track which container currently owns the map
  const currentContainerRef = useRef<HTMLDivElement | null>(null);
  const isInitializedRef = useRef(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const mqlRef = useRef<MediaQueryList | null>(null);

  const getVisibleContainer = () => {
    if (typeof window === 'undefined') return null;
    const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;
    return isDesktop ? desktopMapRef.current : mobileMapRef.current;
  };

  const attachResizeObserver = (container: HTMLDivElement | null) => {
    // Clean up any previous observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
    if (!container || !googleMapRef.current || typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(() => {
      // Use rAF to coalesce multiple size changes
      requestAnimationFrame(() => {
        if (window.google?.maps?.event && googleMapRef.current) {
          window.google.maps.event.trigger(googleMapRef.current, 'resize');
        }
      });
    });

    ro.observe(container);
    resizeObserverRef.current = ro;
  };

  const createInContainer = (container: HTMLDivElement) => {
    // Clean the container to prevent stacking multiple canvases if reusing a node
    container.innerHTML = '';

    const map = createMap(container);
    if (!map) {
       
      console.error('❌ Failed to create Google Map');
      return null;
    }
    googleMapRef.current = map;
    currentContainerRef.current = container;

    // Kick a resize after initial paint for tiles/layout correctness
    setTimeout(() => {
      if (window.google?.maps?.event && googleMapRef.current) {
        window.google.maps.event.trigger(googleMapRef.current, 'resize');
      }
    }, 60);

    attachResizeObserver(container);

    if (onMapReady) onMapReady(map);
    return map;
  };

  // Initial create when both prerequisites are ready
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!isLocalStorageLoaded || !isGoogleMapsLoaded) return;
    const container = getVisibleContainer();
    if (!container) return;

    // If already initialized into this same container, skip
    if (isInitializedRef.current && currentContainerRef.current === container && googleMapRef.current) {
      return;
    }

    isInitializedRef.current = true;
    createInContainer(container);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocalStorageLoaded, isGoogleMapsLoaded]); // keep dependencies minimal

  // React to breakpoint changes (mobile <-> desktop)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia(DESKTOP_QUERY);
    mqlRef.current = mql;

    const handleChange = () => {
      const nextContainer = getVisibleContainer();
      if (!nextContainer) return;

      // If the map is already in the right container, just trigger resize
      if (currentContainerRef.current === nextContainer && googleMapRef.current) {
        if (window.google?.maps?.event) {
          window.google.maps.event.trigger(googleMapRef.current, 'resize');
        }
        return;
      }

      // Otherwise, (re)create the map in the new container
      createInContainer(nextContainer);
    };

    // Some browsers want addEventListener, some support addListener
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handleChange);
    } else if (typeof (mql as any).addListener === 'function') {
      (mql as any).addListener(handleChange);
    }

    return () => {
      if (!mqlRef.current) return;
      if (typeof mqlRef.current.removeEventListener === 'function') {
        mqlRef.current.removeEventListener('change', handleChange);
      } else if (typeof (mqlRef.current as any).removeListener === 'function') {
        (mqlRef.current as any).removeListener(handleChange);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fallback: window resize/orientation (still useful if ResizeObserver not available)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let rafId: number | null = null;
    const onResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const container = getVisibleContainer();
        if (!container) return;

        // Container changed without a media query event (rare but possible via CSS)
        if (currentContainerRef.current !== container) {
          createInContainer(container);
          return;
        }

        if (window.google?.maps?.event && googleMapRef.current) {
          window.google.maps.event.trigger(googleMapRef.current, 'resize');
        }
      });
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    mobileMapRef,
    desktopMapRef,
    googleMapRef,
  };
};
