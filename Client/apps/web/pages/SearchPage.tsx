// React imports
import { ChevronUp, ChevronDown } from "lucide-react";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Components
import PropertyDetailsModal from "../components/modals/PropertyDetailsModal";
import KeyTurnLoader from "../components/ui/loading/KeyTurnLoader";

// Core
import { env } from "../../../packages/config";
import { preferencesApi } from "../../../packages/config/api/preferences";
import { userApi } from "../../../packages/config/api/user";
import { useGoogleMaps } from "../../../packages/hooks/data/useGoogleMaps";
import { usePropertyDetails } from "../../../packages/hooks/data/usePropertyDetails";
import type { SearchResult } from "../../../packages/schemas/search";
import { useFiltersStore, useUIStore } from "../../../packages/store";
import type { IsochroneData } from "../../../packages/schemas/api";
import { asError } from "../../../packages/utils/error";

// Features
import {
  renderImportantLocationMarkers,
  type GoogleAdvancedMarkerElement,
} from "../features/search/lib/importantLocationRenderer";
import { renderIsochronePolygon } from "../features/search/lib/isochroneRenderer";
import { saveSearchResults } from "../features/search/lib/localStorage";
import { useMapZoomController } from "../features/search/lib/MapZoomController";
import { MapControls } from "../features/search/page/components/MapControls";
import { PropertyCarousel } from "../features/search/page/components/PropertyCarousel";
import { SidebarList } from "../features/search/page/components/SidebarList";
import { Tabs } from "../features/search/page/components/Tabs";
import { useIsochroneFlow } from "../features/search/page/useIsochroneFlow";
import { useMapInitAndResize } from "../features/search/page/useMapInitAndResize";
import { useMapMarkers } from "../features/search/hooks/useMapMarkers";
import { useMarkerUpdates } from "../features/search/page/useMarkerUpdates";
import useMobileHeaderActions from "../features/search/page/useMobileHeaderActions";
import { usePropertyFocus } from "../features/search/page/usePropertyFocus";
import { useSavedHomes } from "../features/search/page/useSavedHomes";
import { useSearchBootstrap } from "../features/search/page/useSearchBootstrap";
import { searchPropertiesInIsochrone } from "../features/search/services/propertySearch";
import SearchHeader from "../features/search/SearchHeader";

type SearchPageProps = {
  setMobileHeaderActions: React.Dispatch<
    React.SetStateAction<React.ReactNode | null>
  >;
  onSearchProperties?: () => Promise<void>;
  searchRef?: React.MutableRefObject<{
    triggerSearch: () => Promise<void>;
  } | null>;
};

export default function SearchPage({
  setMobileHeaderActions,
  onSearchProperties,
  searchRef,
}: SearchPageProps) {
  const navigate = useNavigate();
  const { isLoaded: isGoogleMapsLoaded, createMap } = useGoogleMaps();
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const setFavoriteAddresses = useFiltersStore((s) => s.setFavoriteAddresses);
  const isSearching = useFiltersStore((s) => s.isSearching);
  const setIsSearching = useFiltersStore((s) => s.setIsSearching);
  const searchStage = useFiltersStore((s) => s.searchStage);
  const setSearchStage = useFiltersStore((s) => s.setSearchStage);
  const {
    isLoading: isLoadingPropertyDetails,
    selectedProperty,
    fetchPropertyDetails,
    clearSelectedProperty,
  } = usePropertyDetails();
  const [hasSearched, setHasSearched] = useState(false);
  const [isochroneData, setIsochroneData] = useState<unknown>(null);
  const currentPage = useFiltersStore((s) => s.currentPage);
  const setCurrentPage = useFiltersStore((s) => s.setCurrentPage);
  const showPropertyModals = useUIStore((s) => s.showPropertyModals);
  const setShowPropertyModals = useUIStore((s) => s.setShowPropertyModals);
  const isCarouselCollapsed = useUIStore((s) => s.isCarouselCollapsed);
  const setIsCarouselCollapsed = useUIStore((s) => s.setCarouselCollapsed);
  const PROPERTIES_PER_PAGE = 1; // Keep at 1 for mobile single-property navigation

  // Mobile header button handlers
  const handlePreferences = useCallback(() => {
    // Use a more direct approach for mobile navigation
    if (window.innerWidth < 1024) {
      // For mobile, use window.location to ensure navigation works
      window.location.href = "/personalization";
    } else {
      // For desktop, use React Router
      navigate("/personalization");
    }
  }, [navigate]);

  const activeTab = useFiltersStore((s) => s.activeTab);
  const setActiveTab = useFiltersStore((s) => s.setActiveTab);

  // Handle property details search using the hook with enhanced logging
  const handleViewPropertyDetails = useCallback(
    async (property: SearchResult) => {
      // Map SearchResult to Property format for the hook
      const propertyForDetails = {
        ...property,
        latitude: property.lat,
        longitude: property.lng,
        property_type: property.propertyType ?? "Unknown",
        listing_status: "active", // Default status
      };

      try {
        await fetchPropertyDetails(propertyForDetails);
      } catch (error) {
        console.error(
          "🏠 [PROPERTY_DETAILS] Failed to fetch property details:",
          {
            propertyId: property.id,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
          }
        );
      }
    },
    [fetchPropertyDetails]
  );

  // Initialize hooks
  const { isLocalStorageLoaded } = useSearchBootstrap({
    env,
    setSearchResults,
    setHasSearched,
    setCurrentPage,
    setShowPropertyModals,
  });

  const mobileMapRef = useRef<HTMLDivElement>(null);
  const desktopMapRef = useRef<HTMLDivElement>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const individualPolygonsRef = useRef<google.maps.Polygon[]>([]);

  const { googleMapRef } = useMapInitAndResize({
    isLocalStorageLoaded,
    isGoogleMapsLoaded,
    createMap: createMap as (container: HTMLElement) => google.maps.Map | null,
    mobileMapRef,
    desktopMapRef,
  });

  const { savedHomes, isHomeSaved, saveHome, removeSavedHome } = useSavedHomes({
    userApi,
    setFavoriteAddresses,
    isGoogleMapsLoaded,
  });

  // Handle navigation to property (focus on property instead of opening details)
  const handleNavigateToProperty = useCallback(
    (property: SearchResult) => {
      // Find the property index in the current data
      const currentData = activeTab === "results" ? searchResults : savedHomes;
      const propertyIndex = currentData.findIndex((p) => p.id === property.id);

      if (propertyIndex !== -1) {
        setCurrentPage(propertyIndex);
      } else {
        console.error(
          "🎯 [PROPERTY_NAVIGATION] Property not found in current data:",
          {
            propertyId: property.id,
            activeTab,
            searchResultsCount: searchResults.length,
            savedHomesCount: savedHomes.length,
            timestamp: new Date().toISOString(),
          }
        );
      }
    },
    [activeTab, searchResults, savedHomes, setCurrentPage]
  );

  // Initialize MapZoomController
  const {
    resetToDefaultZoom,
    zoomIn: mapZoomIn,
    zoomOut: mapZoomOut,
    focusOnCurrentProperty: mapFocusOnCurrentProperty,
  } = useMapZoomController({
    googleMapRef,
    activeTab,
    searchResults,
    savedHomes,
    currentPage,
  });

  // Use centralized isochrone renderer with enhanced logging
  const renderIsochronePolygonWrapper = useCallback(
    (isochroneData: unknown) => {
      if (!googleMapRef.current) {
        console.warn("❌ Google Map not initialized yet");
        return;
      }

      renderIsochronePolygon(isochroneData as IsochroneData, {
        map: googleMapRef.current,
        polygonRef,
        individualPolygonsRef,
        focusOnCurrentProperty: mapFocusOnCurrentProperty,
      });
    },
    [mapFocusOnCurrentProperty, googleMapRef]
  );

  // Use imported renderImportantLocationMarkers function with enhanced logging
  const renderImportantLocationMarkersWrapper = useCallback(
    (isochroneData: unknown) => {
      if (!googleMapRef.current) {
        console.warn(
          "❌ Cannot render important location markers: map not available"
        );
        return;
      }

      renderImportantLocationMarkers(isochroneData as IsochroneData, {
        map: googleMapRef.current,
        importantMarkersRef,
        setImportantLocationMarkers: (
          markers: GoogleAdvancedMarkerElement[]
        ) => {
          importantMarkersRef.current = markers;
        },
        resetToDefaultZoom,
      });
    },
    [resetToDefaultZoom, googleMapRef]
  );

  // Save search results to localStorage with preferences version
  const saveSearchResultsToLocalStorage = useCallback(
    async (results: SearchResult[]) => {
      try {
        // Fetch current user preferences to get the version
        let preferencesVersion = "1.0"; // Default version

        try {
          const { apiBaseUrl } = env;

          // Use fetch with credentials to send HTTP-only cookies
          const response = await fetch(`${apiBaseUrl}/api/v1/preferences`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // Send HTTP-only cookies
          });

          if (response?.ok) {
            const data = (await response.json()) as Record<string, unknown>;
            preferencesVersion =
              data.preferences &&
              typeof data.preferences === "object" &&
              "preferences_version" in data.preferences
                ? (data.preferences as { preferences_version: string })
                    .preferences_version
                : "1.0";
          }
        } catch (prefError: unknown) {
          const error = asError(prefError);
          console.warn(
            "⚠️ Could not fetch preferences version, using default:",
            error
          );
        }

        const searchData = {
          results,
          timestamp: new Date().toISOString(),
          totalCount: results.length,
          preferencesVersion,
          searchMetadata: {
            hasSearched: true,
            currentPage: 0,
            propertiesPerPage: PROPERTIES_PER_PAGE,
          },
        };

        saveSearchResults(searchData);
      } catch (error: unknown) {
        console.error("❌ Error saving search results to localStorage:", error);
      }
    },
    []
  );

  const {
    primeIsochroneOverlay,
    runIsochroneSearch,
    fetchIsochroneForMapOnly,
  } = useIsochroneFlow({
    env,
    googleMapRef,
    renderIsochronePolygon: renderIsochronePolygonWrapper,
    renderImportantLocationMarkers: (isochroneData: unknown) => {
      renderImportantLocationMarkersWrapper(isochroneData);
      return Promise.resolve();
    },
    searchPropertiesInIsochrone: async (isochroneData: unknown) => {
      // Get user preferences for the search
      let userPrefs = {};
      try {
        const response = await preferencesApi.get();
        if (
          response &&
          typeof response === "object" &&
          "success" in response &&
          response.success &&
          "preferences" in response &&
          response.preferences
        ) {
          userPrefs = response.preferences;
        }
      } catch (prefError: unknown) {
        const error = asError(prefError);
        console.warn(
          "⚠️ Could not fetch user preferences, using empty preferences:",
          error
        );
      }

      // Use the service function
      await searchPropertiesInIsochrone(
        isochroneData as IsochroneData,
        userPrefs,
        (stage: string) => setSearchStage(stage),
        setSearchResults,
        setIsSearching,
        setHasSearched,
        setCurrentPage,
        setShowPropertyModals,
        saveSearchResultsToLocalStorage
      );
    },
    prefsApi: preferencesApi,
    setSearchStage: (stage?: string) => setSearchStage(stage ?? ""),
    setSearchResults,
    setIsSearching,
    setHasSearched,
    setCurrentPage,
    setShowPropertyModals,
    saveSearchResultsToLocalStorage,
    mapFocusOnCurrentProperty,
  });

  // Update handleSearch to use runIsochroneSearch or external handler with enhanced logging
  const handleSearchUpdated = useCallback(async () => {
    if (!isSearching) {
      if (onSearchProperties) {
        await onSearchProperties();
      } else {
        await runIsochroneSearch();
      }
    }
  }, [isSearching, onSearchProperties, activeTab, currentPage]);

  // Memoize the search function to prevent unnecessary re-exposure
  const memoizedSearchFunction = React.useCallback(async () => {
    if (!isSearching) {
      await runIsochroneSearch();
    }
  }, [isSearching]);

  // Expose search function through ref (reduced logging)
  React.useEffect(() => {
    if (searchRef) {
      searchRef.current = {
        triggerSearch: memoizedSearchFunction,
      };
    }
  }, [searchRef]); // Remove memoizedSearchFunction from dependencies

  // Create stable callback for opening property details
  const handleOpenPropertyDetails = useCallback(
    (propertyId: string) => {
      // Find the property in current data (search results or saved homes)
      const currentData = activeTab === "results" ? searchResults : savedHomes;
      const property = currentData.find((p) => p.id === propertyId);

      if (property) {
        void handleViewPropertyDetails(property);
      } else {
        console.error("🗺️ MAP MODAL: Property not found with ID:", propertyId);
        console.error(
          "🗺️ MAP MODAL: Available properties:",
          currentData.map((p) => ({ id: p.id, address: p.address }))
        );
      }
    },
    [activeTab, searchResults, savedHomes, handleViewPropertyDetails]
  );

  useMarkerUpdates({
    googleMapRef,
    onOpenDetails: handleOpenPropertyDetails,
    isHomeSaved,
    saveHome,
    removeSavedHome,
    activeTab,
    currentPage,
    hasSearched,
    showPropertyModals,
    searchResults,
    savedHomes,
  });

  // Calculate property score for markers
  const calculatePropertyScore = useCallback(
    (property: SearchResult): number => {
      // Simple scoring algorithm - can be enhanced later
      let score = 0;

      // Price scoring (lower is better)
      if (property.price) {
        const price =
          typeof property.price === "string"
            ? parseFloat(property.price)
            : property.price;
        if (!isNaN(price)) {
          if (price < 300000) score += 30;
          else if (price < 500000) score += 20;
          else if (price < 750000) score += 10;
        }
      }

      // Bedrooms scoring
      if (property.bedrooms) {
        if (property.bedrooms >= 3) score += 20;
        else if (property.bedrooms >= 2) score += 10;
      }

      // Bathrooms scoring
      if (property.bathrooms) {
        if (property.bathrooms >= 2) score += 15;
        else if (property.bathrooms >= 1.5) score += 10;
      }

      // Square footage scoring
      if (property.sqft) {
        if (property.sqft >= 2000) score += 20;
        else if (property.sqft >= 1500) score += 15;
        else if (property.sqft >= 1000) score += 10;
      }

      return Math.min(score, 100); // Cap at 100
    },
    []
  );

  // Use the map markers hook to actually create property markers
  const { updateMapMarkers, importantMarkersRef } = useMapMarkers({
    googleMapRef,
    currentPage,
    propertiesPerPage: PROPERTIES_PER_PAGE,
    isochroneData,
    setIsochroneData,
    fetchIsochroneForMapOnly,
    calculatePropertyScore,
    isHomeSaved,
    saveHome,
    removeSavedHome,
    onMarkerClick: handleNavigateToProperty,
    onUnlockClick: handleViewPropertyDetails,
  });

  // Track previous data to avoid unnecessary marker updates
  const prevDataRef = useRef<{
    resultsLength: number;
    savedLength: number;
    activeTab: string;
    currentPage: number;
  }>({
    resultsLength: 0,
    savedLength: 0,
    activeTab: "results",
    currentPage: 0,
  });

  // Update markers when search results, saved homes, or active tab changes
  useEffect(() => {
    if (!googleMapRef.current) return;

    const currentData = activeTab === "results" ? searchResults : savedHomes;
    const hasData = searchResults.length > 0 || savedHomes.length > 0;

    // Check if data actually changed (including tab changes even with same lengths)
    const dataChanged =
      prevDataRef.current.resultsLength !== searchResults.length ||
      prevDataRef.current.savedLength !== savedHomes.length ||
      prevDataRef.current.activeTab !== activeTab ||
      prevDataRef.current.currentPage !== currentPage;

    if (hasData && dataChanged) {
      void updateMapMarkers(currentData);

      // Update previous data
      prevDataRef.current = {
        resultsLength: searchResults.length,
        savedLength: savedHomes.length,
        activeTab,
        currentPage,
      };
    }
  }, [
    searchResults.length,
    savedHomes.length,
    searchResults,
    savedHomes,
    activeTab,
    currentPage,
    googleMapRef,
    updateMapMarkers,
  ]);

  usePropertyFocus({
    googleMapRef,
    activeTab,
    searchResults,
    savedHomes,
    currentPage,
    mapFocusOnCurrentProperty,
    selectedProperty,
  });

  useMobileHeaderActions({
    setMobileHeaderActions,
    isSearching,
    onPreferences: handlePreferences,
    onSearch: handleSearchUpdated,
  });

  // Reset to first page when switching tabs and save to localStorage with enhanced logging
  const handleTabChange = (tab: "results" | "saved") => {
    setActiveTab(tab);
    setCurrentPage(0);
  };

  // Initialize isochrone overlay after map is ready (only once) with enhanced logging
  const hasInitializedIsochrone = useRef(false);

  useEffect(() => {
    if (!isLocalStorageLoaded || !isGoogleMapsLoaded) return;
    if (hasInitializedIsochrone.current) return;

    hasInitializedIsochrone.current = true;

    // ---------- Isochrone overlay logic ----------
    setTimeout(() => {
      void primeIsochroneOverlay(searchResults.length > 0);
    }, 100);
  }, [isLocalStorageLoaded, isGoogleMapsLoaded, searchResults.length]);

  return (
    <div className="h-full">
      {/* Mobile Layout */}
      <div className="flex h-full flex-col md:hidden">
        {/* Mobile Carousel for Properties */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-white">
          {/* Tab Navigation with Expand Button */}
          <div className="flex items-center justify-center border-b border-gray-200">
            <Tabs
              active={activeTab}
              onChange={(tab) => {
                handleTabChange(tab);
                if (
                  tab === "results" &&
                  hasSearched &&
                  searchResults.length > 0
                ) {
                  setShowPropertyModals(true);
                } else if (tab === "saved" && savedHomes.length > 0) {
                  setShowPropertyModals(true);
                  setHasSearched(true);
                }
              }}
              counts={{
                results: searchResults.length,
                saved: savedHomes.length,
              }}
              compact
            />

            {/* Collapse/Expand Button - positioned after saved tab */}
            <div className="ml-4 px-2">
              <button
                onClick={() => setIsCarouselCollapsed(!isCarouselCollapsed)}
                className="cursor-help-hint p-1 text-gray-500 transition-colors hover:text-gray-700"
                title={
                  isCarouselCollapsed ? "Expand carousel" : "Collapse carousel"
                }
              >
                {isCarouselCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Property Carousel */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isCarouselCollapsed ? "max-h-0" : "max-h-96"
            }`}
          >
            <div className="py-3">
              <PropertyCarousel
                items={activeTab === "results" ? searchResults : savedHomes}
                currentPage={currentPage}
                isHomeSaved={isHomeSaved}
                onSave={saveHome}
                onViewDetails={handleViewPropertyDetails}
                onSlideChange={(index) => setCurrentPage(index)}
                infiniteLoop={false}
              />
            </div>
          </div>
        </div>

        {/* Mobile Map - Takes majority of screen */}
        <div className="relative flex-1">
          {/* Loading overlay - Only show when actively searching */}
          {isSearching && (
            <div className="absolute inset-0 z-20 flex h-full w-full items-center justify-center bg-gray-50">
              <div className="gap-responsive-sm flex flex-col items-center">
                <KeyTurnLoader
                  message={searchStage ?? "Searching properties..."}
                />
              </div>
            </div>
          )}

          {/* Map container */}
          <div className="relative h-full w-full overflow-hidden rounded-t-2xl">
            <div
              ref={mobileMapRef}
              className="h-full w-full"
              style={{ minHeight: "100%" }}
            />

            {/* Mobile Map Controls */}
            {!isSearching && (
              <MapControls
                page={currentPage}
                total={
                  activeTab === "results"
                    ? searchResults.length
                    : savedHomes.length
                }
                perPage={PROPERTIES_PER_PAGE}
                onPrev={() => setCurrentPage(Math.max(0, currentPage - 1))}
                onNext={() => setCurrentPage(currentPage + 1)}
                onZoomIn={mapZoomIn}
                onZoomOut={mapZoomOut}
                disabled={!hasSearched}
              />
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="gap-responsive-md hidden h-full md:flex">
        {/* Sidebar */}
        <div className="flex w-64 flex-shrink-0 flex-col">
          <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white p-4">
            {/* Tab Navigation */}
            <Tabs
              active={activeTab}
              onChange={(tab) => {
                handleTabChange(tab);
                if (
                  tab === "results" &&
                  hasSearched &&
                  searchResults.length > 0
                ) {
                  setShowPropertyModals(true);
                } else if (tab === "saved" && savedHomes.length > 0) {
                  setShowPropertyModals(true);
                  setHasSearched(true);
                }
              }}
              counts={{
                results: searchResults.length,
                saved: savedHomes.length,
              }}
            />

            {/* Tab Content - Scrollable */}
            <div className="flex-1 overflow-hidden">
              <SidebarList
                items={activeTab === "results" ? searchResults : savedHomes}
                selectedId={selectedProperty?.id}
                isLoading={isLoadingPropertyDetails}
                isHomeSaved={isHomeSaved}
                onSave={saveHome}
                onNavigateToProperty={handleNavigateToProperty}
                removeSavedHome={removeSavedHome}
                activeTab={activeTab}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          {/* Search Header */}
          <div className="hidden flex-shrink-0 lg:block">
            <SearchHeader
              onUpdatePreferences={handlePreferences}
              onSearchProperties={handleSearchUpdated}
              isSearching={isSearching}
            />
          </div>

          {/* Desktop Map - Takes remaining height */}
          <div className="relative flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white">
            {/* Loading overlay - shows until at least one property is available on map */}
            {(isSearching ||
              (hasSearched &&
                searchResults.length === 0 &&
                savedHomes.length === 0) ||
              (!hasSearched &&
                searchResults.length === 0 &&
                savedHomes.length === 0)) && (
              <div className="absolute inset-0 z-20 flex h-full w-full items-center justify-center rounded-lg bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                  <KeyTurnLoader
                    message={
                      isSearching
                        ? (searchStage ?? "Searching properties...")
                        : "Loading map..."
                    }
                  />
                </div>
              </div>
            )}

            {/* Map container - always present in DOM */}
            <div className="relative h-full w-full">
              <div
                ref={desktopMapRef}
                className="h-full w-full rounded-lg"
                style={{ minHeight: "400px" }}
              />

              {/* Desktop Map Controls - hidden during search */}
              {!isSearching && (
                <MapControls
                  page={currentPage}
                  total={
                    activeTab === "results"
                      ? searchResults.length
                      : savedHomes.length
                  }
                  perPage={PROPERTIES_PER_PAGE}
                  onPrev={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  onNext={() => setCurrentPage(currentPage + 1)}
                  onZoomIn={mapZoomIn}
                  onZoomOut={mapZoomOut}
                  disabled={!hasSearched}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Property Details Modal */}
      <PropertyDetailsModal
        property={selectedProperty}
        onClose={clearSelectedProperty}
        isHomeSaved={isHomeSaved}
        saveHome={saveHome}
        removeSavedHome={removeSavedHome}
      />
    </div>
  );
}
