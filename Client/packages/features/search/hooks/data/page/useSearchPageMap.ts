import { useCallback, useEffect, useRef } from "react";

import { env } from "packages/config";
import { calculatePropertyScore } from "packages/features/search/types/search/calculatePropertyScore";
import {
  type GoogleAdvancedMarkerElement,
  renderImportantLocationMarkers,
} from "packages/features/search/types/search/importantLocationRenderer";
import { renderIsochronePolygon } from "packages/features/search/types/search/isochroneRenderer";
import { useGoogleMaps } from "packages/hooks/data/useGoogleMaps";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useSearchContextStore } from "packages/store";
import type { IsochroneData, UserPreferencesData } from "packages/types/api";
import { getWindow } from "packages/utils/platform";

import { searchPropertiesInIsochrone } from "@/features/search/api/propertySearch";
import { useIsochroneFlow } from "@/features/search/hooks/data/isochrone/useIsochroneFlow";
import { useMapInitAndResize } from "@/features/search/hooks/data/map/useMapInitAndResize";
import { useMapZoomController } from "@/features/search/hooks/data/map/useMapZoomController";
import { useMarkerUpdates } from "@/features/search/hooks/data/map/useMarkerUpdates";
import { usePropertyFocus } from "@/features/search/hooks/data/map/usePropertyFocus";
import type { MapPropertyCardRenderProps } from "@/features/search/hooks/data/useMapMarkers";
import { useMapMarkers } from "@/features/search/hooks/data/useMapMarkers";
import type { SearchResult } from "@/features/search/types";
import type { Property } from "@/features/search/types/property";

const PROPERTIES_PER_PAGE = 1;

export type UseSearchPageMapParams = {
  isochroneData: IsochroneData | null;
  fetchIsochrone: () => Promise<IsochroneData | null>;
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
    onCardRendered?: (property: MapPropertyCardRenderProps["property"]) => void
  ) => void;
  /** Injected from apps/web (MapPropertyCardUtils) */
  cleanupMapPropertyCard: (container: HTMLElement) => void;
};

export function useSearchPageMap(params: UseSearchPageMapParams) {
  const {
    isochroneData,
    fetchIsochrone,
    filteredSearchResults,
    savedHomes,
    activeTab,
    currentPage,
    hasSearched,
    showPropertyModals,
    selectedProperty,
    searchResults,
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
  } = params;

  const searchFilterOverrides = useSearchContextStore((s) => s.searchFilterOverrides);
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
    googleMapRef,
    currentPage,
    propertiesPerPage: PROPERTIES_PER_PAGE,
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
    (data: unknown) => {
      if (!googleMapRef.current) {
        log.warn(LOG_CATEGORIES.MAP_RENDERING, "Google Map not initialized yet");
        return;
      }
      renderIsochronePolygon(data as IsochroneData, {
        map: googleMapRef.current,
        polygonRef,
        individualPolygonsRef,
        focusOnCurrentProperty: mapFocusOnCurrentProperty,
      });
    },
    [mapFocusOnCurrentProperty, googleMapRef]
  );

  const renderImportantLocationMarkersWrapper = useCallback(
    (data: unknown) => {
      if (!googleMapRef.current) {
        log.warn(
          LOG_CATEGORIES.MAP_RENDERING,
          "Cannot render important location markers: map not available"
        );
        return;
      }
      renderImportantLocationMarkers(data as IsochroneData, {
        map: googleMapRef.current,
        importantMarkersRef,
        setImportantLocationMarkers: (markers: GoogleAdvancedMarkerElement[]) => {
          importantMarkersRef.current = markers;
        },
        resetToDefaultZoom,
      });
    },
    [resetToDefaultZoom, googleMapRef, importantMarkersRef]
  );

  const saveSearchResultsToLocalStorage = useCallback(async (_results: SearchResult[]) => {
    // No-op: React Query handles caching automatically
  }, []);

  const { primeIsochroneOverlay, runIsochroneSearch } = useIsochroneFlow({
    env,
    googleMapRef,
    renderIsochronePolygon: renderIsochronePolygonWrapper,
    renderImportantLocationMarkers: (data: unknown) => {
      renderImportantLocationMarkersWrapper(data);
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
        getSearchAbortSignal()
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
  });

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
  });

  useEffect(() => {
    if (!googleMapRef.current) return;

    const hasData = filteredSearchResults.length > 0 || savedHomes.length > 0;
    const dataChanged =
      prevDataRef.current.resultsLength !== filteredSearchResults.length ||
      prevDataRef.current.savedLength !== savedHomes.length ||
      prevDataRef.current.activeTab !== activeTab ||
      prevDataRef.current.currentPage !== currentPage;

    if (hasData && dataChanged) {
      const currentData = activeTab === "results" ? filteredSearchResults : savedHomes;
      void updateMapMarkers(currentData);
      prevDataRef.current = {
        resultsLength: filteredSearchResults.length,
        savedLength: savedHomes.length,
        activeTab,
        currentPage,
      };
    }
  }, [
    filteredSearchResults.length,
    savedHomes.length,
    filteredSearchResults,
    savedHomes,
    activeTab,
    currentPage,
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

  const hasInitializedIsochrone = useRef(false);
  useEffect(() => {
    if (!isGoogleMapsLoaded) return;
    if (hasInitializedIsochrone.current) return;
    if (!googleMapRef.current) return;

    hasInitializedIsochrone.current = true;

    if (isochroneData) {
      renderIsochronePolygonWrapper(isochroneData);
      void renderImportantLocationMarkersWrapper(isochroneData);
    } else {
      setTimeout(() => {
        void primeIsochroneOverlay(searchResults.length > 0);
      }, 100);
    }
  }, [
    isGoogleMapsLoaded,
    searchResults.length,
    isochroneData,
    googleMapRef,
    primeIsochroneOverlay,
    renderIsochronePolygonWrapper,
    renderImportantLocationMarkersWrapper,
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
    primeIsochroneOverlay,
    triggerMapResize,
  };
}
