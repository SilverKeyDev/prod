/// <reference types="google.maps" />
import { searchApi } from "packages/features/search/api/search";
import { buildIsochroneOverlayFromViewportRing } from "packages/features/search/utils/map/locationBoundsOverlay";
import {
  boundsToViewportPolygon,
  centroidOfViewportRing,
} from "packages/features/search/utils/map/mapViewport";
import { warnUnsupportedServiceArea } from "packages/features/search/utils/outcomes/searchOutcomeToast";
import { log } from "packages/logger";
import { getWindow } from "packages/utils/core/platform";
import {
  isSupportedServiceAreaAddressComponents,
  isSupportedServiceAreaCoordinates,
  SUPPORTED_SERVICE_AREA_STATE_SHORT,
} from "packages/utils/product/search/locations/serviceAreaAvailability";

import type { SearchLocationBarMapDeps } from "./searchLocationBarMapDeps";
import { boundsFromViewportRing } from "./searchLocationBarTypes";

export async function reverseGeocodeAndSearchForLocationBar(
  lat: number,
  lng: number,
  deps: SearchLocationBarMapDeps
): Promise<void> {
  const {
    fitMapToBounds,
    setSearchAnchor,
    setLocationPlaceViewportFromBar,
    setLocalValue,
    setHasSelected,
    setSuggestions,
    setIsFocused,
    onSearch,
  } = deps;

  const win = getWindow() as Window & { google?: typeof google };
  const geocoder = win?.google?.maps?.Geocoder ? new win.google.maps.Geocoder() : null;

  if (!isSupportedServiceAreaCoordinates({ lat, lng })) {
    log.warn("SEARCH", "Blocked current location outside supported service area");
    warnUnsupportedServiceArea();
    setSuggestions([]);
    setIsFocused(false);
    return;
  }

  let label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  let resolvedViaSlipstream = false;

  if (geocoder) {
    try {
      const result = await geocoder.geocode({ location: { lat, lng } });
      const results = result?.results;
      if (results && results.length > 0) {
        const localityResult = results.find((r) => r.types.includes("locality"));
        const neighborhoodResult = results.find((r) => r.types.includes("neighborhood"));
        const postalResult = results.find((r) => r.types.includes("postal_code"));
        const best = neighborhoodResult ?? localityResult ?? postalResult ?? results[0];
        label = best.formatted_address;

        if (!isSupportedServiceAreaAddressComponents(best.address_components)) {
          log.warn("SEARCH", "Blocked reverse geocode outside supported service area", {
            label,
          });
          warnUnsupportedServiceArea();
          setSuggestions([]);
          setIsFocused(false);
          return;
        }

        const cityComponent = best.address_components.find((c) => c.types.includes("locality"));
        const stateComponent = best.address_components.find((c) =>
          c.types.includes("administrative_area_level_1")
        );
        const searchName = cityComponent?.long_name ?? label.split(",")[0];

        try {
          const resp = await searchApi.getAreaSuggestions({
            keyword: searchName,
            state: stateComponent?.short_name ?? SUPPORTED_SERVICE_AREA_STATE_SHORT,
            limit: 1,
          });
          if (resp.success && resp.areas && resp.areas.length > 0) {
            const topArea = resp.areas[0];
            const boundaryResp = await searchApi.getAreaBoundary({
              id: topArea.id,
            });
            if (
              boundaryResp.success &&
              boundaryResp.viewport_ring &&
              boundaryResp.viewport_ring.length >= 3
            ) {
              const ring = boundaryResp.viewport_ring as Array<{
                lat: number;
                lng: number;
              }>;
              const apiCenter = boundaryResp.area?.center;
              const center: { lat: number; lng: number } =
                apiCenter && typeof apiCenter.lat === "number" && typeof apiCenter.lng === "number"
                  ? { lat: apiCenter.lat, lng: apiCenter.lng }
                  : centroidOfViewportRing(ring);
              const areaLabel = boundaryResp.area?.label ?? searchName;

              if (!isSupportedServiceAreaCoordinates(center)) {
                log.warn(
                  "SEARCH",
                  "Blocked current location boundary outside supported service area",
                  {
                    searchName,
                    areaId: topArea.id,
                    areaLabel,
                  }
                );
                warnUnsupportedServiceArea();
                setSuggestions([]);
                setIsFocused(false);
                return;
              }

              setLocalValue(areaLabel);
              const bounds = boundsFromViewportRing(ring);
              if (bounds) fitMapToBounds(bounds);
              setSearchAnchor({ lat: center.lat, lng: center.lng });
              setLocationPlaceViewportFromBar({
                ring,
                label: areaLabel,
                overlay: buildIsochroneOverlayFromViewportRing(ring, center, areaLabel),
              });
              resolvedViaSlipstream = true;

              log.info("SEARCH", "Current location resolved via Slipstream", {
                searchName,
                areaId: topArea.id,
                areaLabel,
              });
            }
          }
        } catch (err: unknown) {
          log.warn("ERRORS", "Slipstream fallback for current location failed", err);
        }
      }
    } catch (err: unknown) {
      log.warn("ERRORS", "Reverse geocode failed for current location", err);
    }
  }

  if (!resolvedViaSlipstream) {
    setLocalValue(label);
    setSearchAnchor({ lat, lng });
    const win2 = getWindow() as Window & { google?: typeof google };
    const g = win2?.google;
    if (g?.maps?.LatLngBounds) {
      const delta = 0.06;
      const bounds = new g.maps.LatLngBounds(
        { lat: lat - delta, lng: lng - delta },
        { lat: lat + delta, lng: lng + delta }
      );
      fitMapToBounds(bounds);
      const ring = boundsToViewportPolygon(bounds);
      setLocationPlaceViewportFromBar({
        ring,
        label,
        overlay: buildIsochroneOverlayFromViewportRing(ring, { lat, lng }, label),
      });
    }
  }

  setHasSelected(true);
  setSuggestions([]);
  setIsFocused(false);
  void onSearch();
}
