import type { AreaSearchResult } from "packages/types/domain/api";
import { hasProperty } from "packages/utils";
import { getWindow } from "packages/utils/platform";

// ---------------------------------------------------------------------------
// Suggestion types
// ---------------------------------------------------------------------------

export interface GooglePlacePrediction {
  text: { text: string };
  toPlace: () => google.maps.places.Place;
}

export type GoogleSuggestion = {
  kind: "google";
  placePrediction: GooglePlacePrediction;
  description: string;
};

export type SlipstreamSuggestion = {
  kind: "slipstream";
  area: AreaSearchResult;
  description: string;
};

export type Suggestion = GoogleSuggestion | SlipstreamSuggestion;

// ---------------------------------------------------------------------------
// Exported prop / payload types
// ---------------------------------------------------------------------------

export type PreciseStreetAddressPayload = {
  formattedAddress: string;
  lat: number;
  lng: number;
  placeId?: string;
};

export type SearchLocationBarWebProps = {
  scriptsReady: boolean;
  fitMapToBounds: (bounds: google.maps.LatLngBounds) => void;
  onSearch: () => void | Promise<void>;
  locationPlaceholder: string;
  onPreciseStreetAddressSelected?: (payload: PreciseStreetAddressPayload) => void;
};

// ---------------------------------------------------------------------------
// Geo-type display helpers
// ---------------------------------------------------------------------------

export const GEO_TYPE_LABELS: Record<string, string> = {
  "area/neighborhood": "Neighborhood",
  "area/postal-city": "City",
  "area/census-place": "City",
  "area/county": "County",
  "area/zipcode": "ZIP Code",
  "area/township": "Township",
};

export function geoTypeIcon(geoType: string): string {
  if (geoType === "area/neighborhood") return "map-pin";
  if (geoType.includes("city") || geoType.includes("place")) return "building-2";
  if (geoType === "area/county") return "map";
  if (geoType === "area/zipcode") return "hash";
  return "map-pin";
}

// ---------------------------------------------------------------------------
// Google Maps bounds helpers
// ---------------------------------------------------------------------------

export function boundsFromPlace(place: google.maps.places.Place): google.maps.LatLngBounds | null {
  const win = getWindow() as Window & { google?: typeof google };
  const g = win?.google;
  if (!g?.maps?.LatLngBounds) return null;

  if (hasProperty(place, "viewport") && place.viewport) {
    const v = place.viewport as google.maps.LatLngBounds;
    if (typeof v.getNorthEast === "function" && typeof v.getSouthWest === "function") {
      return v;
    }
  }

  if (hasProperty(place, "location") && place.location) {
    const loc = place.location as google.maps.LatLng;
    const lat = Number(typeof loc.lat === "function" ? loc.lat() : loc.lat);
    const lng = Number(typeof loc.lng === "function" ? loc.lng() : loc.lng);
    const delta = 0.06;
    return new g.maps.LatLngBounds(
      { lat: lat - delta, lng: lng - delta },
      { lat: lat + delta, lng: lng + delta }
    );
  }

  return null;
}

export function boundsFromViewportRing(
  ring: Array<{ lat: number; lng: number }>
): google.maps.LatLngBounds | null {
  const win = getWindow() as Window & { google?: typeof google };
  const g = win?.google;
  if (!g?.maps?.LatLngBounds || ring.length < 3) return null;

  const bounds = new g.maps.LatLngBounds();
  for (const pt of ring) {
    bounds.extend({ lat: pt.lat, lng: pt.lng });
  }
  return bounds;
}
