import { useEffect, useRef } from "react";

import { log, LOG_CATEGORIES } from "logger";

import { screenUp } from "packages/schemas/app/ui/screens";
import { googleMapsService } from "packages/services/search/googleMaps";
import { useGoogleMapsStore } from "packages/store";
import { dateNow } from "packages/utils/core/date";
import { getWindow } from "packages/utils/core/platform";

type UseMapInitializationProps = {
  isLocalStorageLoaded: boolean;
  onMapReady?: (map: google.maps.Map) => void;
};

type UseMapInitializationReturn = {
  mobileMapRef: React.RefObject<HTMLDivElement>;
  desktopMapRef: React.RefObject<HTMLDivElement>;
  googleMapRef: React.RefObject<google.maps.Map | null>;
};

const DESKTOP_QUERY = screenUp("md");

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

  log.debug(LOG_CATEGORIES.MAP_RENDERING, "Map initialization hook render", {
    renderCount: renderCountRef.current,
    isLocalStorageLoaded,
    isGoogleMapsLoaded,
    isInitialized: isInitializedRef.current,
    hasMapInstance: !!googleMapRef.current,
    mapInstanceStats: googleMapsService.getMapInstanceStats(),
    timestamp: dateNow().toISOString(),
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
      log.debug(
        LOG_CATEGORIES.MAP_RENDERING,
        "Map initialization dependencies changed",
        {
          previous: lastRenderDepsRef.current,
          current: currentDeps,
          timestamp: dateNow().toISOString(),
        },
      );
    }
  }
  lastRenderDepsRef.current = currentDeps;

  const getVisibleContainer = () => {
    const win = getWindow();
    if (!win) return null;
    const isDesktop = win.matchMedia(DESKTOP_QUERY).matches;
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
    log.debug(LOG_CATEGORIES.MAP_RENDERING, "Creating map in container", {
      container,
      containerVisible: container.offsetWidth > 0 && container.offsetHeight > 0,
      containerBounds: container.getBoundingClientRect(),
      isInitialized: isInitializedRef.current,
      currentContainer: currentContainerRef.current,
      hasExistingMap: !!googleMapRef.current,
      mapInstanceStats: googleMapsService.getMapInstanceStats(),
      timestamp: dateNow().toISOString(),
    });

    // Clean up any existing maps in this container before creating a new one
    googleMapsService.cleanupContainerMaps(container);

    const map = googleMapsService.createMap(container);
    if (!map) {
      log.error(LOG_CATEGORIES.MAP_RENDERING, "Failed to create Google Map");
      return null;
    }

    log.debug(LOG_CATEGORIES.MAP_RENDERING, "Map created successfully", {
      mapInstance: map,
      container,
      timestamp: dateNow().toISOString(),
    });

    googleMapRef.current = map;
    currentContainerRef.current = container;

    // Kick a resize after initial paint for tiles/layout correctness
    setTimeout(() => {
      if (googleMapRef.current) {
        log.debug(
          LOG_CATEGORIES.MAP_RENDERING,
          "Triggering initial map resize",
        );
        googleMapsService.triggerMapResize(googleMapRef.current);
      }
    }, 60);

    attachResizeObserver(container);

    if (onMapReady) {
      log.debug(LOG_CATEGORIES.MAP_RENDERING, "Calling onMapReady callback");
      onMapReady(map);
    }
    return map;
  };

  // Initial create when both prerequisites are ready
  useEffect(() => {
    log.debug(LOG_CATEGORIES.MAP_RENDERING, "Initial useEffect triggered", {
      isLocalStorageLoaded,
      isGoogleMapsLoaded,
      isInitialized: isInitializedRef.current,
      currentContainer: currentContainerRef.current,
      hasMapInstance: !!googleMapRef.current,
      timestamp: dateNow().toISOString(),
    });

    if (!getWindow()) {
      log.debug(
        LOG_CATEGORIES.MAP_RENDERING,
        "Skipping - window undefined (SSR)",
      );
      return;
    }

    if (!isLocalStorageLoaded || !isGoogleMapsLoaded) {
      log.debug(LOG_CATEGORIES.MAP_RENDERING, "Prerequisites not ready", {
        isLocalStorageLoaded,
        isGoogleMapsLoaded,
      });
      return;
    }

    const container = getVisibleContainer();
    if (!container) {
      log.debug(LOG_CATEGORIES.MAP_RENDERING, "No visible container found");
      return;
    }

    log.debug(LOG_CATEGORIES.MAP_RENDERING, "Checking if already initialized", {
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
      log.debug(
        LOG_CATEGORIES.MAP_RENDERING,
        "Already initialized in same container - skipping",
      );
      return;
    }

    log.debug(
      LOG_CATEGORIES.MAP_RENDERING,
      "Proceeding with map initialization",
    );
    isInitializedRef.current = true;
    createInContainer(container);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocalStorageLoaded, isGoogleMapsLoaded]); // keep dependencies minimal

  // React to breakpoint changes (mobile <-> desktop)
  useEffect(() => {
    log.debug(LOG_CATEGORIES.MAP_RENDERING, "Breakpoint useEffect triggered");

    const win = getWindow();
    if (!win) {
      log.debug(
        LOG_CATEGORIES.MAP_RENDERING,
        "Skipping breakpoint setup - window undefined (SSR)",
      );
      return;
    }

    const mql = win.matchMedia(DESKTOP_QUERY);
    mqlRef.current = mql;

    log.debug(LOG_CATEGORIES.MAP_RENDERING, "Setting up media query listener", {
      query: DESKTOP_QUERY,
      matches: mql.matches,
      currentContainer: currentContainerRef.current,
      hasMapInstance: !!googleMapRef.current,
    });

    const handleChange = () => {
      log.debug(LOG_CATEGORIES.MAP_RENDERING, "Breakpoint changed", {
        query: DESKTOP_QUERY,
        matches: mql.matches,
        hasMapInstance: !!googleMapRef.current,
        timestamp: dateNow().toISOString(),
      });

      const nextContainer = getVisibleContainer();
      if (!nextContainer) {
        log.debug(
          LOG_CATEGORIES.MAP_RENDERING,
          "No container found for new breakpoint",
        );
        return;
      }

      // If the map is already in the right container, just trigger resize
      if (
        currentContainerRef.current === nextContainer &&
        googleMapRef.current
      ) {
        log.debug(
          LOG_CATEGORIES.MAP_RENDERING,
          "Map already in correct container - triggering resize",
        );
        googleMapsService.triggerMapResize(googleMapRef.current);
        return;
      }

      // Otherwise, (re)create the map in the new container
      log.debug(LOG_CATEGORIES.MAP_RENDERING, "Moving map to new container", {
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
    const win = getWindow();
    if (!win) return;

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

    win.addEventListener("resize", onResize);
    win.addEventListener("orientationchange", onResize);
    return () => {
      win.removeEventListener("resize", onResize);
      win.removeEventListener("orientationchange", onResize);
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
