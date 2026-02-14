import { useEffect, useRef } from "react";

import { googleMapsService } from "../../../services/googleMaps";

import { useGoogleMapsStore } from "../../../store/googleMaps.slice";

type UseMapInitializationProps = {
  isLocalStorageLoaded: boolean;
  onMapReady?: (map: google.maps.Map) => void;
};

type UseMapInitializationReturn = {
  mobileMapRef: React.RefObject<HTMLDivElement>;
  desktopMapRef: React.RefObject<HTMLDivElement>;
  googleMapRef: React.RefObject<google.maps.Map | null>;
};

const DESKTOP_QUERY = "(min-width: 768px)";

export const useMapInitialization = ({
  isLocalStorageLoaded,
  onMapReady,
}: UseMapInitializationProps): UseMapInitializationReturn => {
  const { isLoaded: isGoogleMapsLoaded } = useGoogleMapsStore();

  const mobileMapRef = useRef<HTMLDivElement>(null);
  const desktopMapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);

  // Track which container currently owns the map
  const currentContainerRef = useRef<HTMLDivElement | null>(null);
  const isInitializedRef = useRef(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const mqlRef = useRef<MediaQueryList | null>(null);

  // Add render tracking
  const renderCountRef = useRef(0);
  const lastRenderDepsRef = useRef<{
    isLocalStorageLoaded: boolean;
    isGoogleMapsLoaded: boolean;
  } | null>(null);

  renderCountRef.current++;

  console.log("🔄 [MAP_INITIALIZATION] Hook render:", {
    renderCount: renderCountRef.current,
    isLocalStorageLoaded,
    isGoogleMapsLoaded,
    isInitialized: isInitializedRef.current,
    currentContainer: currentContainerRef.current,
    hasMapInstance: !!googleMapRef.current,
    mapInstanceStats: googleMapsService.getMapInstanceStats(),
    timestamp: new Date().toISOString(),
  });

  // Track dependency changes
  const currentDeps = { isLocalStorageLoaded, isGoogleMapsLoaded };
  if (lastRenderDepsRef.current) {
    const depsChanged = Object.keys(currentDeps).some(
      (key) =>
        lastRenderDepsRef.current![key as keyof typeof currentDeps] !==
        currentDeps[key as keyof typeof currentDeps],
    );

    if (depsChanged) {
      console.log("📊 [MAP_INITIALIZATION] Dependencies changed:", {
        previous: lastRenderDepsRef.current,
        current: currentDeps,
        timestamp: new Date().toISOString(),
      });
    }
  }
  lastRenderDepsRef.current = currentDeps;

  const getVisibleContainer = () => {
    if (typeof window === "undefined") return null;
    const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;
    return isDesktop ? desktopMapRef.current : mobileMapRef.current;
  };

  const attachResizeObserver = (container: HTMLDivElement | null) => {
    // Clean up any previous observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
    if (
      !container ||
      !googleMapRef.current ||
      typeof ResizeObserver === "undefined"
    )
      return;

    const ro = new ResizeObserver(() => {
      // Use rAF to coalesce multiple size changes
      requestAnimationFrame(() => {
        if (googleMapRef.current) {
          googleMapsService.triggerMapResize(googleMapRef.current);
        }
      });
    });

    ro.observe(container);
    resizeObserverRef.current = ro;
  };

  const createInContainer = (container: HTMLDivElement) => {
    console.log("🏗️ [MAP_INITIALIZATION] Creating map in container:", {
      container,
      containerVisible: container.offsetWidth > 0 && container.offsetHeight > 0,
      containerBounds: container.getBoundingClientRect(),
      isInitialized: isInitializedRef.current,
      currentContainer: currentContainerRef.current,
      hasExistingMap: !!googleMapRef.current,
      mapInstanceStats: googleMapsService.getMapInstanceStats(),
      timestamp: new Date().toISOString(),
    });

    // Clean up any existing maps in this container before creating a new one
    googleMapsService.cleanupContainerMaps(container);

    const map = googleMapsService.createMap(container);
    if (!map) {
      console.error("❌ [MAP_INITIALIZATION] Failed to create Google Map");
      return null;
    }

    console.log("✅ [MAP_INITIALIZATION] Map created successfully:", {
      mapInstance: map,
      container,
      timestamp: new Date().toISOString(),
    });

    googleMapRef.current = map;
    currentContainerRef.current = container;

    // Kick a resize after initial paint for tiles/layout correctness
    setTimeout(() => {
      if (googleMapRef.current) {
        console.log("🔄 [MAP_INITIALIZATION] Triggering initial map resize");
        googleMapsService.triggerMapResize(googleMapRef.current);
      }
    }, 60);

    attachResizeObserver(container);

    if (onMapReady) {
      console.log("🎯 [MAP_INITIALIZATION] Calling onMapReady callback");
      onMapReady(map);
    }
    return map;
  };

  // Initial create when both prerequisites are ready
  useEffect(() => {
    console.log("🎯 [MAP_INITIALIZATION] Initial useEffect triggered:", {
      isLocalStorageLoaded,
      isGoogleMapsLoaded,
      isInitialized: isInitializedRef.current,
      currentContainer: currentContainerRef.current,
      hasMapInstance: !!googleMapRef.current,
      timestamp: new Date().toISOString(),
    });

    if (typeof window === "undefined") {
      console.log("🌐 [MAP_INITIALIZATION] Skipping - window undefined (SSR)");
      return;
    }

    if (!isLocalStorageLoaded || !isGoogleMapsLoaded) {
      console.log("⏳ [MAP_INITIALIZATION] Prerequisites not ready:", {
        isLocalStorageLoaded,
        isGoogleMapsLoaded,
      });
      return;
    }

    const container = getVisibleContainer();
    if (!container) {
      console.log("❌ [MAP_INITIALIZATION] No visible container found");
      return;
    }

    console.log("🔍 [MAP_INITIALIZATION] Checking if already initialized:", {
      isInitialized: isInitializedRef.current,
      currentContainer: currentContainerRef.current,
      targetContainer: container,
      containersMatch: currentContainerRef.current === container,
      hasMapInstance: !!googleMapRef.current,
    });

    // If already initialized into this same container, skip
    if (
      isInitializedRef.current &&
      currentContainerRef.current === container &&
      googleMapRef.current
    ) {
      console.log(
        "✅ [MAP_INITIALIZATION] Already initialized in same container - skipping",
      );
      return;
    }

    console.log("🚀 [MAP_INITIALIZATION] Proceeding with map initialization");
    isInitializedRef.current = true;
    createInContainer(container);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocalStorageLoaded, isGoogleMapsLoaded]); // keep dependencies minimal

  // React to breakpoint changes (mobile <-> desktop)
  useEffect(() => {
    console.log("📱 [MAP_INITIALIZATION] Breakpoint useEffect triggered");

    if (typeof window === "undefined") {
      console.log(
        "🌐 [MAP_INITIALIZATION] Skipping breakpoint setup - window undefined (SSR)",
      );
      return;
    }

    const mql = window.matchMedia(DESKTOP_QUERY);
    mqlRef.current = mql;

    console.log("📊 [MAP_INITIALIZATION] Setting up media query listener:", {
      query: DESKTOP_QUERY,
      matches: mql.matches,
      currentContainer: currentContainerRef.current,
      hasMapInstance: !!googleMapRef.current,
    });

    const handleChange = () => {
      console.log("📱 [MAP_INITIALIZATION] Breakpoint changed:", {
        query: DESKTOP_QUERY,
        matches: mql.matches,
        currentContainer: currentContainerRef.current,
        hasMapInstance: !!googleMapRef.current,
        timestamp: new Date().toISOString(),
      });

      const nextContainer = getVisibleContainer();
      if (!nextContainer) {
        console.log(
          "❌ [MAP_INITIALIZATION] No container found for new breakpoint",
        );
        return;
      }

      // If the map is already in the right container, just trigger resize
      if (
        currentContainerRef.current === nextContainer &&
        googleMapRef.current
      ) {
        console.log(
          "🔄 [MAP_INITIALIZATION] Map already in correct container - triggering resize",
        );
        googleMapsService.triggerMapResize(googleMapRef.current);
        return;
      }

      // Otherwise, (re)create the map in the new container
      console.log("🔄 [MAP_INITIALIZATION] Moving map to new container:", {
        fromContainer: currentContainerRef.current,
        toContainer: nextContainer,
      });
      createInContainer(nextContainer);
    };

    // Some browsers want addEventListener, some support addListener
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handleChange);
    } else if (
      typeof (mql as { addListener?: (listener: () => void) => void })
        .addListener === "function"
    ) {
      (mql as { addListener: (listener: () => void) => void }).addListener(
        handleChange,
      );
    }

    return () => {
      if (!mqlRef.current) return;
      if (typeof mqlRef.current.removeEventListener === "function") {
        mqlRef.current.removeEventListener("change", handleChange);
      } else if (
        typeof (
          mqlRef.current as { removeListener?: (listener: () => void) => void }
        ).removeListener === "function"
      ) {
        (
          mqlRef.current as { removeListener: (listener: () => void) => void }
        ).removeListener(handleChange);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fallback: window resize/orientation (still useful if ResizeObserver not available)
  useEffect(() => {
    if (typeof window === "undefined") return;

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

        if (googleMapRef.current) {
          googleMapsService.triggerMapResize(googleMapRef.current);
        }
      });
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
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
