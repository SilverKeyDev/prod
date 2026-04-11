import { useCallback, useEffect, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { env } from "packages/config";
import { calculatePropertyScore } from "packages/features/search/types/search/calculatePropertyScore";
import {
  clearImportantLocationMarkers,
  type GoogleAdvancedMarkerElement,
  renderImportantLocationMarkers,
} from "packages/features/search/types/search/importantLocationRenderer";
import {
  clearIsochroneOverlays,
  renderIsochronePolygon,
} from "packages/features/search/types/search/isochroneRenderer";
import { useGoogleMaps } from "packages/hooks/data";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useFiltersStore, useSearchContextStore } from "packages/store";
import type { IsochroneData, UserPreferencesData } from "packages/types/api";
import { getWindow } from "packages/utils/platform";

import { searchPropertiesInIsochrone } from "@/features/search/api/propertySearch";
import { useIsochroneFlow } from "@/features/search/hooks/data/isochrone/useIsochroneFlow";
import { useMapInitAndResize } from "@/features/search/hooks/data/map/useMapInitAndResize";
import { useMapZoomController } from "@/features/search/hooks/data/map/useMapZoomController";
import { useMarkerUpdates } from "@/features/search/hooks/data/map/useMarkerUpdates";
import { usePropertyFocus } from "@/features/search/hooks/data/map/usePropertyFocus";
import { useWebMapCameraPersistence } from "@/features/search/hooks/data/map/useWebMapCameraPersistence";
import { useSearchPageMapGeoSearch } from "@/features/search/hooks/data/page/useSearchPageMapGeoSearch";
import type { MapPropertyCardRenderProps } from "@/features/search/hooks/data/useMapMarkers";
import { useMapMarkers } from "@/features/search/hooks/data/useMapMarkers";
import type { SearchResult } from "@/features/search/types";
import type { Property } from "@/features/search/types/property";
import type { LastSearchContext } from "@/features/search/types/searchDisplay";

export type UseSearchPageMapParams = {
  isochroneData: IsochroneData | null;
  /** Map polygon: location bounds / viewport synthetic or commute isochrone (see useSearchMapOverlayData). */
  displayIsochroneData: IsochroneData | null;
  fetchIsochrone: () => Promise<IsochroneData | null>;
  /** When false, commute isochrone polygons and pins are hidden (search may still use server isochrone). */
  showCommuteOverlay: boolean;
  mapHomeCardsCount: number;
  filteredSearchResults: SearchResult[];
  savedHomes: SearchResult[];
  activeTab: "results" | "saved";
  currentPage: number;
  hasSearched: boolean;
  showPropertyModals: boolean;
  selectedProperty: unknown;
  searchResults: SearchResult[];
  setSearchStage: (stage?: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setIsSearching: (searching: boolean) => void;
  setHasSearched: (searched: boolean) => void;
  setCurrentPage: (page: number) => void;
  setShowPropertyModals: (show: boolean) => void;
  isHomeSaved: (id: string, address?: string) => boolean;
  saveHome: (property: SearchResult | Property) => Promise<void>;
  removeSavedHome: (id: string, address?: string) => Promise<void>;
  onMarkerClick: (property: SearchResult) => void;
  onUnlockClick: (property: SearchResult) => void | Promise<void>;
  onOpenDetails: (propertyId: string) => void;
  getSearchAbortSignal: () => AbortSignal | undefined;
  /** Injected from apps/web (MapPropertyCardUtils) so packages do not depend on components */
  renderMapPropertyCard: (
    container: HTMLElement,
    props: MapPropertyCardRenderProps,
    onCardRendered?: (property: MapPropertyCardRenderProps["property"]) => void,
  ) => void;
  /** Injected from apps/web (MapPropertyCardUtils) */
  cleanupMapPropertyCard: (container: HTMLElement) => void;
  preferencesSubjectUserId?: string | null;
  saveLastSearchContext?: (ctx: LastSearchContext) => void;
};

export function useSearchPageMap(params: UseSearchPageMapParams) {
  const {
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
    onUnlockClick,
    onOpenDetails,
    getSearchAbortSignal,
    renderMapPropertyCard,
    cleanupMapPropertyCard,
    preferencesSubjectUserId,
    saveLastSearchContext,
  } = params;

  const queryClient = useQueryClient();
  const preferencesStrictFilter = useFiltersStore(
    (s) => s.preferencesStrictFilter,
  );
  const searchFilterOverrides = useSearchContextStore(
    (s) => s.searchFilterOverrides,
  );
  const locationPlaceViewportRing = useSearchContextStore(
    (s) => s.locationPlaceViewportRing,
  );
  const locationPlaceLabel = useSearchContextStore((s) => s.locationPlaceLabel);
  const locationSearchOverlayData = useSearchContextStore(
    (s) => s.locationSearchOverlayData,
  );
  const setLocationSearchOverlayData = useSearchContextStore(
    (s) => s.setLocationSearchOverlayData,
  );
  const clearLocationPlaceSearchArea = useSearchContextStore(
    (s) => s.clearLocationPlaceSearchArea,
  );
  const { isLoaded: isGoogleMapsLoaded, createMap } = useGoogleMaps();
  const mobileMapRef = useRef<HTMLDivElement>(null);
  const desktopMapRef = useRef<HTMLDivElement>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const individualPolygonsRef = useRef<google.maps.Polygon[]>([]);
  const showCommuteOverlayRef = useRef(showCommuteOverlay);
  showCommuteOverlayRef.current = showCommuteOverlay;

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
    onUnlockClick,
    renderMapPropertyCard,
    cleanupMapPropertyCard,
  });

  const renderIsochronePolygonWrapper = useCallback(
    (
      data: unknown,
      options?: {
        /**
         * When true, draw `data` even if the commute overlay toggle is off.
         * Used for location bar / viewport polygons and preferences neighborhood bounds
         * (see useSearchMapOverlayData). Omit for commute isochrone priming, which must
         * stay hidden when commute overlay is disabled.
         */
        skipCommuteToggle?: boolean;
      },
    ) => {
      if (!googleMapRef.current) {
        log.warn(
          LOG_CATEGORIES.MAP_RENDERING,
          "Google Map not initialized yet",
        );
        return;
      }
      const map = googleMapRef.current;
      const overlayOpts = {
        map,
        polygonRef,
        individualPolygonsRef,
        focusOnCurrentProperty: mapFocusOnCurrentProperty,
      };
      const skipCommuteToggle = options?.skipCommuteToggle === true;
      if (!showCommuteOverlayRef.current && !skipCommuteToggle) {
        clearIsochroneOverlays(overlayOpts);
        return;
      }
      if (data != null) {
        renderIsochronePolygon(data as IsochroneData, overlayOpts);
      } else {
        clearIsochroneOverlays(overlayOpts);
      }
    },
    [mapFocusOnCurrentProperty, googleMapRef],
  );

  const renderImportantLocationMarkersWrapper = useCallback(
    async (data: unknown) => {
      if (!googleMapRef.current) {
        log.warn(
          LOG_CATEGORIES.MAP_RENDERING,
          "Cannot render important location markers: map not available",
        );
        return;
      }
      if (!showCommuteOverlayRef.current) {
        clearImportantLocationMarkers(importantMarkersRef);
        return;
      }
      renderImportantLocationMarkers(data as IsochroneData, {
        map: googleMapRef.current,
        importantMarkersRef,
        setImportantLocationMarkers: (
          markers: GoogleAdvancedMarkerElement[],
        ) => {
          importantMarkersRef.current = markers;
        },
        resetToDefaultZoom,
      });
    },
    [resetToDefaultZoom, googleMapRef, importantMarkersRef],
  );

  const saveSearchResultsToLocalStorage = useCallback(
    async (_results: SearchResult[]) => {
      // No-op: React Query handles caching automatically
    },
    [],
  );

  const { runPreferencesSearch, runViewportSearch } = useSearchPageMapGeoSearch(
    {
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
    },
  );

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
    [googleMapRef],
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

  const prevDataRef = useRef({
    resultsLength: 0,
    savedLength: 0,
    activeTab: "results",
    currentPage: 0,
    mapHomeCardsCount,
  });

  useEffect(() => {
    if (!googleMapRef.current) return;

    const hasData = filteredSearchResults.length > 0 || savedHomes.length > 0;
    const dataChanged =
      prevDataRef.current.resultsLength !== filteredSearchResults.length ||
      prevDataRef.current.savedLength !== savedHomes.length ||
      prevDataRef.current.activeTab !== activeTab ||
      prevDataRef.current.currentPage !== currentPage ||
      prevDataRef.current.mapHomeCardsCount !== mapHomeCardsCount;

    if (hasData && dataChanged) {
      const currentData =
        activeTab === "results" ? filteredSearchResults : savedHomes;
      void updateMapMarkers(currentData);
      prevDataRef.current = {
        resultsLength: filteredSearchResults.length,
        savedLength: savedHomes.length,
        activeTab,
        currentPage,
        mapHomeCardsCount,
      };
    }
  }, [
    filteredSearchResults.length,
    savedHomes.length,
    filteredSearchResults,
    savedHomes,
    activeTab,
    currentPage,
    mapHomeCardsCount,
    googleMapRef,
    updateMapMarkers,
  ]);

  usePropertyFocus({
    googleMapRef,
    activeTab,
    searchResults: filteredSearchResults,
    savedHomes,
    currentPage,
    mapFocusOnCurrentProperty,
    selectedProperty,
  });

  const hasPrimedWithoutIsochroneData = useRef(false);
  useEffect(() => {
    if (!isGoogleMapsLoaded) return;
    if (!googleMapRef.current) return;

    if (displayIsochroneData) {
      renderIsochronePolygonWrapper(displayIsochroneData, {
        skipCommuteToggle: true,
      });
      if (
        showCommuteOverlay &&
        isochroneData?.locations &&
        isochroneData.locations.length > 0 &&
        locationSearchOverlayData == null
      ) {
        void renderImportantLocationMarkersWrapper(isochroneData);
      } else {
        clearImportantLocationMarkers(importantMarkersRef);
      }
      return;
    }

    if (googleMapRef.current) {
      clearIsochroneOverlays({
        map: googleMapRef.current,
        polygonRef,
        individualPolygonsRef,
        focusOnCurrentProperty: mapFocusOnCurrentProperty,
      });
      clearImportantLocationMarkers(importantMarkersRef);
    }

    if (!isochroneData && !hasPrimedWithoutIsochroneData.current) {
      hasPrimedWithoutIsochroneData.current = true;
      setTimeout(() => {
        void primeIsochroneOverlay();
      }, 100);
    }
  }, [
    isGoogleMapsLoaded,
    displayIsochroneData,
    locationSearchOverlayData,
    isochroneData,
    showCommuteOverlay,
    googleMapRef,
    primeIsochroneOverlay,
    renderIsochronePolygonWrapper,
    renderImportantLocationMarkersWrapper,
    mapFocusOnCurrentProperty,
    importantMarkersRef,
  ]);

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
