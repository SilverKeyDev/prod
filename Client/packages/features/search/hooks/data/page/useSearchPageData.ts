import { useCallback, useEffect, useMemo } from "react";

import { getEnv } from "packages/config";
import { useSavedHomesData } from "packages/hooks/data/useSavedHomesData";
import { useUserPreferences } from "packages/hooks/data/useUserData";
import { log, LOG_CATEGORIES } from "packages/logger";
import {
  useAgentDashboardStore,
  useFiltersStore,
  useSearchContextStore,
  useUIStore,
} from "packages/store";
import { simpleHash } from "packages/utils";
import { formatPropertySearchListingPrice } from "packages/utils/search/formatPropertySearchListingPrice";
import { sortSearchResults } from "packages/utils/search/sortSearchResults";

import { useIsochroneData } from "@/features/search/hooks/data/isochrone/useIsochroneData";
import { usePropertyDetails } from "@/features/search/hooks/data/property/usePropertyDetails";
import { useSearchResultsData } from "@/features/search/hooks/data/results/useSearchResultsData";
import { useNotInterestedHomesData } from "@/features/search/hooks/data/saved/useNotInterestedHomesData";
import { useSearchMapOverlayData } from "@/features/search/hooks/data/useSearchMapOverlayData";
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
  const agentViewClientId = useAgentDashboardStore((s) => s.selectedClientId);
  const {
    isochroneData,
    isLoading: isLoadingIsochrone,
    fetchIsochrone,
  } = useIsochroneData({
    preferencesSubjectUserId: agentViewClientId,
  });
  const { displayIsochroneData } = useSearchMapOverlayData(
    isochroneData ?? null,
  );
  const currentPage = useFiltersStore((s) => s.currentPage);
  const setCurrentPage = useFiltersStore((s) => s.setCurrentPage);
  const showPropertyModals = useUIStore((s) => s.showPropertyModals);
  const setShowPropertyModals = useUIStore((s) => s.setShowPropertyModals);
  const isCarouselCollapsed = useUIStore((s) => s.isCarouselCollapsed);
  const setIsCarouselCollapsed = useUIStore((s) => s.setCarouselCollapsed);
  const activeTab = useFiltersStore((s) => s.activeTab);
  const setActiveTab = useFiltersStore((s) => s.setActiveTab);
  const setFiltersHash = useSearchContextStore((s) => s.setFiltersHash);
  const searchAnchor = useSearchContextStore((s) => s.anchor);
  const resultsOrderBy = useFiltersStore((s) => s.resultsOrderBy);
  const userGeolocation = useFiltersStore((s) => s.userGeolocation);
  const mapHomeCardsCount = useFiltersStore((s) => s.mapHomeCardsCount);
  const { userPreferences } = useUserPreferences({
    preferencesSubjectUserId: agentViewClientId,
  });

  const clientIdForSavedHomes = agentViewClientId ?? undefined;
  const {
    savedHomes: savedHomesRaw,
    isHomeSaved,
    saveHome,
    removeSavedHome,
  } = useSavedHomesData(clientIdForSavedHomes);
  const { isNotInterested } = useNotInterestedHomesData();

  const convertSavedHomeToSearchResult = useCallback(
    (savedHome: SavedHome): SearchResult => {
      const isDev = getEnv().isDevelopment;
      log.debug(
        LOG_CATEGORIES.MAP_RENDERING,
        "Converting SavedHome to SearchResult for map",
        {
          environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
          homeId: savedHome.home_id,
          address: savedHome.address,
          rawLat: savedHome.lat,
          rawLng: savedHome.lng,
        },
      );

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
        lotSize:
          typeof savedHome.lot_size === "string"
            ? savedHome.lot_size
            : undefined,
        propertyType: "SINGLE_FAMILY",
        listingStatus: "FOR_SALE",
        imageUrl: savedHome.image_url,
      };
    },
    [],
  );

  const notInterestedFiltered = useMemo(
    () =>
      searchResults.filter(
        (p) =>
          !isNotInterested(
            p.id,
            typeof p.address === "string" ? p.address : undefined,
          ),
      ),
    [searchResults, isNotInterested],
  );

  const searchBarAnchor = useMemo(() => {
    const lat = searchAnchor.lat;
    const lng = searchAnchor.lng;
    if (
      typeof lat === "number" &&
      typeof lng === "number" &&
      !Number.isNaN(lat + lng)
    ) {
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
      sortSearchResults(notInterestedFiltered, resultsOrderBy, {
        userGeolocation,
        searchBarAnchor,
        importantLocations: importantLocationPoints,
      }),
    [
      notInterestedFiltered,
      resultsOrderBy,
      userGeolocation,
      searchBarAnchor,
      importantLocationPoints,
    ],
  );

  useEffect(() => {
    const hidden = searchResults.length - notInterestedFiltered.length;
    log.info(
      LOG_CATEGORIES.SEARCH,
      "Search UI pipeline: results vs not-interested filter",
      {
        searchResultsCount: searchResults.length,
        filteredSearchResultsCount: filteredSearchResults.length,
        hiddenByNotInterested: hidden,
      },
    );
  }, [
    searchResults,
    notInterestedFiltered.length,
    filteredSearchResults.length,
  ]);

  useEffect(() => {
    if (searchResults.length > 0 && !hasSearched) {
      setHasSearched(true);
      setShowPropertyModals(true);
    }
  }, [
    searchResults.length,
    hasSearched,
    setHasSearched,
    setShowPropertyModals,
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
      const maxStart = Math.max(
        0,
        filteredSearchResults.length - mapHomeCardsCount,
      );
      if (currentPage > maxStart) {
        setCurrentPage(maxStart);
      }
    }
  }, [
    activeTab,
    filteredSearchResults.length,
    mapHomeCardsCount,
    currentPage,
    setCurrentPage,
  ]);

  const savedHomes = useMemo(() => {
    const converted = savedHomesRaw.map(convertSavedHomeToSearchResult);
    const isDev = getEnv().isDevelopment;
    log.info(
      LOG_CATEGORIES.MAP_RENDERING,
      "Saved homes converted for map rendering",
      {
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
      },
    );
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
