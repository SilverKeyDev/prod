import { useEffect, useRef } from "react";

import { color } from "packages/design-tokens";
import type { GoogleAdvancedMarkerElement } from "packages/features/search/hooks/data/useMapMarkers/types";
import { getAdvancedMarkerElement } from "packages/features/search/hooks/data/useMapMarkers/updateMarkersHelpers";
import {
  createCommuteDestinationPinElement,
  createListingLocationPinElement,
} from "packages/features/search/types/search/listingLocationPin";
import {
  attachInlineStreetViewPanorama,
  googleMapsService,
  type InlineStreetViewAttachment,
  PROPERTY_DETAILS_NEIGHBORHOOD_ZOOM,
} from "packages/features/search/utils/googleMaps";
import { log, LOG_CATEGORIES } from "packages/logger";
import { getWindow } from "packages/utils/platform";

import { useGoogleMaps } from "./useGoogleMaps";
import type { UsePropertyCommuteLocationMapParams } from "./usePropertyCommuteLocationMap";

const ROUTE_COLORS = [
  color("olive.DEFAULT"),
  color("brown.DEFAULT"),
  color("gold.DEFAULT"),
  "#2563eb",
  "#7c3aed",
];

function geocodeToLatLng(
  geocoder: google.maps.Geocoder,
  address: string,
): Promise<google.maps.LatLngLiteral | null> {
  return new Promise((resolve) => {
    void geocoder.geocode({ address }, (results, status) => {
      if (status !== "OK" || !results?.[0]?.geometry?.location) {
        resolve(null);
        return;
      }
      const loc = results[0].geometry.location;
      resolve({ lat: loc.lat(), lng: loc.lng() });
    });
  });
}

// JS `Route.computeRoutes` uses LatLngLiteral at top level — not REST `{ location: { latLng } }`.
// See: https://developers.google.com/maps/documentation/javascript/routes/get-a-route

// Type definitions for Routes API (not yet in @types/google.maps)
interface RoutesAPI {
  Route: {
    computeRoutes(request: {
      origin: google.maps.LatLngLiteral | string;
      destination: google.maps.LatLngLiteral | string;
      travelMode: string;
      computeAlternativeRoutes?: boolean;
      routeModifiers?: {
        avoidTolls?: boolean;
        avoidHighways?: boolean;
        avoidFerries?: boolean;
      };
      fields?: string[];
    }): Promise<{
      routes: Array<{
        polyline: {
          encodedPolyline: string;
        };
      }>;
    }>;
  };
}

async function fetchDrivingPath(
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral,
): Promise<google.maps.LatLng[] | null> {
  const win = getWindow() as
    | (Window & {
        google?: typeof google & {
          maps: typeof google.maps & { routes?: RoutesAPI };
        };
      })
    | null;

  // Try to use new Routes API first
  if (win?.google?.maps?.routes?.Route?.computeRoutes) {
    try {
      const request = {
        origin,
        destination,
        travelMode: "DRIVING",
        computeAlternativeRoutes: false,
        routeModifiers: {
          avoidTolls: false,
          avoidHighways: false,
          avoidFerries: false,
        },
        fields: ["path"],
      };

      const response =
        await win.google.maps.routes.Route.computeRoutes(request);

      if (!response?.routes?.[0]) {
        return null;
      }

      const route = response.routes[0];
      const polyline = route.polyline;

      if (!polyline?.encodedPolyline) {
        return null;
      }

      // Decode the polyline to get LatLng array
      if (!win.google?.maps?.geometry?.encoding?.decodePath) {
        log.warn(
          LOG_CATEGORIES.PROPERTY_DETAILS,
          "Geometry library not available for polyline decoding",
        );
        return null;
      }

      const path = win.google.maps.geometry.encoding.decodePath(
        polyline.encodedPolyline,
      );
      return path;
    } catch (error) {
      log.error(
        LOG_CATEGORIES.PROPERTY_DETAILS,
        "Failed to compute route with Routes API - ensure 'routes' library is loaded",
        { error, hasRoutesAPI: !!win?.google?.maps?.routes },
      );
      // Fall through to DirectionsService fallback
    }
  }

  // Fallback to DirectionsService
  log.warn(
    LOG_CATEGORIES.PROPERTY_DETAILS,
    "Routes API not available, using DirectionsService (deprecated)",
  );

  if (!win?.google?.maps?.DirectionsService) {
    return null;
  }

  return new Promise((resolve) => {
    const ds = new win.google.maps.DirectionsService();
    void ds.route(
      {
        origin,
        destination,
        travelMode: win.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (
          status !== win.google.maps.DirectionsStatus.OK ||
          !result?.routes[0]
        ) {
          resolve(null);
          return;
        }
        const path = result.routes[0].overview_path ?? [];
        resolve(path);
      },
    );
  });
}

/**
 * Interactive Google Map (same defaults as property location map) with listing pin, commute
 * destination pins, and driving route polylines. Cleans up on unmount.
 */
export function usePropertyCommuteLocationMap(
  params: UsePropertyCommuteLocationMapParams,
): void {
  const {
    mapContainer: mapContainerRaw,
    streetViewContainer: streetViewContainerRaw,
    originLat,
    originLng,
    listingMarkerTitle,
    destinations,
    enabled,
  } = params;
  const mapContainer = mapContainerRaw as HTMLDivElement | null;
  const streetViewContainer = streetViewContainerRaw as HTMLDivElement | null;
  const destinationKey = JSON.stringify(
    destinations.map((d) => ({ a: d.address, l: d.label })),
  );
  const { isLoaded } = useGoogleMaps();
  const homeMarkerRef = useRef<GoogleAdvancedMarkerElement | null>(null);
  const destinationMarkersRef = useRef<GoogleAdvancedMarkerElement[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const streetViewRef = useRef<InlineStreetViewAttachment | null>(null);

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
      if (homeMarkerRef.current) {
        try {
          homeMarkerRef.current.setMap(null);
        } catch {
          /* marker may already be detached */
        }
        homeMarkerRef.current = null;
      }
      destinationMarkersRef.current.forEach((m) => {
        try {
          m.setMap(null);
        } catch {
          /* ignore */
        }
      });
      destinationMarkersRef.current = [];
      polylinesRef.current.forEach((p) => {
        try {
          p.setMap(null);
        } catch {
          /* ignore */
        }
      });
      polylinesRef.current = [];
      mapInstanceRef.current = null;
      googleMapsService.cleanupContainerMaps(container);
    };

    const resizeObserver = new ResizeObserver(() => {
      triggerResize();
    });
    resizeObserver.observe(container);

    const setup = async () => {
      if (cancelled || !container.isConnected) {
        return;
      }

      const map = googleMapsService.createMap(container, {
        streetViewControl: true,
        streetViewControlOptions: {
          position: win.google.maps.ControlPosition.RIGHT_TOP,
        },
      });
      if (!map || cancelled) {
        return;
      }

      mapInstanceRef.current = map;
      const origin = { lat: originLat, lng: originLng };
      map.setCenter(origin);
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
        origin,
      );
      if (streetView) {
        streetViewRef.current = streetView;
      }

      const MarkerCtor = getAdvancedMarkerElement();
      if (MarkerCtor) {
        try {
          const content = createListingLocationPinElement();
          const marker = new MarkerCtor({
            map,
            position: origin,
            title: listingMarkerTitle,
            content,
          }) as unknown as GoogleAdvancedMarkerElement;
          homeMarkerRef.current = marker;
        } catch (e) {
          log.warn(
            LOG_CATEGORIES.PROPERTY_DETAILS,
            "Commute map: failed to create home marker",
            e,
          );
        }
      } else {
        log.warn(
          LOG_CATEGORIES.PROPERTY_DETAILS,
          "Commute map: AdvancedMarkerElement not available for home marker",
        );
      }

      if (destinations.length === 0) {
        triggerResize();
        requestAnimationFrame(triggerResize);
        setTimeout(triggerResize, 150);
        return;
      }

      if (!win.google?.maps?.Geocoder) {
        triggerResize();
        requestAnimationFrame(triggerResize);
        setTimeout(triggerResize, 150);
        return;
      }

      const geocoder = new win.google.maps.Geocoder();
      const bounds = new win.google.maps.LatLngBounds();
      bounds.extend(origin);

      for (let i = 0; i < destinations.length; i++) {
        if (cancelled) break;
        const dest = destinations[i];
        const destLatLng = await geocodeToLatLng(geocoder, dest.address);
        if (cancelled || !destLatLng) {
          continue;
        }
        bounds.extend(destLatLng);

        if (MarkerCtor) {
          try {
            const destContent = createCommuteDestinationPinElement();
            const dMarker = new MarkerCtor({
              map,
              position: destLatLng,
              title: dest.label,
              content: destContent,
            }) as unknown as GoogleAdvancedMarkerElement;
            destinationMarkersRef.current.push(dMarker);
          } catch (e) {
            log.warn(
              LOG_CATEGORIES.PROPERTY_DETAILS,
              "Commute map: destination marker failed",
              e,
            );
          }
        }

        const path = await fetchDrivingPath(origin, destLatLng);
        if (cancelled || !path?.length) {
          continue;
        }
        const polyline = new win.google.maps.Polyline({
          path,
          strokeColor: ROUTE_COLORS[i % ROUTE_COLORS.length],
          strokeOpacity: 0.88,
          strokeWeight: 4,
          map,
        });
        polylinesRef.current.push(polyline);
      }

      if (cancelled) {
        return;
      }

      try {
        if (destinations.length > 0) {
          map.fitBounds(bounds, 48);
        }
      } catch {
        map.setCenter(origin);
        map.setZoom(PROPERTY_DETAILS_NEIGHBORHOOD_ZOOM);
      }

      triggerResize();
      requestAnimationFrame(triggerResize);
      setTimeout(triggerResize, 150);
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
        void setup();
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
    // destinationKey serializes destinations; including destinations[] would duplicate and trigger on reference churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- destinations captured via destinationKey
  }, [
    enabled,
    isLoaded,
    mapContainer,
    streetViewContainer,
    originLat,
    originLng,
    listingMarkerTitle,
    destinationKey,
  ]);
}
