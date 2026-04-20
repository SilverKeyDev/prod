import { useCallback, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { env } from "packages/config";
import { calculatePropertyScore } from "packages/features/search/types/search/scoring/calculatePropertyScore";
import { useGoogleMaps } from "packages/hooks/data";
import { useIsAgent } from "packages/hooks/store";
import { useFiltersStore, useSearchContextStore } from "packages/store";
import type { IsochroneData, UserPreferencesData } from "packages/types/domain/api";
import { getWindow } from "packages/utils/platform";

import { searchPropertiesInIsochrone } from "@/features/search/api/propertySearch";
import { useIsochroneFlow } from "@/features/search/hooks/data/isochrone/useIsochroneFlow";
import { useMapInitAndResize } from "@/features/search/hooks/data/map/useMapInitAndResize";
import { useMapZoomController } from "@/features/search/hooks/data/map/useMapZoomController";
import { useMarkerUpdates } from "@/features/search/hooks/data/map/useMarkerUpdates";
import { usePropertyFocus } from "@/features/search/hooks/data/map/usePropertyFocus";
import { useWebMapCameraPersistence } from "@/features/search/hooks/data/map/useWebMapCameraPersistence";
import type { UseSearchPageMapParams } from "@/features/search/hooks/data/page/useSearchPageMap.types";
import { useSearchPageMapDisplayOverlayEffect } from "@/features/search/hooks/data/page/useSearchPageMapDisplayOverlayEffect";
import { useSearchPageMapGeoSearch } from "@/features/search/hooks/data/page/useSearchPageMapGeoSearch";
import { useSearchPageMapListingPreview } from "@/features/search/hooks/data/page/useSearchPageMapListingPreview";
import { useSearchPageMapMarkerDataEffect } from "@/features/search/hooks/data/page/useSearchPageMapMarkerDataEffect";
import { useSearchPageMapOverlayRenderers } from "@/features/search/hooks/data/page/useSearchPageMapOverlayRenderers";
import { useMapMarkers } from "@/features/search/hooks/data/useMapMarkers";
import type { SearchResult } from "@/features/search/types";
import { getMapFocusedProperty } from "@/features/search/types/search/map/mapCardFocus";

export type { UseSearchPageMapParams } from "@/features/search/hooks/data/page/useSearchPageMap.types";

export function useSearchPageMap(params: UseSearchPageMapParams) {
  const {
    searchViewMode,
    isochroneData,
    displayIsochroneData,
    fetchIsochrone,
    showCommuteOverlay,
    mapHomeCardsCount,
    filteredSearchResults,
    savedHomes,
    activeTab,
    currentPage,
    hasSearched,
    showPropertyModals,
    selectedProperty,
    searchResults: _searchResults,
    setSearchStage,
    setSearchResults,
    setIsSearching,
    setHasSearched,
    setCurrentPage,
    setShowPropertyModals,
    isHomeSaved,
    saveHome,
    removeSavedHome,
    onMarkerClick,
    onMapPreviewNavigate,
    onUnlockClick,
    onOpenDetails,
    getSearchAbortSignal,
    renderMapPropertyCard,
    cleanupMapPropertyCard,
    preferencesSubjectUserId,
    saveLastSearchContext,
  } = params;

  const isAgent = useIsAgent();
  const shouldPrimeIsochrone = !isAgent || hasSearched;

  const queryClient = useQueryClient();
  const {
    mapListingPreviewsEnabled,
    dismissedMapPreviewIds,
    mapPreviewSearchLifecycle,
    onDismissMapPreview: dismissMapListingPreviewBase,
  } = useSearchPageMapListingPreview();

  const onDismissMapPreview = useCallback(
    (propertyId: string) => {
      const currentData = activeTab === "results" ? filteredSearchResults : savedHomes;
      const primary = getMapFocusedProperty(currentData, currentPage);
      dismissMapListingPreviewBase(propertyId);
      if (primary?.id === propertyId && mapHomeCardsCount <= 1) {
        setCurrentPage(-1);
      }
    },
    [
      activeTab,
      filteredSearchResults,
      savedHomes,
      currentPage,
      mapHomeCardsCount,
      dismissMapListingPreviewBase,
      setCurrentPage,
    ]
  );

  const preferencesStrictFilter = useFiltersStore((s) => s.preferencesStrictFilter);
  const searchFilterOverrides = useSearchContextStore((s) => s.searchFilterOverrides);
  const locationPlaceViewportRing = useSearchContextStore((s) => s.locationPlaceViewportRing);
  const locationPlaceLabel = useSearchContextStore((s) => s.locationPlaceLabel);
  const locationSearchOverlayData = useSearchContextStore((s) => s.locationSearchOverlayData);
  const setLocationSearchOverlayData = useSearchContextStore((s) => s.setLocationSearchOverlayData);
  const clearLocationPlaceSearchArea = useSearchContextStore((s) => s.clearLocationPlaceSearchArea);
  const { isLoaded: isGoogleMapsLoaded, createMap } = useGoogleMaps();
  const mobileMapRef = useRef<HTMLDivElement>(null);
  const desktopMapRef = useRef<HTMLDivElement>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const individualPolygonsRef = useRef<google.maps.Polygon[]>([]);

  const { googleMapRef } = useMapInitAndResize({
    isLocalStorageLoaded: true,
    isGoogleMapsLoaded,
    createMap: createMap as (container: HTMLElement) => google.maps.Map | null,
    mobileMapRef,
    desktopMapRef,
  });

  useWebMapCameraPersistence({ googleMapRef, isGoogleMapsLoaded });

  const {
    resetToDefaultZoom,
    zoomIn: mapZoomIn,
    zoomOut: mapZoomOut,
    focusOnCurrentProperty: mapFocusOnCurrentProperty,
  } = useMapZoomController({
    googleMapRef,
    activeTab,
    searchResults: filteredSearchResults,
    savedHomes,
    currentPage,
  });

  const { updateMapMarkers, importantMarkersRef } = useMapMarkers({
    activeTab,
    googleMapRef,
    currentPage,
    propertiesPerPage: mapHomeCardsCount,
    isochroneData: isochroneData ?? null,
    setIsochroneData: () => {},
    fetchIsochroneForMapOnly: async () => {
      if (isochroneData) return isochroneData as unknown;
      return await fetchIsochrone();
    },
    calculatePropertyScore,
    isHomeSaved,
    saveHome,
    removeSavedHome,
    contextKey: activeTab,
    onMarkerClick,
    onMapPreviewNavigate,
    onUnlockClick,
    renderMapPropertyCard,
    cleanupMapPropertyCard,
    mapListingPreviewsEnabled,
    dismissedMapPreviewIds,
    onDismissMapPreview,
  });

  const {
    showCommuteOverlayRef,
    renderIsochronePolygonWrapper,
    renderImportantLocationMarkersWrapper,
  } = useSearchPageMapOverlayRenderers({
    googleMapRef,
    polygonRef,
    individualPolygonsRef,
    importantMarkersRef,
    mapFocusOnCurrentProperty,
    resetToDefaultZoom,
    showCommuteOverlay,
  });

  const saveSearchResultsToLocalStorage = useCallback(async (_results: SearchResult[]) => {
    // No-op: React Query handles caching automatically
  }, []);

  const { runPreferencesSearch, runViewportSearch } = useSearchPageMapGeoSearch({
    queryClient,
    googleMapRef,
    polygonRef,
    individualPolygonsRef,
    importantMarkersRef,
    showCommuteOverlayRef,
    locationPlaceViewportRing,
    locationPlaceLabel,
    setLocationSearchOverlayData,
    renderIsochronePolygonWrapper,
    renderImportantLocationMarkersWrapper,
    mapFocusOnCurrentProperty,
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
  });

  const { primeIsochroneOverlay, runIsochroneSearch } = useIsochroneFlow({
    env,
    googleMapRef,
    renderIsochronePolygon: renderIsochronePolygonWrapper,
    renderImportantLocationMarkers: (data: unknown) => {
      void renderImportantLocationMarkersWrapper(data);
      return Promise.resolve();
    },
    searchPropertiesInIsochrone: async (data: unknown) => {
      const userPrefs: UserPreferencesData = {};
      await searchPropertiesInIsochrone(
        data as IsochroneData,
        userPrefs,
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
    },
    setSearchStage: (stage?: string) => setSearchStage(stage ?? ""),
    setSearchResults,
    setIsSearching,
    setHasSearched,
    setCurrentPage,
    setShowPropertyModals,
    saveSearchResultsToLocalStorage,
    mapFocusOnCurrentProperty,
    cachedIsochroneData: isochroneData as Record<string, unknown> | null,
    fetchCachedIsochrone: async () => {
      const data = await fetchIsochrone();
      return data as Record<string, unknown> | null;
    },
    preferencesSubjectUserId,
  });

  const fitMapToBounds = useCallback(
    (b: google.maps.LatLngBounds) => {
      const map = googleMapRef.current;
      if (!map) return;
      map.fitBounds(b, 16);
    },
    [googleMapRef]
  );

  useMarkerUpdates({
    googleMapRef,
    onOpenDetails,
    activeTab,
    currentPage,
    hasSearched,
    showPropertyModals,
    searchResults: filteredSearchResults,
    savedHomes,
  });

  useSearchPageMapMarkerDataEffect({
    googleMapRef,
    filteredSearchResults,
    savedHomes,
    activeTab,
    currentPage,
    mapHomeCardsCount,
    mapListingPreviewsEnabled,
    dismissedMapPreviewIds,
    searchViewMode,
    updateMapMarkers,
  });

  usePropertyFocus({
    googleMapRef,
    activeTab,
    searchResults: filteredSearchResults,
    savedHomes,
    currentPage,
    mapFocusOnCurrentProperty,
    selectedProperty,
  });

  useSearchPageMapDisplayOverlayEffect({
    isGoogleMapsLoaded,
    googleMapRef,
    displayIsochroneData,
    locationSearchOverlayData,
    isochroneData,
    showCommuteOverlay,
    polygonRef,
    individualPolygonsRef,
    importantMarkersRef,
    mapFocusOnCurrentProperty,
    primeIsochroneOverlay,
    renderIsochronePolygonWrapper,
    renderImportantLocationMarkersWrapper,
    shouldPrimeIsochrone,
  });

  const triggerMapResize = useCallback(() => {
    const win = getWindow();
    if (win?.google?.maps?.event && googleMapRef.current) {
      win.google.maps.event.trigger(googleMapRef.current, "resize");
    }
  }, [googleMapRef]);

  return {
    mobileMapRef,
    desktopMapRef,
    googleMapRef,
    mapZoomIn,
    mapZoomOut,
    updateMapMarkers,
    runIsochroneSearch,
    runPreferencesSearch,
    runViewportSearch,
    fitMapToBounds,
    primeIsochroneOverlay,
    triggerMapResize,
  };
}
