import { useCallback } from "react";

import type { QueryClient } from "@tanstack/react-query";
import type { MutableRefObject } from "react";

import { queryKeys } from "packages/config/query/keys";
import { searchApi } from "packages/features/search/api/search";
import type { GoogleAdvancedMarkerElement } from "packages/features/search/types/search/map/importantLocationRenderer";
import { clearImportantLocationMarkers } from "packages/features/search/types/search/map/importantLocationRenderer";
import { buildIsochroneOverlayFromViewportRing } from "packages/features/search/utils/map/locationBoundsOverlay";
import {
  boundsToViewportPolygon,
  centroidOfViewportRing,
} from "packages/features/search/utils/map/mapViewport";
import { normalizeIsochroneApiData } from "packages/features/search/utils/map/normalizeIsochroneApiData";
import {
  warnMapNotReady,
  warnSearchAreaInvalid,
  warnSearchFailed,
  warnUnsupportedServiceArea,
} from "packages/features/search/utils/outcomes/searchOutcomeToast";
import { log, LOG_CATEGORIES } from "packages/logger";
import { isSupportedServiceAreaCoordinates } from "packages/utils/search/locations/serviceAreaAvailability";

import {
  type MapPreviewSearchLifecycleHooks,
  searchPropertiesInIsochrone,
  searchPropertiesInViewport,
} from "@/features/search/api/propertySearch";
import type { SearchFilterOverrides } from "@/features/search/store/searchContext.slice";
import type { SearchResult } from "@/features/search/types";
import type { IsochroneData } from "@/features/search/types/isochrone";
import type { LastSearchContext } from "@/features/search/types/searchDisplay";

export type UseSearchPageMapGeoSearchParams = {
  queryClient: QueryClient;
  googleMapRef: MutableRefObject<google.maps.Map | null>;
  polygonRef: MutableRefObject<google.maps.Polygon | null>;
  individualPolygonsRef: MutableRefObject<google.maps.Polygon[]>;
  importantMarkersRef: MutableRefObject<GoogleAdvancedMarkerElement[]>;
  showCommuteOverlayRef: MutableRefObject<boolean>;
  locationPlaceViewportRing: google.maps.LatLngLiteral[] | null;
  locationPlaceLabel: string | null;
  setLocationSearchOverlayData: (data: IsochroneData | null) => void;
  renderIsochronePolygonWrapper: (data: unknown, options?: { skipCommuteToggle?: boolean }) => void;
  renderImportantLocationMarkersWrapper: (data: unknown) => Promise<void>;
  mapFocusOnCurrentProperty: () => void;
  clearLocationPlaceSearchArea: () => void;
  setSearchStage: (stage?: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setIsSearching: (searching: boolean) => void;
  setHasSearched: (searched: boolean) => void;
  setCurrentPage: (page: number) => void;
  setShowPropertyModals: (show: boolean) => void;
  saveSearchResultsToLocalStorage: (results: SearchResult[]) => Promise<void>;
  searchFilterOverrides: SearchFilterOverrides;
  preferencesStrictFilter: boolean;
  /** Agent: selected client id for preference-scoped isochrone and polygon search; null = self. */
  preferencesSubjectUserId?: string | null;
  getSearchAbortSignal: () => AbortSignal | undefined;
  saveLastSearchContext?: (ctx: LastSearchContext) => void;
  mapPreviewSearchLifecycle: MapPreviewSearchLifecycleHooks;
};

export function useSearchPageMapGeoSearch(p: UseSearchPageMapGeoSearchParams): {
  runPreferencesSearch: () => Promise<void>;
  runViewportSearch: () => Promise<void>;
} {
  const {
    queryClient,
    googleMapRef,
    polygonRef: _polygonRef,
    individualPolygonsRef: _individualPolygonsRef,
    importantMarkersRef,
    showCommuteOverlayRef,
    locationPlaceViewportRing,
    locationPlaceLabel,
    setLocationSearchOverlayData,
    renderIsochronePolygonWrapper,
    renderImportantLocationMarkersWrapper,
    mapFocusOnCurrentProperty: _mapFocusOnCurrentProperty,
    clearLocationPlaceSearchArea,
    setSearchStage,
    setSearchResults,
    setIsSearching,
    setHasSearched,
    setCurrentPage,
    setShowPropertyModals,
    saveSearchResultsToLocalStorage,
    searchFilterOverrides,
    preferencesStrictFilter,
    preferencesSubjectUserId,
    getSearchAbortSignal,
    saveLastSearchContext,
    mapPreviewSearchLifecycle,
  } = p;

  const runPreferencesSearch = useCallback(async () => {
    log.info(LOG_CATEGORIES.SEARCH, "Preferences search (isochrone pipeline)", {});
    clearLocationPlaceSearchArea();
    setIsSearching(true);
    setSearchStage("Preparing search...");
    try {
      const response = await searchApi.getIsochrone({
        preferencesUserId: preferencesSubjectUserId ?? undefined,
        signal: getSearchAbortSignal(),
      });
      if (!response.success || !response.data) {
        log.warn(LOG_CATEGORIES.SEARCH, "Isochrone API returned no data", {
          success: response.success,
        });
        setSearchStage("No search area. Add important locations in Filters.");
        warnSearchAreaInvalid("isochrone_api");
        setIsSearching(false);
        return;
      }
      const normalized = normalizeIsochroneApiData(response.data);
      queryClient.setQueryData(queryKeys.search.isochrone(preferencesSubjectUserId), normalized);

      // Note: Overlay rendering is now handled by useSearchMapOverlayData hook
      // which determines whether to show commute isochrone or neighborhood polygon
      // based on showCommuteOverlay setting
      if (googleMapRef.current) {
        if (showCommuteOverlayRef.current) {
          // Show commute isochrone and markers
          renderIsochronePolygonWrapper(normalized);
          await renderImportantLocationMarkersWrapper(normalized);
        } else {
          // Show neighborhood polygon (handled by useSearchMapOverlayData)
          // Clear important location markers since we're not showing commute data
          clearImportantLocationMarkers(importantMarkersRef);
        }
      }

      await searchPropertiesInIsochrone(
        normalized,
        {},
        (stage: string) => setSearchStage(stage),
        setSearchResults,
        setIsSearching,
        setHasSearched,
        setCurrentPage,
        setShowPropertyModals,
        saveSearchResultsToLocalStorage,
        searchFilterOverrides,
        preferencesStrictFilter,
        preferencesSubjectUserId,
        getSearchAbortSignal(),
        mapPreviewSearchLifecycle
      );

      if (saveLastSearchContext) {
        const map = googleMapRef.current;
        const ctx: LastSearchContext = {
          search_source: "preferences",
          viewport_ring: null,
          place_label: null,
          map_center: map
            ? {
                lat: map.getCenter()?.lat() ?? 0,
                lng: map.getCenter()?.lng() ?? 0,
              }
            : null,
          map_zoom: map ? (map.getZoom() ?? null) : null,
        };
        saveLastSearchContext(ctx);
      }
    } catch (error: unknown) {
      const err = error as Error;
      if (err?.name === "AbortError") return;
      log.error(LOG_CATEGORIES.ERRORS, "Preferences search failed", error);
      warnSearchFailed(error);
      setIsSearching(false);
      setSearchStage("");
    }
  }, [
    queryClient,
    googleMapRef,
    renderIsochronePolygonWrapper,
    renderImportantLocationMarkersWrapper,
    importantMarkersRef,
    setSearchStage,
    setSearchResults,
    setIsSearching,
    setHasSearched,
    setCurrentPage,
    setShowPropertyModals,
    saveSearchResultsToLocalStorage,
    searchFilterOverrides,
    preferencesStrictFilter,
    preferencesSubjectUserId,
    getSearchAbortSignal,
    clearLocationPlaceSearchArea,
    showCommuteOverlayRef,
    saveLastSearchContext,
    mapPreviewSearchLifecycle,
  ]);

  const runViewportSearch = useCallback(async () => {
    log.info(LOG_CATEGORIES.SEARCH, "Viewport / location search", {});
    setIsSearching(true);
    setSearchStage("Searching this area...");
    const map = googleMapRef.current;
    if (!map) {
      log.warn(LOG_CATEGORIES.SEARCH, "Map not ready for viewport search");
      warnMapNotReady("no_map");
      setIsSearching(false);
      setSearchStage("");
      return;
    }
    const bounds = map.getBounds();
    if (!bounds) {
      log.warn(LOG_CATEGORIES.SEARCH, "Map bounds not available yet");
      setSearchStage("Map is still loading. Try again in a moment.");
      warnMapNotReady("no_bounds");
      setIsSearching(false);
      return;
    }
    const ring =
      locationPlaceViewportRing && locationPlaceViewportRing.length >= 4
        ? locationPlaceViewportRing
        : boundsToViewportPolygon(bounds);
    if (!ring.every((point) => isSupportedServiceAreaCoordinates(point))) {
      log.warn(LOG_CATEGORIES.SEARCH, "Blocked viewport search outside supported service area", {
        pointCount: ring.length,
      });
      warnUnsupportedServiceArea();
      setIsSearching(false);
      setSearchStage("");
      return;
    }
    const center = centroidOfViewportRing(ring);
    const overlay = buildIsochroneOverlayFromViewportRing(
      ring,
      center,
      locationPlaceLabel ?? undefined
    );
    setLocationSearchOverlayData(overlay);

    try {
      if (googleMapRef.current) {
        renderIsochronePolygonWrapper(overlay, { skipCommuteToggle: true });
        clearImportantLocationMarkers(importantMarkersRef);
      }

      await searchPropertiesInViewport(
        ring,
        center,
        (stage: string) => setSearchStage(stage),
        setSearchResults,
        setIsSearching,
        setHasSearched,
        setCurrentPage,
        setShowPropertyModals,
        searchFilterOverrides,
        preferencesStrictFilter,
        preferencesSubjectUserId,
        getSearchAbortSignal(),
        mapPreviewSearchLifecycle
      );

      if (saveLastSearchContext) {
        const map = googleMapRef.current;
        const ctx: LastSearchContext = {
          search_source: "location",
          viewport_ring: ring,
          place_label: locationPlaceLabel ?? null,
          map_center: map
            ? {
                lat: map.getCenter()?.lat() ?? 0,
                lng: map.getCenter()?.lng() ?? 0,
              }
            : center,
          map_zoom: map ? (map.getZoom() ?? null) : null,
        };
        saveLastSearchContext(ctx);
      }
    } catch (error: unknown) {
      const err = error as Error;
      if (err?.name === "AbortError") return;
      log.error(LOG_CATEGORIES.ERRORS, "Viewport search failed", error);
      warnSearchFailed(error);
      setIsSearching(false);
      setSearchStage("");
    }
  }, [
    googleMapRef,
    locationPlaceViewportRing,
    locationPlaceLabel,
    setLocationSearchOverlayData,
    renderIsochronePolygonWrapper,
    importantMarkersRef,
    setSearchStage,
    setSearchResults,
    setIsSearching,
    setHasSearched,
    setCurrentPage,
    setShowPropertyModals,
    searchFilterOverrides,
    preferencesStrictFilter,
    preferencesSubjectUserId,
    getSearchAbortSignal,
    saveLastSearchContext,
    mapPreviewSearchLifecycle,
  ]);

  return { runPreferencesSearch, runViewportSearch };
}
