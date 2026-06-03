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
  warnSearchAreaWarnings,
  warnSearchFailed,
  warnUnsupportedServiceArea,
} from "packages/features/search/utils/outcomes/searchOutcomeToast";
import { log } from "packages/logger";
import type { ViewportPolygonPoint } from "packages/types/domain/api";
import { isSupportedServiceAreaCoordinates } from "packages/utils/search/locations/serviceAreaAvailability";

import {
  type MapPreviewSearchLifecycleHooks,
  searchPropertiesInViewport,
} from "@/features/search/api/propertySearch";
import type { SearchFilterOverrides } from "@/features/search/store/searchContext.slice";
import type { SearchResult } from "@/features/search/types";
import type { LastSearchContext } from "@/features/search/types/domain/searchDisplay";
import type { IsochroneData } from "@/features/search/types/isochrone";
import { resolveSearchArea } from "@/features/search/utils/searchArea/resolveSearchArea";

export type UseSearchPageMapGeoSearchParams = {
  queryClient: QueryClient;
  googleMapRef: MutableRefObject<google.maps.Map | null>;
  polygonRef: MutableRefObject<google.maps.Polygon | null>;
  individualPolygonsRef: MutableRefObject<google.maps.Polygon[]>;
  importantMarkersRef: MutableRefObject<GoogleAdvancedMarkerElement[]>;
  showCommuteOverlayRef: MutableRefObject<boolean>;
  locationPlaceViewportRing: google.maps.LatLngLiteral[] | null;
  locationPlaceLabel: string | null;
  importantLocations: unknown;
  setLocationSearchOverlayData: (data: IsochroneData | null) => void;
  renderIsochronePolygonWrapper: (data: unknown, options?: { skipCommuteToggle?: boolean }) => void;
  renderImportantLocationMarkersWrapper: (data: unknown) => Promise<void>;
  mapFocusOnCurrentProperty: () => void;
  clearLocationPlaceSearchArea: () => void;
  setSearchSource: (source: "preferences" | "location") => void;
  setSearchStage: (stage?: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setIsSearching: (searching: boolean) => void;
  setHasSearched: (searched: boolean) => void;
  setCurrentPage: (page: number) => void;
  setShowPropertyModals: (show: boolean) => void;
  saveSearchResultsToLocalStorage: (results: SearchResult[]) => Promise<void>;
  searchFilterOverrides: SearchFilterOverrides;
  preferencesStrictFilter: boolean;
  preferencesSubjectUserId?: string | null;
  getSearchAbortSignal: () => AbortSignal | undefined;
  saveLastSearchContext?: (ctx: LastSearchContext) => void;
  mapPreviewSearchLifecycle: MapPreviewSearchLifecycleHooks;
};

export function useSearchPageMapGeoSearch(p: UseSearchPageMapGeoSearchParams): {
  runUnifiedSearch: () => Promise<void>;
  runViewportSearch: () => Promise<void>;
} {
  const {
    queryClient,
    googleMapRef,
    importantMarkersRef,
    showCommuteOverlayRef,
    locationPlaceViewportRing,
    locationPlaceLabel,
    importantLocations,
    setLocationSearchOverlayData,
    renderIsochronePolygonWrapper,
    renderImportantLocationMarkersWrapper,
    clearLocationPlaceSearchArea,
    setSearchSource,
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
  } = p;

  const fetchAndCacheIsochrone = useCallback(async (): Promise<IsochroneData | null> => {
    const response = await searchApi.getIsochrone({
      preferencesUserId: preferencesSubjectUserId ?? undefined,
      signal: getSearchAbortSignal(),
    });
    if (response.success && response.data) {
      const normalized = normalizeIsochroneApiData(response.data);
      queryClient.setQueryData(queryKeys.search.isochrone(preferencesSubjectUserId), normalized);
      return normalized;
    }
    return null;
  }, [queryClient, preferencesSubjectUserId, getSearchAbortSignal]);

  const runUnifiedSearch = useCallback(async () => {
    log.info("SEARCH", "Unified search (resolve search area)", {});
    setIsSearching(true);
    setSearchStage("Preparing search...");

    try {
      const map = googleMapRef.current;
      let mapBoundsRing: ViewportPolygonPoint[] | null = null;
      if (map?.getBounds()) {
        mapBoundsRing = boundsToViewportPolygon(map.getBounds()!);
      }

      const barRing =
        locationPlaceViewportRing && locationPlaceViewportRing.length >= 4
          ? (locationPlaceViewportRing as ViewportPolygonPoint[])
          : null;

      if (barRing == null) {
        clearLocationPlaceSearchArea();
      }

      const resolved = await resolveSearchArea({
        locationPlaceViewportRing: barRing,
        locationPlaceLabel,
        importantLocations,
        mapBoundsRing,
        fetchIsochrone: fetchAndCacheIsochrone,
      });

      warnSearchAreaWarnings(resolved.warnings);
      setSearchSource(resolved.searchSource);

      if (
        resolved.mode === "isochrone" &&
        resolved.isochroneData &&
        showCommuteOverlayRef.current
      ) {
        renderIsochronePolygonWrapper(resolved.isochroneData);
        await renderImportantLocationMarkersWrapper(resolved.isochroneData);
      } else if (googleMapRef.current) {
        const overlay = buildIsochroneOverlayFromViewportRing(
          resolved.viewportRing,
          resolved.center,
          locationPlaceLabel ?? undefined
        );
        setLocationSearchOverlayData(overlay);
        renderIsochronePolygonWrapper(overlay, { skipCommuteToggle: true });
        clearImportantLocationMarkers(importantMarkersRef);
      }

      await searchPropertiesInViewport(
        resolved.viewportRing,
        resolved.center,
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
        const mapInstance = googleMapRef.current;
        const ctx: LastSearchContext = {
          search_source: resolved.searchSource,
          viewport_ring: resolved.mode === "location_bar" ? resolved.viewportRing : null,
          place_label: resolved.mode === "location_bar" ? (locationPlaceLabel ?? null) : null,
          map_center: mapInstance
            ? {
                lat: mapInstance.getCenter()?.lat() ?? resolved.center.lat,
                lng: mapInstance.getCenter()?.lng() ?? resolved.center.lng,
              }
            : resolved.center,
          map_zoom: mapInstance ? (mapInstance.getZoom() ?? null) : null,
        };
        saveLastSearchContext(ctx);
      }
    } catch (error: unknown) {
      const err = error as Error;
      if (err?.name === "AbortError") return;
      log.error("ERRORS", "Unified search failed", error);
      warnSearchFailed(error);
      setIsSearching(false);
      setSearchStage("");
    }
  }, [
    googleMapRef,
    locationPlaceViewportRing,
    locationPlaceLabel,
    importantLocations,
    clearLocationPlaceSearchArea,
    fetchAndCacheIsochrone,
    setSearchSource,
    showCommuteOverlayRef,
    renderIsochronePolygonWrapper,
    renderImportantLocationMarkersWrapper,
    setLocationSearchOverlayData,
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

  const runViewportSearch = useCallback(async () => {
    log.info("SEARCH", "Viewport / location search", {});
    setIsSearching(true);
    setSearchStage("Searching this area...");
    setSearchSource("location");
    const map = googleMapRef.current;
    if (!map) {
      log.warn("SEARCH", "Map not ready for viewport search");
      warnMapNotReady("no_map");
      setIsSearching(false);
      setSearchStage("");
      return;
    }
    const bounds = map.getBounds();
    if (!bounds) {
      log.warn("SEARCH", "Map bounds not available yet");
      setSearchStage("Map is still loading. Try again in a moment.");
      warnMapNotReady("no_bounds");
      setIsSearching(false);
      return;
    }
    const ring =
      locationPlaceViewportRing && locationPlaceViewportRing.length >= 4
        ? (locationPlaceViewportRing as ViewportPolygonPoint[])
        : boundsToViewportPolygon(bounds);
    if (!ring.every((point) => isSupportedServiceAreaCoordinates(point))) {
      log.warn("SEARCH", "Blocked viewport search outside supported service area", {
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
        const mapInstance = googleMapRef.current;
        const ctx: LastSearchContext = {
          search_source: "location",
          viewport_ring: ring,
          place_label: locationPlaceLabel ?? null,
          map_center: mapInstance
            ? {
                lat: mapInstance.getCenter()?.lat() ?? 0,
                lng: mapInstance.getCenter()?.lng() ?? 0,
              }
            : center,
          map_zoom: mapInstance ? (mapInstance.getZoom() ?? null) : null,
        };
        saveLastSearchContext(ctx);
      }
    } catch (error: unknown) {
      const err = error as Error;
      if (err?.name === "AbortError") return;
      log.error("ERRORS", "Viewport search failed", error);
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
    setSearchSource,
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

  return { runUnifiedSearch, runViewportSearch };
}
