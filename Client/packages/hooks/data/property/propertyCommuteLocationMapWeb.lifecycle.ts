import type { MutableRefObject } from "react";

import type { GoogleAdvancedMarkerElement } from "packages/features/search/hooks/data/useMapMarkers/types";
import { getAdvancedMarkerElement } from "packages/features/search/hooks/data/useMapMarkers/updateMarkersHelpers";
import {
  clearIsochroneOverlays,
  renderIsochronePolygon,
} from "packages/features/search/types/search/map/isochroneRenderer";
import {
  createCommuteDestinationPinElement,
  createListingLocationPinElement,
} from "packages/features/search/types/search/map/listingLocationPin";
import {
  attachInlineStreetViewPanorama,
  googleMapsService,
  type InlineStreetViewAttachment,
  PROPERTY_DETAILS_NEIGHBORHOOD_ZOOM,
} from "packages/features/search/utils/googleMaps";
import { log } from "packages/logger";
import type { IsochroneData } from "packages/types/domain/api";
import { getWindow } from "packages/utils/platform";
import type { CommuteMapDestination } from "packages/utils/propertyDetails/location/commuteMapDestinations";

import {
  COMMUTE_ROUTE_COLORS,
  fetchDrivingPath,
  geocodeToLatLng,
} from "./propertyCommuteLocationMapWeb.routing";

export type CommuteMapWebRefs = {
  homeMarkerRef: MutableRefObject<GoogleAdvancedMarkerElement | null>;
  destinationMarkersRef: MutableRefObject<GoogleAdvancedMarkerElement[]>;
  polylinesRef: MutableRefObject<google.maps.Polyline[]>;
  mapInstanceRef: MutableRefObject<google.maps.Map | null>;
  streetViewRef: MutableRefObject<InlineStreetViewAttachment | null>;
  isochronePolygonRef: MutableRefObject<google.maps.Polygon | null>;
  isochroneIndividualRef: MutableRefObject<google.maps.Polygon[]>;
};

export type CommuteMapWebSetupParams = CommuteMapWebRefs & {
  container: HTMLDivElement;
  streetViewContainer: HTMLDivElement;
  originLat: number;
  originLng: number;
  listingMarkerTitle: string;
  destinations: CommuteMapDestination[];
  searchOverlay: IsochroneData | null;
  cancelled: () => boolean;
};

export function disposeCommuteMapWebState(
  container: HTMLDivElement,
  refs: CommuteMapWebRefs
): void {
  const mapForIso = refs.mapInstanceRef.current;
  if (mapForIso) {
    clearIsochroneOverlays({
      map: mapForIso,
      polygonRef: refs.isochronePolygonRef,
      individualPolygonsRef: refs.isochroneIndividualRef,
      focusOnCurrentProperty: () => {},
    });
  }
  if (refs.streetViewRef.current) {
    try {
      refs.streetViewRef.current.dispose();
    } catch {
      /* ignore */
    }
    refs.streetViewRef.current = null;
  }
  if (refs.homeMarkerRef.current) {
    try {
      refs.homeMarkerRef.current.setMap(null);
    } catch {
      /* marker may already be detached */
    }
    refs.homeMarkerRef.current = null;
  }
  refs.destinationMarkersRef.current.forEach((m) => {
    try {
      m.setMap(null);
    } catch {
      /* ignore */
    }
  });
  refs.destinationMarkersRef.current = [];
  refs.polylinesRef.current.forEach((p) => {
    try {
      p.setMap(null);
    } catch {
      /* ignore */
    }
  });
  refs.polylinesRef.current = [];
  refs.mapInstanceRef.current = null;
  googleMapsService.cleanupContainerMaps(container);
}

export async function runCommuteMapWebSetup(params: CommuteMapWebSetupParams): Promise<void> {
  const {
    container,
    streetViewContainer,
    originLat,
    originLng,
    listingMarkerTitle,
    destinations,
    searchOverlay,
    cancelled,
    homeMarkerRef,
    destinationMarkersRef,
    polylinesRef,
    mapInstanceRef,
    streetViewRef,
    isochronePolygonRef,
    isochroneIndividualRef,
  } = params;

  const win = getWindow() as (Window & { google?: typeof google }) | null;
  if (!win?.google?.maps?.event) {
    return;
  }

  const triggerResize = () => {
    if (cancelled()) return;
    const m = mapInstanceRef.current;
    if (m && win.google?.maps?.event) {
      win.google.maps.event.trigger(m, "resize");
    }
    const sv = streetViewRef.current?.panorama;
    if (sv && win.google?.maps?.event) {
      win.google.maps.event.trigger(sv, "resize");
    }
  };

  if (cancelled() || !container.isConnected) {
    return;
  }

  const map = googleMapsService.createMap(container, {
    streetViewControl: true,
    streetViewControlOptions: {
      position: win.google.maps.ControlPosition.RIGHT_TOP,
    },
  });
  if (!map || cancelled()) {
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

  const streetView = attachInlineStreetViewPanorama(map, streetViewContainer, origin);
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
      log.warn("PROPERTY_DETAILS", "Commute map: failed to create home marker", e);
    }
  } else {
    log.warn(
      "PROPERTY_DETAILS",
      "Commute map: AdvancedMarkerElement not available for home marker"
    );
  }

  if (searchOverlay) {
    try {
      renderIsochronePolygon(searchOverlay, {
        map,
        polygonRef: isochronePolygonRef,
        individualPolygonsRef: isochroneIndividualRef,
        focusOnCurrentProperty: () => {},
      });
    } catch (e) {
      log.warn("PROPERTY_DETAILS", "Commute map: isochrone overlay failed", e);
    }
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
    if (cancelled()) break;
    const dest = destinations[i];
    const destLatLng = await geocodeToLatLng(geocoder, dest.address);
    if (cancelled() || !destLatLng) {
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
        log.warn("PROPERTY_DETAILS", "Commute map: destination marker failed", e);
      }
    }

    let path: google.maps.LatLng[] | null = null;
    const enc = dest.encodedPolyline;
    if (enc && win.google?.maps?.geometry?.encoding?.decodePath) {
      try {
        path = win.google.maps.geometry.encoding.decodePath(enc);
      } catch {
        path = null;
      }
    }
    if (!path?.length) {
      path = await fetchDrivingPath(origin, destLatLng);
    }
    if (cancelled() || !path?.length) {
      continue;
    }
    const polyline = new win.google.maps.Polyline({
      path,
      strokeColor: COMMUTE_ROUTE_COLORS[i % COMMUTE_ROUTE_COLORS.length],
      strokeOpacity: 0.88,
      strokeWeight: 4,
      map,
    });
    polylinesRef.current.push(polyline);
  }

  if (cancelled()) {
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
}
