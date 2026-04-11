import { useEffect, useRef } from "react";

import type { GoogleAdvancedMarkerElement } from "packages/features/search/hooks/data/useMapMarkers/types";
import { getAdvancedMarkerElement } from "packages/features/search/hooks/data/useMapMarkers/updateMarkersHelpers";
import { createListingLocationPinElement } from "packages/features/search/types/search/listingLocationPin";
import {
  attachInlineStreetViewPanorama,
  googleMapsService,
  type InlineStreetViewAttachment,
  PROPERTY_DETAILS_NEIGHBORHOOD_ZOOM,
} from "packages/features/search/utils/googleMaps";
import { log, LOG_CATEGORIES } from "packages/logger";
import { getWindow } from "packages/utils/platform";

import { useGoogleMaps } from "./useGoogleMaps";

export type UsePropertyDetailsLocationMapParams = {
  mapContainer: HTMLDivElement | null;
  /** Overlay host for {@link google.maps.StreetViewPanorama}. */
  streetViewContainer: HTMLDivElement | null;
  lat: number;
  lng: number;
  markerTitle: string;
  enabled: boolean;
  satelliteMode: boolean;
  streetViewOpen: boolean;
  onStreetViewVisibilityChange?: (visible: boolean) => void;
};

function applyMapBasemap(map: google.maps.Map, satelliteMode: boolean): void {
  const win = getWindow() as (Window & { google?: typeof google }) | null;
  if (!win?.google?.maps?.MapTypeId) {
    return;
  }
  map.setMapTypeId(
    satelliteMode
      ? win.google.maps.MapTypeId.HYBRID
      : win.google.maps.MapTypeId.ROADMAP,
  );
}

function scheduleUntilMapReady(run: () => void): () => void {
  run();
  const raf1 = requestAnimationFrame(run);
  const t0 = setTimeout(run, 0);
  const t150 = setTimeout(run, 150);
  return () => {
    cancelAnimationFrame(raf1);
    clearTimeout(t0);
    clearTimeout(t150);
  };
}

/**
 * Renders a Google Map (same Cloud Map ID / defaults as search) centered on one listing with
 * optional inline Street View and a single advanced marker. Cleans up on unmount or when inputs change.
 */
export function usePropertyDetailsLocationMap(
  params: UsePropertyDetailsLocationMapParams,
): void {
  const {
    mapContainer,
    streetViewContainer,
    lat,
    lng,
    markerTitle,
    enabled,
    satelliteMode,
    streetViewOpen,
    onStreetViewVisibilityChange,
  } = params;
  const { isLoaded } = useGoogleMaps();
  const markerRef = useRef<GoogleAdvancedMarkerElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const streetViewRef = useRef<InlineStreetViewAttachment | null>(null);
  const satelliteModeRef = useRef(satelliteMode);
  satelliteModeRef.current = satelliteMode;
  const streetViewOpenRef = useRef(streetViewOpen);
  streetViewOpenRef.current = streetViewOpen;
  const onStreetViewVisibilityChangeRef = useRef(onStreetViewVisibilityChange);
  onStreetViewVisibilityChangeRef.current = onStreetViewVisibilityChange;

  useEffect(() => {
    if (!enabled || !isLoaded || !mapContainer || !streetViewContainer) {
      if (enabled) {
        log.debug(
          LOG_CATEGORIES.PROPERTY_DETAILS,
          "Property details map: init waiting",
          {
            isLoaded,
            hasMapContainer: mapContainer != null,
            hasStreetViewContainer: streetViewContainer != null,
            lat,
            lng,
          },
        );
      }
      return;
    }

    const win = getWindow() as (Window & { google?: typeof google }) | null;
    if (!win?.google?.maps?.event) {
      log.debug(
        LOG_CATEGORIES.PROPERTY_DETAILS,
        "Property details map: google.maps.event missing",
        {
          lat,
          lng,
        },
      );
      return;
    }

    let cancelled = false;
    const container = mapContainer;

    const triggerResize = () => {
      if (cancelled) return;
      const m = mapInstanceRef.current;
      if (m && win.google?.maps?.event) {
        win.google.maps.event.trigger(m, "resize");
      }
      const sv = streetViewRef.current?.panorama;
      if (sv && win.google?.maps?.event) {
        win.google.maps.event.trigger(sv, "resize");
      }
    };

    const dispose = () => {
      if (streetViewRef.current) {
        try {
          streetViewRef.current.dispose();
        } catch {
          /* ignore */
        }
        streetViewRef.current = null;
      }
      if (markerRef.current) {
        try {
          markerRef.current.setMap(null);
        } catch {
          /* marker may already be detached */
        }
        markerRef.current = null;
      }
      mapInstanceRef.current = null;
      googleMapsService.cleanupContainerMaps(container);
    };

    const resizeObserver = new ResizeObserver(() => {
      triggerResize();
    });
    resizeObserver.observe(container);

    const setup = () => {
      if (cancelled || !container.isConnected) {
        log.debug(
          LOG_CATEGORIES.PROPERTY_DETAILS,
          "Property details map: setup skipped",
          {
            cancelled,
            containerConnected: container.isConnected,
          },
        );
        return;
      }

      const map = googleMapsService.createMap(container, {
        streetViewControl: false,
      });
      if (!map || cancelled) {
        if (!cancelled) {
          log.warn(
            LOG_CATEGORIES.PROPERTY_DETAILS,
            "Property details map: createMap returned null",
            {
              containerConnected: container.isConnected,
              lat,
              lng,
            },
          );
        }
        return;
      }

      mapInstanceRef.current = map;
      applyMapBasemap(map, satelliteModeRef.current);
      map.setCenter({ lat, lng });
      map.setZoom(PROPERTY_DETAILS_NEIGHBORHOOD_ZOOM);

      if (streetViewRef.current) {
        try {
          streetViewRef.current.dispose();
        } catch {
          /* ignore */
        }
        streetViewRef.current = null;
      }

      const streetView = attachInlineStreetViewPanorama(
        map,
        streetViewContainer,
        { lat, lng },
        {
          onVisibleChange: (visible) => {
            onStreetViewVisibilityChangeRef.current?.(visible);
          },
        },
      );
      if (streetView) {
        streetViewRef.current = streetView;
        streetView.panorama.setVisible(streetViewOpenRef.current);
      } else {
        log.debug(
          LOG_CATEGORIES.PROPERTY_DETAILS,
          "Property details map: inline Street View not attached",
          {
            streetViewContainerConnected: streetViewContainer.isConnected,
            lat,
            lng,
          },
        );
      }

      const MarkerCtor = getAdvancedMarkerElement();
      if (MarkerCtor) {
        try {
          const content = createListingLocationPinElement();
          const marker = new MarkerCtor({
            map,
            position: { lat, lng },
            title: markerTitle,
            content,
          }) as unknown as GoogleAdvancedMarkerElement;
          markerRef.current = marker;
        } catch (e) {
          log.warn(
            LOG_CATEGORIES.PROPERTY_DETAILS,
            "Property details map: failed to create marker",
            e,
          );
        }
      } else {
        log.warn(
          LOG_CATEGORIES.PROPERTY_DETAILS,
          "Property details map: AdvancedMarkerElement not available",
        );
      }

      triggerResize();
      requestAnimationFrame(triggerResize);
      setTimeout(triggerResize, 150);

      log.debug(
        LOG_CATEGORIES.PROPERTY_DETAILS,
        "Property details map: init complete",
        {
          lat,
          lng,
          zoom: PROPERTY_DETAILS_NEIGHBORHOOD_ZOOM,
          markerCreated: markerRef.current != null,
          satelliteMode: satelliteModeRef.current,
          streetViewLinked: streetViewRef.current != null,
        },
      );
    };

    let innerRafId: number | null = null;
    const outerRafId = requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }
      innerRafId = requestAnimationFrame(() => {
        innerRafId = null;
        if (cancelled) {
          return;
        }
        setup();
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(outerRafId);
      if (innerRafId != null) {
        cancelAnimationFrame(innerRafId);
      }
      resizeObserver.disconnect();
      dispose();
    };
  }, [
    enabled,
    isLoaded,
    mapContainer,
    streetViewContainer,
    lat,
    lng,
    markerTitle,
  ]);

  useEffect(() => {
    if (!enabled || !isLoaded) {
      return;
    }
    return scheduleUntilMapReady(() => {
      const map = mapInstanceRef.current;
      if (!map) {
        return;
      }
      applyMapBasemap(map, satelliteMode);
    });
  }, [enabled, isLoaded, satelliteMode]);

  useEffect(() => {
    if (!enabled || !isLoaded) {
      return;
    }
    return scheduleUntilMapReady(() => {
      const panorama = streetViewRef.current?.panorama;
      if (!panorama) {
        return;
      }
      panorama.setVisible(streetViewOpen);
    });
  }, [enabled, isLoaded, streetViewOpen]);
}
