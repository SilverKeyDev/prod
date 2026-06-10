import { useCallback, useEffect, useMemo } from "react";

import { getEnv } from "packages/config";
import { useSavedHomesData } from "packages/hooks/data/saved/useSavedHomesData";
import { useUserPreferences } from "packages/hooks/data/user/useUserData";
import { log } from "packages/logger";
import {
  useAgentDashboardStore,
  useConsolidatedSearchStore,
  useFiltersStore,
  useSearchContextStore,
  useUIStore,
} from "packages/store";
import { simpleHash } from "packages/utils";
import { formatPropertySearchListingPrice } from "packages/utils/product/search/pricing/formatPropertySearchListingPrice";
import { sortSearchResults } from "packages/utils/product/search/sort/sortSearchResults";

import { useIsochroneData } from "@/features/search/hooks/data/isochrone/useIsochroneData";
import { usePropertyDetails } from "@/features/search/hooks/data/property/usePropertyDetails";
import { useSearchResultsData } from "@/features/search/hooks/data/results/useSearchResultsData";
import { useNotInterestedHomesData } from "@/features/search/hooks/data/saved/useNotInterestedHomesData";
import { useSearchMapOverlayData } from "@/features/search/hooks/data/useSearchMapOverlayData";
import type { SearchResult } from "@/features/search/types";
import type { SavedHome } from "@/features/search/types/domain/property";

export function useSearchPageData() {
  const {
    searchResults,
    setSearchResults,
    isLoading: isLoadingSearchResults,
  } = useSearchResultsData();
  const isSearching = useConsolidatedSearchStore((s) => s.isSearching);
  const setIsSearching = useConsolidatedSearchStore((s) => s.setIsSearching);
  const searchStage = useConsolidatedSearchStore((s) => s.searchStage);
  const setSearchStage = useConsolidatedSearchStore((s) => s.setSearchStage);
  const hasSearched = useConsolidatedSearchStore((s) => s.hasSearched);
  const setHasSearched = useConsolidatedSearchStore((s) => s.setHasSearched);
  const {
    isLoading: isLoadingPropertyDetails,
    selectedProperty,
    fetchPropertyDetails,
    clearSelectedProperty,
  } = usePropertyDetails();
  const agentViewClientId = useAgentDashboardStore((s) => s.selectedClientId);
  const { userPreferences } = useUserPreferences({
    preferencesSubjectUserId: agentViewClientId,
  });
  const hasImportantLocations =
    Array.isArray(userPreferences?.important_locations) &&
    (userPreferences?.important_locations?.length ?? 0) > 0;
  const {
    isochroneData,
    isLoading: isLoadingIsochrone,
    fetchIsochrone,
  } = useIsochroneData({
    preferencesSubjectUserId: agentViewClientId,
    hasImportantLocations,
  });
  const { displayIsochroneData } = useSearchMapOverlayData(isochroneData ?? null);
  const currentPage = useConsolidatedSearchStore((s) => s.currentPage);
  const setCurrentPage = useConsolidatedSearchStore((s) => s.setCurrentPage);
  const showPropertyModals = useUIStore((s) => s.showPropertyModals);
  const setShowPropertyModals = useUIStore((s) => s.setShowPropertyModals);
  const isCarouselCollapsed = useUIStore((s) => s.isCarouselCollapsed);
  const setIsCarouselCollapsed = useUIStore((s) => s.setCarouselCollapsed);
  const activeTab = useConsolidatedSearchStore((s) => s.activeTab);
  const setActiveTab = useConsolidatedSearchStore((s) => s.setActiveTab);
  const setFiltersHash = useSearchContextStore((s) => s.setFiltersHash);
  const searchAnchor = useSearchContextStore((s) => s.anchor);
  const resultsOrderBy = useFiltersStore((s) => s.resultsOrderBy);
  const resultsSortDirection = useFiltersStore((s) => s.resultsSortDirection);
  const userGeolocation = useFiltersStore((s) => s.userGeolocation);
  const mapHomeCardsCount = useFiltersStore((s) => s.mapHomeCardsCount);
  const clearDismissedMapPreviews = useFiltersStore((s) => s.clearDismissedMapPreviews);

  const clientIdForSavedHomes = agentViewClientId ?? undefined;
  const {
    savedHomes: savedHomesRaw,
    isHomeSaved,
    saveHome,
    removeSavedHome,
  } = useSavedHomesData(clientIdForSavedHomes);
  const { isNotInterested } = useNotInterestedHomesData();

  const convertSavedHomeToSearchResult = useCallback((savedHome: SavedHome): SearchResult => {
    const isDev = getEnv().isDevelopment;
    log.debug("MAP_RENDERING", "Converting SavedHome to SearchResult for map", {
      environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
      homeId: savedHome.home_id,
      address: savedHome.address,
      rawLat: savedHome.lat,
      rawLng: savedHome.lng,
    });

    return {
      id: savedHome.home_id ?? savedHome.address ?? `home_${Date.now()}`,
      address: savedHome.address ?? "",
      price: formatPropertySearchListingPrice({
        price: savedHome.price as string | number | null | undefined,
      }),
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

  const notInterestedFiltered = useMemo(
    () =>
      searchResults.filter(
        (p) => !isNotInterested(p.id, typeof p.address === "string" ? p.address : undefined)
      ),
    [searchResults, isNotInterested]
  );

  const searchBarAnchor = useMemo(() => {
    const lat = searchAnchor.lat;
    const lng = searchAnchor.lng;
    if (typeof lat === "number" && typeof lng === "number" && !Number.isNaN(lat + lng)) {
      return { lat, lng };
    }
    return null;
  }, [searchAnchor.lat, searchAnchor.lng]);

  const importantLocationPoints = useMemo(() => {
    const locs = userPreferences?.important_locations;
    if (!Array.isArray(locs)) return [];
    return locs
      .map((loc) => {
        const lat = loc?.latitude;
        const lng = loc?.longitude;
        if (typeof lat === "number" && typeof lng === "number") {
          return { lat, lng };
        }
        return null;
      })
      .filter((p): p is { lat: number; lng: number } => p != null);
  }, [userPreferences?.important_locations]);

  const filteredSearchResults = useMemo(
    () =>
      sortSearchResults(
        notInterestedFiltered,
        resultsOrderBy,
        {
          userGeolocation,
          searchBarAnchor,
          importantLocations: importantLocationPoints,
        },
        { sortDirection: resultsSortDirection }
      ),
    [
      notInterestedFiltered,
      resultsOrderBy,
      resultsSortDirection,
      userGeolocation,
      searchBarAnchor,
      importantLocationPoints,
    ]
  );

  useEffect(() => {
    const hidden = searchResults.length - notInterestedFiltered.length;
    log.info("SEARCH", "Search UI pipeline: results vs not-interested filter", {
      searchResultsCount: searchResults.length,
      filteredSearchResultsCount: filteredSearchResults.length,
      hiddenByNotInterested: hidden,
    });
  }, [searchResults, notInterestedFiltered.length, filteredSearchResults.length]);

  useEffect(() => {
    if (searchResults.length > 0 && !hasSearched) {
      setHasSearched(true);
      setShowPropertyModals(true);
      clearDismissedMapPreviews();
    }
  }, [
    searchResults.length,
    hasSearched,
    setHasSearched,
    setShowPropertyModals,
    clearDismissedMapPreviews,
  ]);

  useEffect(() => {
    if (hasSearched && displayIsochroneData?.isochrone?.geometry) {
      const geom = displayIsochroneData.isochrone.geometry;
      setFiltersHash(simpleHash(JSON.stringify(geom)));
    } else {
      setFiltersHash("");
    }
  }, [hasSearched, displayIsochroneData?.isochrone?.geometry, setFiltersHash]);

  useEffect(() => {
    if (activeTab === "results" && filteredSearchResults.length > 0) {
      const maxStart = Math.max(0, filteredSearchResults.length - mapHomeCardsCount);
      if (currentPage > maxStart) {
        setCurrentPage(maxStart);
      }
    }
  }, [activeTab, filteredSearchResults.length, mapHomeCardsCount, currentPage, setCurrentPage]);

  const savedHomes = useMemo(() => {
    const converted = savedHomesRaw.map(convertSavedHomeToSearchResult);
    const isDev = getEnv().isDevelopment;
    log.info("MAP_RENDERING", "Saved homes converted for map rendering", {
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
    displayIsochroneData,
    isLoadingIsochrone,
    fetchIsochrone,
    filteredSearchResults,
    savedHomes,
    isHomeSaved,
    saveHome,
    removeSavedHome,
  };
}
