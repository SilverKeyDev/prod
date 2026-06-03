/// <reference types="google.maps" />
import { searchApi } from "packages/features/search/api/search";
import { buildIsochroneOverlayFromViewportRing } from "packages/features/search/utils/map/locationBoundsOverlay";
import {
  boundsToViewportPolygon,
  centroidOfViewportRing,
} from "packages/features/search/utils/map/mapViewport";
import { warnUnsupportedServiceArea } from "packages/features/search/utils/outcomes/searchOutcomeToast";
import { log } from "packages/logger";
import { hasProperty, isFunction, isObject } from "packages/utils";
import {
  isSupportedServiceAreaAddressComponents,
  isSupportedServiceAreaCoordinates,
  SUPPORTED_SERVICE_AREA_STATE_SHORT,
} from "packages/utils/search/locations/serviceAreaAvailability";
import {
  type GooglePlaceAddressComponentLike,
  isGooglePlacePreciseStreetAddress,
} from "packages/utils/search/places/isGooglePlacePreciseStreetAddress";

import type { SearchLocationBarMapDeps } from "./searchLocationBarMapDeps";
import {
  boundsFromPlace,
  boundsFromViewportRing,
  type GoogleSuggestion,
  type PreciseStreetAddressPayload,
  type SlipstreamSuggestion,
} from "./searchLocationBarTypes";

export type { SearchLocationBarMapDeps } from "./searchLocationBarMapDeps";

export async function selectSlipstreamSuggestionForLocationBar(
  suggestion: SlipstreamSuggestion,
  deps: SearchLocationBarMapDeps & {
    setIsLoadingBoundary: (v: boolean) => void;
  }
): Promise<void> {
  const {
    fitMapToBounds,
    setSearchAnchor,
    setLocationPlaceViewportFromBar,
    setLocalValue,
    setHasSelected,
    setSuggestions,
    setIsLoadingBoundary,
    onSearch,
  } = deps;

  setHasSelected(true);
  setSuggestions([]);
  setLocalValue(suggestion.area.label || suggestion.area.name);
  setIsLoadingBoundary(true);

  try {
    const resp = await searchApi.getAreaBoundary({ id: suggestion.area.id });
    if (!resp.success || !resp.viewport_ring || resp.viewport_ring.length < 3) {
      log.warn("SEARCH", "Area boundary unavailable, falling back", {
        areaId: suggestion.area.id,
        label: suggestion.area.label,
      });
      setIsLoadingBoundary(false);
      return;
    }

    const ring = resp.viewport_ring as Array<{ lat: number; lng: number }>;
    const apiCenter = resp.area?.center;
    const center: { lat: number; lng: number } =
      apiCenter && typeof apiCenter.lat === "number" && typeof apiCenter.lng === "number"
        ? { lat: apiCenter.lat, lng: apiCenter.lng }
        : centroidOfViewportRing(ring);
    const label = resp.area?.label ?? suggestion.description;

    if (!isSupportedServiceAreaCoordinates(center)) {
      log.warn("SEARCH", "Blocked Slipstream area outside supported service area", {
        areaId: suggestion.area.id,
        label,
      });
      warnUnsupportedServiceArea();
      setIsLoadingBoundary(false);
      return;
    }

    const bounds = boundsFromViewportRing(ring);
    if (bounds) {
      fitMapToBounds(bounds);
    }

    setSearchAnchor({ lat: center.lat, lng: center.lng });

    setLocationPlaceViewportFromBar({
      ring,
      label,
      overlay: buildIsochroneOverlayFromViewportRing(ring, center, label),
    });

    log.info("SEARCH", "Slipstream area boundary applied", {
      areaId: suggestion.area.id,
      label,
      geoType: suggestion.area.geoType,
      ringPoints: ring.length,
    });

    setIsLoadingBoundary(false);
    void onSearch();
  } catch (err: unknown) {
    log.error("ERRORS", "Failed to fetch area boundary", err);
    setIsLoadingBoundary(false);
  }
}

export async function resolveAreaViaSlipstreamForLocationBar(
  placeName: string,
  state: string | undefined,
  deps: SearchLocationBarMapDeps
): Promise<boolean> {
  const { fitMapToBounds, setSearchAnchor, setLocationPlaceViewportFromBar, setLocalValue } = deps;

  try {
    const resp = await searchApi.getAreaSuggestions({
      keyword: placeName,
      state: state ?? SUPPORTED_SERVICE_AREA_STATE_SHORT,
      limit: 1,
    });
    if (!resp.success || !resp.areas || resp.areas.length === 0) return false;

    const topArea = resp.areas[0];
    const boundaryResp = await searchApi.getAreaBoundary({ id: topArea.id });
    if (
      !boundaryResp.success ||
      !boundaryResp.viewport_ring ||
      boundaryResp.viewport_ring.length < 3
    ) {
      return false;
    }

    const ring = boundaryResp.viewport_ring as Array<{
      lat: number;
      lng: number;
    }>;
    const apiCenter = boundaryResp.area?.center;
    const center: { lat: number; lng: number } =
      apiCenter && typeof apiCenter.lat === "number" && typeof apiCenter.lng === "number"
        ? { lat: apiCenter.lat, lng: apiCenter.lng }
        : centroidOfViewportRing(ring);
    const label = boundaryResp.area?.label ?? placeName;

    if (!isSupportedServiceAreaCoordinates(center)) {
      log.warn("SEARCH", "Blocked resolved area outside supported service area", {
        placeName,
        areaId: topArea.id,
        label,
      });
      warnUnsupportedServiceArea();
      return false;
    }

    setLocalValue(label);

    const bounds = boundsFromViewportRing(ring);
    if (bounds) {
      fitMapToBounds(bounds);
    }
    setSearchAnchor({ lat: center.lat, lng: center.lng });
    setLocationPlaceViewportFromBar({
      ring,
      label,
      overlay: buildIsochroneOverlayFromViewportRing(ring, center, label),
    });

    log.info("SEARCH", "Google place resolved via Slipstream boundary", {
      placeName,
      areaId: topArea.id,
      label,
      geoType: topArea.geoType,
      ringPoints: ring.length,
    });
    return true;
  } catch (err: unknown) {
    log.warn("ERRORS", "Slipstream boundary fallback failed", err);
    return false;
  }
}

export type GoogleSelectDeps = SearchLocationBarMapDeps & {
  setIsLoadingBoundary: (v: boolean) => void;
  clearLocationPlaceSearchArea: () => void;
  onPreciseStreetAddressSelected?: (payload: PreciseStreetAddressPayload) => void;
};

export async function selectGoogleSuggestionForLocationBar(
  suggestion: GoogleSuggestion,
  deps: GoogleSelectDeps
): Promise<boolean> {
  const {
    fitMapToBounds,
    setSearchAnchor,
    setLocationPlaceViewportFromBar,
    setLocalValue,
    setHasSelected,
    setSuggestions,
    setIsLoadingBoundary,
    clearLocationPlaceSearchArea,
    onPreciseStreetAddressSelected,
    onSearch,
  } = deps;

  setHasSelected(true);
  let skipViewportSubmit = false;
  const placePrediction = suggestion.placePrediction as unknown as Record<string, unknown>;
  const place =
    placePrediction &&
    typeof placePrediction === "object" &&
    "toPlace" in placePrediction &&
    typeof placePrediction.toPlace === "function"
      ? (placePrediction as { toPlace: () => google.maps.places.Place }).toPlace()
      : null;

  if (isObject(place) && hasProperty(place, "fetchFields") && isFunction(place.fetchFields)) {
    try {
      await place.fetchFields({
        fields: ["formattedAddress", "viewport", "location", "types", "addressComponents", "id"],
      });
    } catch (error) {
      log.warn("ERRORS", "Error fetching place fields for search bar", error);
    }

    const formatted =
      hasProperty(place, "formattedAddress") && typeof place.formattedAddress === "string"
        ? place.formattedAddress
        : suggestion.description;

    const placeRecord = place as Record<string, unknown>;
    const typesRaw = placeRecord.types;
    const types = Array.isArray(typesRaw)
      ? typesRaw.filter((t): t is string => typeof t === "string")
      : undefined;
    const componentsRaw = placeRecord.addressComponents;
    const addressComponents = Array.isArray(componentsRaw)
      ? (componentsRaw as GooglePlaceAddressComponentLike[])
      : undefined;

    if (!isSupportedServiceAreaAddressComponents(addressComponents)) {
      log.warn("SEARCH", "Blocked Google place outside supported service area", {
        formatted,
      });
      warnUnsupportedServiceArea();
      clearLocationPlaceSearchArea();
      setSuggestions([]);
      return true;
    }

    setLocalValue(formatted);

    const isPreciseAddress = isGooglePlacePreciseStreetAddress({
      types,
      addressComponents,
    });

    if (!isPreciseAddress) {
      setIsLoadingBoundary(true);
      const stateComponent = addressComponents?.find((c) =>
        (c.types ?? []).includes("administrative_area_level_1")
      );
      const stateAbbr = stateComponent?.shortText ?? stateComponent?.short_name;
      const cityComponent = addressComponents?.find((c) => (c.types ?? []).includes("locality"));
      const searchName =
        cityComponent?.longText ?? cityComponent?.long_name ?? suggestion.description;

      const resolved = await resolveAreaViaSlipstreamForLocationBar(
        searchName,
        stateAbbr ?? SUPPORTED_SERVICE_AREA_STATE_SHORT,
        deps
      );
      setIsLoadingBoundary(false);

      if (resolved) {
        setSuggestions([]);
        void onSearch();
        return false;
      }
      log.warn("SEARCH", "Slipstream boundary unavailable, falling back to Google viewport", {
        searchName,
        state: stateAbbr,
      });
    }

    const bounds = boundsFromPlace(place as google.maps.places.Place);
    if (bounds) {
      fitMapToBounds(bounds);
      const ring = boundsToViewportPolygon(bounds);
      const center = centroidOfViewportRing(ring);
      setLocationPlaceViewportFromBar({
        ring,
        label: formatted,
        overlay: buildIsochroneOverlayFromViewportRing(ring, center, formatted),
      });
    } else {
      clearLocationPlaceSearchArea();
    }

    const pl = place as google.maps.places.Place;
    if (hasProperty(pl, "location") && pl.location) {
      const loc = pl.location as google.maps.LatLng;
      const lat = typeof loc.lat === "function" ? loc.lat() : loc.lat;
      const lng = typeof loc.lng === "function" ? loc.lng() : loc.lng;
      if (typeof lat === "number" && typeof lng === "number") {
        setSearchAnchor({ lat, lng });
        if (isPreciseAddress && onPreciseStreetAddressSelected) {
          const placeId =
            hasProperty(place, "id") && typeof place.id === "string" ? place.id : undefined;
          onPreciseStreetAddressSelected({
            formattedAddress: formatted,
            lat,
            lng,
            placeId,
          });
          skipViewportSubmit = true;
        }
      }
    }
  }

  setSuggestions([]);
  return skipViewportSubmit;
}
