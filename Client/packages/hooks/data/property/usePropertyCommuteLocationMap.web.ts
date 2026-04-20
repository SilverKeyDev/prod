import { useEffect, useMemo, useRef } from "react";

import type { GoogleAdvancedMarkerElement } from "packages/features/search/hooks/data/useMapMarkers/types";
import type { InlineStreetViewAttachment } from "packages/features/search/utils/googleMaps";
import { getWindow } from "packages/utils/platform";

import {
  disposeCommuteMapWebState,
  runCommuteMapWebSetup,
} from "./propertyCommuteLocationMapWeb.lifecycle";
import { useGoogleMaps } from "./useGoogleMaps";
import type { UsePropertyCommuteLocationMapParams } from "./usePropertyCommuteLocationMap";

/**
 * Interactive Google Map (same defaults as property location map) with listing pin, commute
 * destination pins, and driving route polylines. Cleans up on unmount.
 */
export function usePropertyCommuteLocationMap(params: UsePropertyCommuteLocationMapParams): void {
  const {
    mapContainer: mapContainerRaw,
    streetViewContainer: streetViewContainerRaw,
    originLat,
    originLng,
    listingMarkerTitle,
    destinations,
    enabled,
    searchOverlay = null,
  } = params;
  const mapContainer = mapContainerRaw as HTMLDivElement | null;
  const streetViewContainer = streetViewContainerRaw as HTMLDivElement | null;
  const destinationKey = JSON.stringify(
    destinations.map((d) => ({
      a: d.address,
      l: d.label,
      p: d.encodedPolyline ?? null,
    }))
  );
  const searchOverlayKey = useMemo(() => {
    if (!searchOverlay) {
      return "";
    }
    try {
      const g = (searchOverlay as { isochrone?: { geometry?: unknown } }).isochrone?.geometry;
      return JSON.stringify(g ?? null);
    } catch {
      return "isochrone";
    }
  }, [searchOverlay]);
  const { isLoaded } = useGoogleMaps();
  const homeMarkerRef = useRef<GoogleAdvancedMarkerElement | null>(null);
  const destinationMarkersRef = useRef<GoogleAdvancedMarkerElement[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const streetViewRef = useRef<InlineStreetViewAttachment | null>(null);
  const isochronePolygonRef = useRef<google.maps.Polygon | null>(null);
  const isochroneIndividualRef = useRef<google.maps.Polygon[]>([]);

  useEffect(() => {
    if (!enabled || !isLoaded || !mapContainer || !streetViewContainer) {
      return;
    }

    const win = getWindow() as (Window & { google?: typeof google }) | null;
    if (!win?.google?.maps?.event) {
      return;
    }

    let cancelled = false;
    const container = mapContainer;

    const refsBundle = {
      homeMarkerRef,
      destinationMarkersRef,
      polylinesRef,
      mapInstanceRef,
      streetViewRef,
      isochronePolygonRef,
      isochroneIndividualRef,
    };

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

    const resizeObserver = new ResizeObserver(() => {
      triggerResize();
    });
    resizeObserver.observe(container);

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
        void runCommuteMapWebSetup({
          container,
          streetViewContainer,
          originLat,
          originLng,
          listingMarkerTitle,
          destinations,
          searchOverlay,
          cancelled: () => cancelled,
          ...refsBundle,
        });
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(outerRafId);
      if (innerRafId != null) {
        cancelAnimationFrame(innerRafId);
      }
      resizeObserver.disconnect();
      disposeCommuteMapWebState(container, refsBundle);
    };
    // destinationKey serializes destinations; searchOverlayKey serializes isochrone geometry.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable keys for destinations and overlay
  }, [
    enabled,
    isLoaded,
    mapContainer,
    streetViewContainer,
    originLat,
    originLng,
    listingMarkerTitle,
    destinationKey,
    searchOverlayKey,
  ]);
}
