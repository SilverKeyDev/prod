// React imports
import React, { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Components
import PropertyDetailsModal from "../../components/modals/PropertyDetailsModal";
import DesktopSearchLayout from "../../features/search/components/desktop/SearchLayout";

// Core
import { env } from "../../core/config";
import { usePropertyDetails } from "../../core/hooks/data/usePropertyDetails";
import { useSavedHomesData } from "../../core/hooks/data/useSavedHomesData";
import { useConsolidatedSearchStore } from "../../core/store/search";
import { useGoogleMapsStore } from "../../core/store/googleMaps.slice";
import type { PropertyDetails } from "../../core/schemas/search";
import { logError, normalizeError } from "../../core/utils/errorHandling";

// Features
import {
  cacheUtils,
  memoryUtils,
} from "../../features/search/hooks/unifiedCache";
import { useIsochroneFlow } from "../../features/search/hooks/data/useIsochroneFlow";
import { useSearchBootstrap } from "../../features/search/hooks/data/useSearch";
import { usePreferencesCacheInvalidation } from "../../features/search/hooks/data/usePreferencesCacheInvalidation";
import { propertyUtils } from "../../features/search/lib/commonUtils";
import { preferencesApi } from "../../core/config/api/preferences";
import { searchService } from "../../features/search/services/SearchService";
import { mapBackendPropertyToDetails } from "../../features/search/lib/mapping";
import CacheMonitor from "../../features/search/components/CacheMonitor";

type SearchPageProps = {};

export default function SearchPage({}: SearchPageProps) {
  const navigate = useNavigate();

  // Load Google Maps
  const {
    loadGoogleMaps,
    isLoaded: isGoogleMapsLoaded,
    isLoading: isGoogleMapsLoading,
    error: googleMapsError,
  } = useGoogleMapsStore();

  // Initialize Google Maps on component mount
  useEffect(() => {
    void loadGoogleMaps();
  }, [loadGoogleMaps]);

  // Monitor preferences changes and invalidate cache
  usePreferencesCacheInvalidation();

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      console.log("🧹 [SEARCH_PAGE] Cleaning up memory and cache on unmount");
      // Clean up memory resources
      memoryUtils.cleanupMemory();

      // Log cache statistics before cleanup
      const stats = cacheUtils.getCacheStats();
      console.log("📊 [SEARCH_PAGE] Cache stats before cleanup:", stats);
    };
  }, []);

  // Log Google Maps loading state
  useEffect(() => {}, [
    isGoogleMapsLoaded,
    isGoogleMapsLoading,
    googleMapsError,
  ]);

  // Simple error handler function
  const handleError = useCallback((error: Error, context: string) => {
    const normalizedError = normalizeError(error, { context });
    logError(normalizedError);
    console.error(`❌ Error in ${context}:`, error);
  }, []);

  // Individual state selectors - using individual selectors to prevent infinite loops
  const searchResults = useConsolidatedSearchStore(
    (state) => state.searchResults || []
  );
  const hasSearched = useConsolidatedSearchStore((state) => state.hasSearched);

  const activeTab = useConsolidatedSearchStore((state) => state.activeTab);
  const currentPage = useConsolidatedSearchStore((state) => state.currentPage);
  const showPropertyModals = useConsolidatedSearchStore(
    (state) => state.showPropertyModals
  );
  const isCarouselCollapsed = useConsolidatedSearchStore(
    (state) => state.isCarouselCollapsed
  );
  const isSearching = useConsolidatedSearchStore((state) => state.isSearching);

  const favoriteAddresses = useConsolidatedSearchStore(
    (state) => state.favoriteAddresses
  );

  // State to track when isochrone and important location markers are rendered
  const [isMapReady, setIsMapReady] = React.useState(false);
  // Track if user explicitly selected a tab to avoid auto-switching overriding user choice
  const userTabOverrideRef = React.useRef<{
    active: boolean;
    tab: "results" | "saved" | null;
  }>({ active: false, tab: null });
  // Track previous searching state to detect "search just completed"
  const wasSearchingRef = React.useRef<boolean>(false);

  // Individual action selectors - Zustand selectors are already stable
  const setSearchResults = useConsolidatedSearchStore(
    (s) => s.setSearchResults
  );
  const setHasSearched = useConsolidatedSearchStore((s) => s.setHasSearched);
  const setIsSearching = useConsolidatedSearchStore((s) => s.setIsSearching);
  const setSearchStage = useConsolidatedSearchStore((s) => s.setSearchStage);
  const setCurrentPage = useConsolidatedSearchStore((s) => s.setCurrentPage);
  const setActiveTab = useConsolidatedSearchStore((s) => s.setActiveTab);
  const setShowPropertyModals = useConsolidatedSearchStore(
    (s) => s.setShowPropertyModals
  );
  const setIsCarouselCollapsed = useConsolidatedSearchStore(
    (s) => s.setIsCarouselCollapsed
  );
  const setFavoriteAddresses = useConsolidatedSearchStore(
    (s) => s.setFavoriteAddresses
  );

  // Get searchStage from store directly - Zustand selectors are already stable
  const searchStage = useConsolidatedSearchStore((s) => s.searchStage);

  // Constants
  const PROPERTIES_PER_PAGE = 1;

  // Map reference
  const mapRef = useRef<HTMLDivElement>(null);

  // Property details hook
  const {
    isLoading: isLoadingPropertyDetails,
    selectedProperty,
    fetchPropertyDetails,
    clearSelectedProperty,
  } = usePropertyDetails();

  // Saved homes data hook
  const {
    savedHomes: savedHomesData,
    saveHome: saveHomeToFavorites,
    removeSavedHome: removeSavedHomeFromFavorites,
    isHomeSaved,
  } = useSavedHomesData();

  // Memory monitoring is handled by useMemoryMonitoring hook

  // Convert SavedHome[] to PropertyDetails[] for compatibility - memoized to prevent recreation
  const savedHomes: PropertyDetails[] = React.useMemo(
    () =>
      savedHomesData.map((home) => ({
        id: home.home_id,
        address: home.address ?? "Address not available",
        price:
          typeof home.price === "string"
            ? home.price.startsWith("$")
              ? home.price
              : `$${home.price}`
            : typeof home.price === "number"
              ? `$${home.price.toLocaleString()}`
              : "N/A",
        bedrooms: home.bedrooms ?? 0,
        bathrooms: home.bathrooms ?? 0,
        sqft: home.sqft ?? 0,
        lat: home.lat ?? 0,
        lng: home.lng ?? 0,
        lotSize: home.lot_size as string | undefined,
        propertyType: "SINGLE_FAMILY" as const,
        listingStatus: "FOR_SALE" as const,
        imageUrl: home.image_url,
        _score: (home as any).score ?? (home as any)._score ?? 0, // Preserve actual score from saved home data
      })),
    [savedHomesData]
  );

  // Build a normalized set of saved addresses for cross-checking saved state on results
  const savedAddressesSet = React.useMemo(() => {
    const addresses = new Set<string>();
    // from saved homes data
    for (const h of savedHomesData) {
      if (h.address) addresses.add(h.address.toLowerCase().trim());
    }
    // from favoriteAddresses in store (if any)
    for (const addr of favoriteAddresses ?? []) {
      if (addr) addresses.add(addr.toLowerCase().trim());
    }
    return addresses;
  }, [savedHomesData, favoriteAddresses]);

  // Memoize normalized search results to prevent infinite re-renders
  const normalizedSearchResults = React.useMemo(
    () => propertyUtils.normalizeArrayToPropertyDetails(searchResults),
    [searchResults]
  );

  // Memoize normalized saved homes to prevent infinite re-renders
  const normalizedSavedHomes = React.useMemo(
    () => propertyUtils.normalizeArrayToPropertyDetails(savedHomes),
    [savedHomes]
  );

  // Sidebar and carousel should always receive full lists; map handles pagination internally

  // Wrapper functions for compatibility
  const saveHome = useCallback(
    async (property: PropertyDetails) => {
      try {
        await saveHomeToFavorites(property);
        setFavoriteAddresses([...favoriteAddresses, property.address]);
      } catch (error) {
        handleError(error as Error, "saveHome");
        console.error("❌ Error saving home:", error);
      }
    },
    [saveHomeToFavorites, favoriteAddresses, setFavoriteAddresses, handleError]
  );

  const removeSavedHome = useCallback(
    async (propertyId: string) => {
      try {
        await removeSavedHomeFromFavorites(propertyId);
        const updatedAddresses = savedHomes
          .filter((home) => home.id !== propertyId)
          .map((home) => home.address);
        setFavoriteAddresses(updatedAddresses);
      } catch (error) {
        handleError(error as Error, "removeSavedHome");
        console.error("❌ Error removing saved home:", error);
      }
    },
    [
      removeSavedHomeFromFavorites,
      savedHomes,
      setFavoriteAddresses,
      handleError,
    ]
  );

  // Handle property details search
  const handleViewPropertyDetails = useCallback(
    async (property: PropertyDetails) => {
      try {
        const propertyForDetails = {
          ...property,
          latitude: property.lat,
          longitude: property.lng,
          property_type: property.propertyType ?? "Unknown",
          listing_status: "active",
          price:
            typeof property.price === "string"
              ? property.price
              : property.price.toString(),
          images:
            property.images?.map((img) =>
              typeof img === "string" ? img : img.url
            ) || [],
        };
        await fetchPropertyDetails(propertyForDetails);
      } catch (error) {
        handleError(error as Error, "handleViewPropertyDetails");
      }
    },
    [fetchPropertyDetails, handleError]
  );

  // Initialize search bootstrap
  const { isLocalStorageLoaded } = useSearchBootstrap({
    env,
    setSearchResults,
    setHasSearched,
    setCurrentPage,
    setShowPropertyModals,
  });

  // Log initialization state - throttled to avoid excessive logging
  const lastLogStateRef = useRef<string>("");
  React.useEffect(() => {
    const currentState = JSON.stringify({
      isLocalStorageLoaded,
      hasSearched,
      searchResultsCount: searchResults.length,
      savedHomesCount: savedHomes.length,
      isMapReady,
      isSearching,
      activeTab,
      currentPage,
    });

    // Only log if state has actually changed
    if (currentState !== lastLogStateRef.current) {
      console.log("📊 [SEARCH_PAGE] Initialization state:", {
        isLocalStorageLoaded,
        hasSearched,
        searchResultsCount: searchResults.length,
        savedHomesCount: savedHomes.length,
        isMapReady,
        isSearching,
        activeTab,
        currentPage,
      });
      lastLogStateRef.current = currentState;
    }
  }, [
    isLocalStorageLoaded,
    hasSearched,
    searchResults.length,
    savedHomes.length,
    isMapReady,
    isSearching,
    activeTab,
    currentPage,
  ]);

  // Log currentPage changes specifically
  React.useEffect(() => {
    console.log("📄 [SEARCH_PAGE] Current page changed:", {
      currentPage,
      activeTab,
      searchResultsCount: searchResults.length,
      savedHomesCount: savedHomes.length,
      currentPropertyIndex: currentPage * PROPERTIES_PER_PAGE,
      currentPropertyId:
        activeTab === "results"
          ? searchResults[currentPage * PROPERTIES_PER_PAGE]?.id
          : savedHomes[currentPage * PROPERTIES_PER_PAGE]?.id,
      currentPropertyAddress:
        activeTab === "results"
          ? searchResults[currentPage * PROPERTIES_PER_PAGE]?.address
          : savedHomes[currentPage * PROPERTIES_PER_PAGE]?.address,
    });
  }, [currentPage, activeTab, searchResults, savedHomes]);

  // Log when localStorage is loaded
  React.useEffect(() => {
    if (isLocalStorageLoaded) {
    }
  }, [isLocalStorageLoaded]);

  // Search results are now saved via unified cache only

  // Memoize the parameters to prevent infinite re-renders
  const googleMapRef = React.useMemo(() => ({ current: null }), []);
  const renderIsochronePolygon = React.useCallback(() => {}, []);
  const renderImportantLocationMarkers = React.useCallback(
    () => Promise.resolve(),
    []
  );
  const mapFocusOnCurrentProperty = React.useCallback(() => {}, []);

  const searchPropertiesInIsochroneCallback = React.useCallback(
    async (
      _isochroneData: Record<string, unknown>,
      setSearchStageCb: (stage?: string) => void,
      setSearchResultsCb: (results: PropertyDetails[]) => void,
      setIsSearchingCb: (searching: boolean) => void,
      setHasSearchedCb: (searched: boolean) => void,
      setCurrentPageCb: (page: number) => void,
      setShowPropertyModalsCb: (show: boolean) => void
    ) => {
      try {
        setIsSearchingCb(true);
        setSearchStageCb("Locating homes in your area...");
        setSearchResultsCb([]);

        // Load preferences (required by backend /properties-by-polygon)
        setSearchStageCb("Loading your preferences...");
        let userPreferences: any = {};
        try {
          const prefResp = await preferencesApi.get();
          if (prefResp?.success && prefResp.preferences) {
            userPreferences = prefResp.preferences;
          }
        } catch (e) {
          console.warn(
            "⚠️ Could not load preferences, proceeding with defaults"
          );
        }

        setSearchStageCb("Extracting property data...");
        const response = await searchService.searchByPolygon({
          user_preferences: userPreferences,
          perBucketPages: 20,
        });

        if (!response?.success) {
          throw new Error(response?.error || "Search failed");
        }

        const mapped: PropertyDetails[] = (response.properties || []).map(
          mapBackendPropertyToDetails
        );

        setSearchStageCb("Evaluating scores...");
        await new Promise((r) => setTimeout(r, 300));

        setSearchStageCb("Finalizing results...");
        setSearchResultsCb(mapped);

        // Save to unified cache via store only
        const store = useConsolidatedSearchStore.getState();
        store.saveSearchResultsToCache(mapped, "1.0");

        setHasSearchedCb(true);
        setIsSearchingCb(false);
        setCurrentPageCb(0);
        setShowPropertyModalsCb(true);
      } catch (err) {
        setIsSearchingCb(false);
        setSearchStageCb("");
        console.error("❌ Error during polygon search:", err);
      }
    },
    [
      setSearchResults,
      setIsSearching,
      setHasSearched,
      setCurrentPage,
      setShowPropertyModals,
    ]
  );

  const setSearchStageCallback = React.useCallback(
    (stage?: string) => setSearchStage(stage ?? ""),
    [setSearchStage]
  );

  // Isochrone flow hook
  const { runIsochroneSearch } = useIsochroneFlow({
    env,
    googleMapRef,
    renderIsochronePolygon,
    renderImportantLocationMarkers,
    searchPropertiesInIsochrone: searchPropertiesInIsochroneCallback,
    setSearchStage: setSearchStageCallback,
    setSearchResults,
    setIsSearching,
    setHasSearched,
    setCurrentPage,
    setShowPropertyModals,
    mapFocusOnCurrentProperty,
  });

  // Log isochrone flow initialization
  React.useEffect(() => {
  }, []);

  // Auto-trigger search when localStorage is loaded and no cached results exist
  React.useEffect(() => {
    if (isLocalStorageLoaded && !hasSearched && searchResults.length === 0) {
      // Small delay to ensure all components are ready
      const timer = setTimeout(() => {
        void runIsochroneSearch();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [
    isLocalStorageLoaded,
    hasSearched,
    searchResults.length,
    runIsochroneSearch,
  ]);

  // Handle search
  const handleSearch = useCallback(() => {
    if (!isSearching) {
      // New search invalidates any prior user tab override
      userTabOverrideRef.current = { active: false, tab: null };
      void runIsochroneSearch();
    } else {
      console.log("⏸️ [SEARCH_PAGE] Search already in progress, skipping");
    }
  }, [isSearching, hasSearched, runIsochroneSearch]);

  // Handle tab change - match legacy implementation exactly
  const handleTabChange = useCallback(
    (tab: "results" | "saved") => {
    
      // Mark user override so auto-switch won't immediately flip back
      userTabOverrideRef.current = { active: true, tab };

      setActiveTab(tab);
      setCurrentPage(0);

      // Match legacy implementation exactly
      if (tab === "saved") {
        // For saved homes, we can show modals even without searching since these are user's saved properties
        if (savedHomes.length > 0) {
          setShowPropertyModals(true);
          setHasSearched(true); // Allow saved homes to be viewed
        }
      } else {
        // For results tab, only enable if we have search results
        if (hasSearched && searchResults.length > 0) {
          setShowPropertyModals(true);
        }
      }
    },
    [
      setActiveTab,
      setCurrentPage,
      setShowPropertyModals,
      setHasSearched,
      savedHomes.length,
      savedHomesData.length,
      hasSearched,
      searchResults.length,
      showPropertyModals,
    ]
  );

  // Auto-switch to results tab when search completes
  React.useEffect(() => {
    // Detect transition: searching -> not searching
    const justCompleted = wasSearchingRef.current && !isSearching;
    wasSearchingRef.current = isSearching;

    // Only switch to results tab if search just completed, we have results,
    // we're not already on results, and there is no active user override
    if (
      justCompleted &&
      hasSearched &&
      searchResults.length > 0 &&
      activeTab !== "results" &&
      !userTabOverrideRef.current.active
    ) {
      setActiveTab("results");
    }
  }, [isSearching, hasSearched, searchResults.length, activeTab, setActiveTab]);

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
    },
    [
      setCurrentPage,
      currentPage,
      activeTab,
      searchResults.length,
      savedHomes.length,
    ]
  );

  // Handle preferences update
  const handleUpdatePreferences = useCallback(() => {
    navigate("/dashboard/personalization");
  }, [navigate]);

  // Handle carousel toggle
  const handleToggleCarousel = useCallback(() => {
    setIsCarouselCollapsed(!isCarouselCollapsed);
  }, [isCarouselCollapsed, setIsCarouselCollapsed]);

  // Handle map ready state
  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
  }, []);

  // Centralized logic for determining when to show loading overlay
  // Only show loading overlay when localStorage is not loaded and no cached results exist
  // Keep map visible at all times once Google Maps is loaded
  const shouldShowLoadingOverlay = React.useMemo(() => {
    return !isLocalStorageLoaded && searchResults.length === 0;
  }, [isLocalStorageLoaded, searchResults.length]);

  // Centralized loading message logic
  const getLoadingMessage = React.useCallback(() => {
    if (!isMapReady) {
      return "Loading map...";
    }
    if (isSearching) {
      return searchStage ?? "Searching properties...";
    }
    return "Loading map...";
  }, [isMapReady, isSearching, searchStage]);

  // Listen for preferences changes
  useEffect(() => {
    const handlePreferencesChange = () => {
      // Preferences change handling can be added here if needed
    };

    window.addEventListener("preferencesChanged", handlePreferencesChange);
    return () => {
      window.removeEventListener("preferencesChanged", handlePreferencesChange);
    };
  }, []);

  // Listen for search trigger from mobile header
  useEffect(() => {
    const handleTriggerSearch = () => {
      handleSearch();
    };

    window.addEventListener("triggerSearch", handleTriggerSearch);
    return () => {
      window.removeEventListener("triggerSearch", handleTriggerSearch);
    };
  }, [handleSearch]);

  // Memory monitoring is handled by useMemoryMonitoring hook

  // Log layout rendering
  React.useEffect(() => {
  }, [isMapReady]);

  return (
    <div className="h-full">
      {/* Desktop Layout - Default at any screen size */}
      <DesktopSearchLayout
        searchResults={normalizedSearchResults}
        savedHomes={normalizedSavedHomes}
        savedAddresses={savedAddressesSet}
        activeTab={activeTab}
        currentPage={currentPage}
        hasSearched={hasSearched}
        searchStage={searchStage}
        showPropertyModals={showPropertyModals}
        isCarouselCollapsed={isCarouselCollapsed}
        isLocalStorageLoaded={isLocalStorageLoaded}
        isMapReady={isMapReady}
        shouldShowLoadingOverlay={shouldShowLoadingOverlay}
        getLoadingMessage={getLoadingMessage}
        onMapReady={handleMapReady}
        selectedProperty={selectedProperty}
        isLoadingPropertyDetails={isLoadingPropertyDetails}
        onViewPropertyDetails={(property: PropertyDetails) => {
          // Property is already PropertyDetails format, use directly
          handleViewPropertyDetails(property);
        }}
        onSearch={handleSearch}
        onTabChange={handleTabChange}
        onToggleCarousel={handleToggleCarousel}
        onPageChange={handlePageChange}
        onUpdatePreferences={handleUpdatePreferences}
        perPage={PROPERTIES_PER_PAGE}
        isHomeSaved={isHomeSaved}
        onSaveHome={(property: PropertyDetails) => {
          // Property is already PropertyDetails format, use directly
          saveHome(property);
        }}
        onRemoveSavedHome={removeSavedHome}
        mapRef={mapRef}
      />

      {/* Property Details Modal */}
      <PropertyDetailsModal
        property={selectedProperty}
        onClose={clearSelectedProperty}
        isHomeSaved={isHomeSaved}
        saveHome={(property) => {
          // PropertyDetailsModal passes SearchResult, but our saveHome expects PropertyDetails
          // Find the original PropertyDetails by ID
          const propertyDetails =
            searchResults.find((p: PropertyDetails) => p.id === property.id) ||
            savedHomes.find((p: PropertyDetails) => p.id === property.id);
          if (propertyDetails) {
            saveHome(propertyDetails);
          }
        }}
        removeSavedHome={removeSavedHome}
      />

      {/* Cache Monitor - Development Only */}
      <CacheMonitor showInDevelopment={true} />
    </div>
  );
}
