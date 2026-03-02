import { useCallback, useEffect, useMemo } from "react";

import { getEnv } from "packages/config";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useFiltersStore, useUIStore } from "packages/store";
import { useSearchContextStore } from "packages/store";
import { simpleHash } from "packages/utils";

import { useIsochroneData } from "@/features/search/hooks/data/isochrone/useIsochroneData";
import { usePropertyDetails } from "@/features/search/hooks/data/property/usePropertyDetails";
import { useSearchResultsData } from "@/features/search/hooks/data/results/useSearchResultsData";
import { useNotInterestedHomesData } from "@/features/search/hooks/data/saved/useNotInterestedHomesData";
import { useSavedHomesStoreIntegration } from "@/features/search/hooks/store/useSavedHomesStoreIntegration";
import type { SearchResult } from "@/features/search/types";
import type { SavedHome } from "@/features/search/types/property";

export function useSearchPageData() {
  const {
    searchResults,
    setSearchResults,
    isLoading: isLoadingSearchResults,
  } = useSearchResultsData();
  const isSearching = useFiltersStore((s) => s.isSearching);
  const setIsSearching = useFiltersStore((s) => s.setIsSearching);
  const searchStage = useFiltersStore((s) => s.searchStage);
  const setSearchStage = useFiltersStore((s) => s.setSearchStage);
  const hasSearched = useFiltersStore((s) => s.hasSearched);
  const setHasSearched = useFiltersStore((s) => s.setHasSearched);
  const {
    isLoading: isLoadingPropertyDetails,
    selectedProperty,
    fetchPropertyDetails,
    clearSelectedProperty,
  } = usePropertyDetails();
  const { isochroneData, isLoading: isLoadingIsochrone, fetchIsochrone } = useIsochroneData();
  const currentPage = useFiltersStore((s) => s.currentPage);
  const setCurrentPage = useFiltersStore((s) => s.setCurrentPage);
  const showPropertyModals = useUIStore((s) => s.showPropertyModals);
  const setShowPropertyModals = useUIStore((s) => s.setShowPropertyModals);
  const isCarouselCollapsed = useUIStore((s) => s.isCarouselCollapsed);
  const setIsCarouselCollapsed = useUIStore((s) => s.setCarouselCollapsed);
  const activeTab = useFiltersStore((s) => s.activeTab);
  const setActiveTab = useFiltersStore((s) => s.setActiveTab);
  const setFiltersHash = useSearchContextStore((s) => s.setFiltersHash);

  const {
    savedHomes: savedHomesRaw,
    isHomeSaved,
    saveHome,
    removeSavedHome,
  } = useSavedHomesStoreIntegration();
  const { isNotInterested } = useNotInterestedHomesData();

  const convertSavedHomeToSearchResult = useCallback((savedHome: SavedHome): SearchResult => {
    const isDev = getEnv().isDevelopment;
    log.debug(LOG_CATEGORIES.MAP_RENDERING, "Converting SavedHome to SearchResult for map", {
      environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
      homeId: savedHome.home_id,
      address: savedHome.address,
      rawLat: savedHome.lat,
      rawLng: savedHome.lng,
    });

    return {
      id: savedHome.home_id ?? savedHome.address ?? `home_${Date.now()}`,
      address: savedHome.address ?? "",
      price:
        typeof savedHome.price === "number"
          ? savedHome.price.toLocaleString()
          : (savedHome.price ?? ""),
      bedrooms: savedHome.bedrooms ?? 0,
      bathrooms: savedHome.bathrooms ?? 0,
      sqft: savedHome.sqft ?? 0,
      lat: savedHome.lat ?? 0,
      lng: savedHome.lng ?? 0,
      lotSize: typeof savedHome.lot_size === "string" ? savedHome.lot_size : undefined,
      propertyType: "SINGLE_FAMILY",
      listingStatus: "FOR_SALE",
      imageUrl: savedHome.image_url,
    };
  }, []);

  const filteredSearchResults = useMemo(
    () =>
      searchResults.filter(
        (p) => !isNotInterested(p.id, typeof p.address === "string" ? p.address : undefined)
      ),
    [searchResults, isNotInterested]
  );

  useEffect(() => {
    if (searchResults.length > 0 && !hasSearched) {
      setHasSearched(true);
      setShowPropertyModals(true);
    }
  }, [searchResults.length, hasSearched, setHasSearched, setShowPropertyModals]);

  useEffect(() => {
    if (hasSearched && isochroneData?.isochrone?.geometry) {
      const geom = isochroneData.isochrone.geometry;
      setFiltersHash(simpleHash(JSON.stringify(geom)));
    } else {
      setFiltersHash("");
    }
  }, [hasSearched, isochroneData?.isochrone?.geometry, setFiltersHash]);

  useEffect(() => {
    if (activeTab === "results" && filteredSearchResults.length > 0) {
      const maxPage = Math.max(0, filteredSearchResults.length - 1);
      if (currentPage > maxPage) {
        setCurrentPage(maxPage);
      }
    }
  }, [activeTab, filteredSearchResults.length, currentPage, setCurrentPage]);

  const savedHomes = useMemo(() => {
    const converted = savedHomesRaw.map(convertSavedHomeToSearchResult);
    const isDev = getEnv().isDevelopment;
    log.info(LOG_CATEGORIES.MAP_RENDERING, "Saved homes converted for map rendering", {
      environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
      rawCount: savedHomesRaw.length,
      convertedCount: converted.length,
      sample: converted.slice(0, 3).map((home, index) => ({
        index,
        id: home.id,
        address: home.address,
        lat: home.lat,
        lng: home.lng,
      })),
    });
    return converted;
  }, [savedHomesRaw, convertSavedHomeToSearchResult]);

  return {
    searchResults,
    setSearchResults,
    isLoadingSearchResults,
    isSearching,
    setIsSearching,
    searchStage,
    setSearchStage,
    hasSearched,
    setHasSearched,
    currentPage,
    setCurrentPage,
    showPropertyModals,
    setShowPropertyModals,
    isCarouselCollapsed,
    setIsCarouselCollapsed,
    activeTab,
    setActiveTab,
    selectedProperty,
    isLoadingPropertyDetails,
    fetchPropertyDetails,
    clearSelectedProperty,
    isochroneData,
    isLoadingIsochrone,
    fetchIsochrone,
    filteredSearchResults,
    savedHomes,
    isHomeSaved,
    saveHome,
    removeSavedHome,
  };
}
