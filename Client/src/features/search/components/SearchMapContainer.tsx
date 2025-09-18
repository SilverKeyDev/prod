import React, { useRef, useCallback, useEffect } from "react";

import { env } from "../../../core/config";
import { useGoogleMapsStore } from "../../../core/store/googleMaps.slice";
import { usePropertyDetails } from "../../../core/hooks/data/usePropertyDetails";
import { useSavedHomesData } from "../../../core/hooks/data/useSavedHomesData";
import type { IsochroneData as ApiIsochroneData } from "../../../core/schemas/api";
import type { IsochroneData } from "../../../core/schemas/search";
import type {
  SearchResult,
  PropertyDetails,
} from "../../../core/schemas/search";
import { useConsolidatedSearchStore } from "../../../core/store/search";
import { asError } from "../../../core/utils/error";
import RippleBackground from "../../homeauth/RippleBackground";
import { useMapInitAndResize } from "../hooks/ui/useMapInitAndResize";
import { useOptimizedMarkerUpdates } from "../hooks/ui/useMarkerUpdates";
import { usePropertyFocus } from "../hooks/ui/usePropertyFocus";
import { useIsochroneFlow } from "../hooks/data/useIsochroneFlow";
import { renderImportantLocationMarkers } from "../lib/importantLocationRenderer";
import { renderIsochronePolygon } from "../lib/isochroneRenderer";
import { searchPropertiesInIsochrone } from "../hooks/data/useSearch";
import { useMapZoomController } from "../lib/MapZoomController";
import { useUnifiedCache, memoryUtils } from "../hooks/unifiedCache";

import MapControls from "./mobile/MapControls";

export type SearchMapContainerProps = {
  /** Map reference */
  mapRef: React.RefObject<HTMLDivElement>;
  /** Whether the map is in mobile mode */
  isMobile?: boolean;
  /** Search results to display */
  searchResults: PropertyDetails[];
  /** Saved homes to display */
  savedHomes: PropertyDetails[];
  /** Current active tab */
  activeTab: "results" | "saved";
  /** Current page number */
  currentPage: number;
  /** Whether search has been performed */
  hasSearched: boolean;
  /** Whether to show property modals */
  showPropertyModals: boolean;
  /** Callback when map is ready (isochrone and markers rendered) */
  onMapReady?: () => void;
  /** Properties per page */
  perPage?: number;
  /** Set of saved addresses for fallback saved state detection */
  savedAddresses?: Set<string>;
};

export default function SearchMapContainer({
  mapRef,
  isMobile = false,
  searchResults,
  savedHomes,
  activeTab,
  currentPage,
  hasSearched,
  showPropertyModals,
  onMapReady,
  perPage = 1,
  savedAddresses,
}: SearchMapContainerProps) {
  const { isLoaded: isGoogleMapsLoaded, createMap } = useGoogleMapsStore();
  const [renderVersion, setRenderVersion] = React.useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const isochroneInitializedRef = useRef(false);

  // Memory management
  const unifiedCache = useUnifiedCache();

  // Store selectors - using consolidated store
  const favoriteAddresses = useConsolidatedSearchStore(
    (s) => s.favoriteAddresses
  );
  const setFavoriteAddresses = useConsolidatedSearchStore(
    (s) => s.setFavoriteAddresses
  );
  const setSearchStage = useConsolidatedSearchStore((s) => s.setSearchStage);
  const setSearchResults = useConsolidatedSearchStore(
    (s) => s.setSearchResults
  );
  const setIsSearching = useConsolidatedSearchStore((s) => s.setIsSearching);
  const setCurrentPage = useConsolidatedSearchStore((s) => s.setCurrentPage);
  const setShowPropertyModals = useConsolidatedSearchStore(
    (s) => s.setShowPropertyModals
  );
  const setHasSearched = useConsolidatedSearchStore((s) => s.setHasSearched);

  // Property details hook
  const { selectedProperty, fetchPropertyDetails } = usePropertyDetails();

  // Saved homes data hook
  const {
    savedHomes: savedHomesData,
    saveHome: saveHomeToFavorites,
    removeSavedHome: removeSavedHomeFromFavorites,
    isHomeSaved,
  } = useSavedHomesData();

  // Convert SavedHome[] to SearchResult[] for compatibility - memoized to prevent recreation
  const convertedSavedHomes: SearchResult[] = React.useMemo(
    () =>
      savedHomesData.map((home) => ({
        id: home.home_id,
        address: home.address ?? "Address not available",
        price:
          typeof home.price === "string"
            ? home.price
            : (home.price?.toLocaleString() ?? "N/A"),
        bedrooms: home.bedrooms ?? 0,
        bathrooms: home.bathrooms ?? 0,
        sqft: home.sqft ?? 0,
        lat: home.lat ?? 0,
        lng: home.lng ?? 0,
        lotSize: home.lot_size as string | undefined,
        propertyType: "SINGLE_FAMILY",
        listingStatus: "FOR_SALE",
        imageUrl:
          home.image_url ||
          (home as any).imageUrl ||
          (home as any).imageSrc ||
          (home as any).imgSrc ||
          (home as any).images?.[0]?.url ||
          (home as any).imgUrl,
      })),
    [savedHomesData]
  );

  // Wrapper functions for compatibility
  const saveHome = useCallback(
    async (property: PropertyDetails) => {
      try {
        // Convert PropertyDetails to SearchResult format for the API
        const searchResult = {
          id: property.id,
          address: property.address,
          price:
            typeof property.price === "string"
              ? property.price
              : property.price.toString(),
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          sqft: property.sqft,
          lat: property.lat,
          lng: property.lng,
          lotSize: property.lotSize,
          propertyType: property.propertyType as string,
          listingStatus: property.listingStatus as string,
          imageUrl:
            property.imageUrl ||
            (property as any).image_url ||
            (property as any).imageSrc ||
            (property as any).imgSrc ||
            (property as any).images?.[0]?.url ||
            (property as any).imgUrl,
        };
        await saveHomeToFavorites(searchResult);
        setFavoriteAddresses([...favoriteAddresses, property.address]);
      } catch (error) {
        console.error("❌ Error saving home:", error);
      }
    },
    [saveHomeToFavorites, favoriteAddresses, setFavoriteAddresses]
  );

  const removeSavedHome = useCallback(
    async (propertyId: string) => {
      try {
        await removeSavedHomeFromFavorites(propertyId);
        const updatedAddresses = convertedSavedHomes
          .filter((home) => home.id !== propertyId)
          .map((home) => home.address);
        setFavoriteAddresses(updatedAddresses);
      } catch (error) {
        console.error("❌ Error removing saved home:", error);
      }
    },
    [removeSavedHomeFromFavorites, convertedSavedHomes, setFavoriteAddresses]
  );

  // Map initialization - always initialize on page load
  const { googleMapRef } = useMapInitAndResize({
    isLocalStorageLoaded: true, // Assume loaded for now
    isGoogleMapsLoaded: isGoogleMapsLoaded, // Always initialize when Google Maps is loaded
    createMap: createMap as (container: HTMLElement) => google.maps.Map | null,
    mapRef,
  });

  // Removed extra debug logging

  // Removed extra debug logging

  // Map zoom controller
  const {
    resetToDefaultZoom,
    zoomIn: mapZoomIn,
    zoomOut: mapZoomOut,
    focusOnCurrentProperty: mapFocusOnCurrentProperty,
  } = useMapZoomController({
    googleMapRef,
    activeTab,
    searchResults,
    savedHomes: savedHomes,
    currentPage,
    hasSearched,
  });

  // Refs for map elements
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const individualPolygonsRef = useRef<google.maps.Polygon[]>([]);
  const importantMarkersRef = useRef<
    google.maps.marker.AdvancedMarkerElement[]
  >([]);

  // Isochrone polygon renderer - use useMemo to ensure stability
  const renderIsochronePolygonWrapper = React.useMemo(
    () => (isochroneData: unknown) => {
      // Removed extra debug logging

      if (!googleMapRef.current) {
        // Removed extra debug logging
        return;
      }

      // Removed extra debug logging
      renderIsochronePolygon(isochroneData as IsochroneData, {
        map: googleMapRef.current,
        polygonRef,
        individualPolygonsRef,
        focusOnCurrentProperty: mapFocusOnCurrentProperty,
        version: renderVersion,
      });
    },
    [renderVersion] // Only recreate when renderVersion changes
    // mapFocusOnCurrentProperty will be captured when the function is called
  );

  // Important location markers renderer - use useMemo to ensure stability
  const renderImportantLocationMarkersWrapper = React.useMemo(
    () => (isochroneData: unknown) => {
      // Removed extra debug logging

      if (!googleMapRef.current) {
        // Removed extra debug logging
        return;
      }

      // Convert API IsochroneData to search schema IsochroneData
      const apiData = isochroneData as ApiIsochroneData;

      const searchData: IsochroneData = {
        isochrone: {
          type: "Polygon",
          geometry: {
            type: "Polygon",
            coordinates: apiData.isochrone.geometry.coordinates,
          },
        },
        center: {
          lat: apiData.center.lat,
          lon: apiData.center.lng,
          address: "",
          name: "",
        },
        locations: apiData.locations,
      };

      renderImportantLocationMarkers(searchData, {
        map: googleMapRef.current,
        importantMarkersRef,
        setImportantLocationMarkers: (
          markers: google.maps.marker.AdvancedMarkerElement[]
        ) => {
          importantMarkersRef.current = markers;
        },
        resetToDefaultZoom,
        version: renderVersion,
      });
    },
    [renderVersion] // Only recreate when renderVersion changes
    // resetToDefaultZoom will be captured when the function is called
  );

  // Save search results to localStorage
  const saveSearchResultsToLocalStorage = useCallback(
    async (results: SearchResult[]) => {
      try {
        let preferencesVersion = "1.0";

        try {
          const idToken = sessionStorage.getItem("id_token");
          const { apiBaseUrl } = env;

          if (idToken) {
            const response = await fetch(`${apiBaseUrl}/api/v1/preferences`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${idToken}`,
                "Content-Type": "application/json",
              },
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
          }
        } catch (prefError: unknown) {
          const error = asError(prefError);
          console.warn(
            "⚠️ Could not fetch preferences version, using default:",
            error
          );
        }

        // Search results are now saved via unified cache only
        console.log(
          "📦 [SEARCH_MAP] Search results will be saved via unified cache:",
          {
            count: results.length,
            preferencesVersion,
          }
        );
      } catch (error: unknown) {
        console.error("❌ Error preparing search results for cache:", error);
      }
    },
    [perPage]
  );

  // Isochrone flow hook
  // Remove the logging that was causing excessive re-renders

  // Stable wrapper for renderImportantLocationMarkers
  const renderImportantLocationMarkersStable = useCallback(
    (isochroneData: unknown) => {
      // Removed extra debug logging
      renderImportantLocationMarkersWrapper(isochroneData);
      return Promise.resolve();
    },
    [] // Remove dependencies - function will capture current value when called
  );

  // Memoize the search function to prevent recreation
  const searchPropertiesInIsochroneStable = useCallback(
    async (isochroneData: unknown) => {
      // Convert API IsochroneData to search schema IsochroneData
      const apiData = isochroneData as ApiIsochroneData;
      const searchData: IsochroneData = {
        isochrone: {
          type: "Polygon",
          geometry: {
            type: "Polygon",
            coordinates: apiData.isochrone.geometry.coordinates,
          },
        },
        center: {
          lat: apiData.center.lat,
          lon: apiData.center.lng,
          address: "",
          name: "",
        },
        locations: apiData.locations,
      };

      await searchPropertiesInIsochrone(
        searchData,
        (stage: string) => setSearchStage(stage),
        setSearchResults,
        setIsSearching,
        setHasSearched, // FIXED: Actually call setHasSearched
        setCurrentPage,
        setShowPropertyModals
      );
    },
    [] // Remove ALL dependencies - functions will capture current values when called
  );

  // Memoize the setSearchStage wrapper
  const setSearchStageStable = useCallback(
    (stage?: string) => setSearchStage(stage ?? ""),
    [] // Remove dependencies - function will capture current value when called
  );

  // Memoize the setHasSearched wrapper
  const setHasSearchedStable = useCallback(
    (searched: boolean) => setHasSearched(searched), // FIXED: Actually call setHasSearched
    [setHasSearched]
  );

  // Memoize the entire params object to prevent hook recreation
  const isochroneFlowParams = React.useMemo(() => {
    return {
      env: { apiBaseUrl: env.apiBaseUrl },
      googleMapRef,
      renderIsochronePolygon: renderIsochronePolygonWrapper,
      renderImportantLocationMarkers: renderImportantLocationMarkersStable,
      searchPropertiesInIsochrone: searchPropertiesInIsochroneStable,
      setSearchStage: setSearchStageStable,
      setSearchResults,
      setIsSearching,
      setHasSearched: setHasSearchedStable,
      setCurrentPage,
      setShowPropertyModals,
      saveSearchResultsToLocalStorage,
      mapFocusOnCurrentProperty,
    };
  }, [
    // Only recreate when the wrapper functions themselves change
    renderIsochronePolygonWrapper,
    renderImportantLocationMarkersStable,
    searchPropertiesInIsochroneStable,
    setSearchStageStable,
    setHasSearchedStable,
    // Remove ALL other dependencies - they will be captured when functions are called
  ]);

  const { primeIsochroneOverlay } = useIsochroneFlow(isochroneFlowParams);

  // Handle property details search
  const handleViewPropertyDetails = useCallback(
    async (property: PropertyDetails) => {
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
    },
    [fetchPropertyDetails]
  );

  // Handle opening property details
  const handleOpenPropertyDetails = useCallback(
    (propertyId: string) => {
      const currentData = activeTab === "results" ? searchResults : savedHomes;
      const property = currentData.find((p) => p.id === propertyId);

      if (property) {
        void handleViewPropertyDetails(property);
      } else {
        console.error("🗺️ MAP MODAL: Property not found with ID:", propertyId);
      }
    },
    [activeTab, searchResults, savedHomes, handleViewPropertyDetails]
  );

  // Property score calculation is handled by useMarkers hook via getMatchScore

  // Global window function for map modal "View Details" buttons (legacy compatibility)
  useEffect(() => {
    (window as any).openPropertyModal = (propertyId: string) => {
      handleOpenPropertyDetails(propertyId);
    };

    return () => {
      delete (window as any).openPropertyModal;
    };
  }, [handleOpenPropertyDetails]);

  // Marker updates - only log once per significant change

  useOptimizedMarkerUpdates({
    googleMapRef,
    isHomeSaved,
    saveHome,
    removeSavedHome,
    activeTab,
    currentPage,
    perPage,
    isMobile,
    hasSearched,
    showPropertyModals,
    searchResults,
    savedHomes: convertedSavedHomes as unknown as PropertyDetails[],
    savedAddresses,
  });

  // Property focus
  usePropertyFocus({
    googleMapRef,
    activeTab,
    searchResults,
    savedHomes: savedHomes,
    currentPage,
    mapFocusOnCurrentProperty,
    selectedProperty,
  });

  // Rendering validation function
  const validateRendering = useCallback(() => {
    const hasPolygon = !!polygonRef.current;
    const hasMarkers = importantMarkersRef.current.length > 0;

    // Removed extra debug logging

    if (!hasPolygon) {
      // Removed extra debug logging
    }

    // Removed extra debug logging

    return { hasPolygon, hasMarkers };
  }, []);

  // Initialize isochrone overlay - always render on page load
  useEffect(() => {
    if (!isGoogleMapsLoaded || isochroneInitializedRef.current) return;

    isochroneInitializedRef.current = true;
    const timer = setTimeout(async () => {
      // Always render isochrone overlay on page load, regardless of search results
      await primeIsochroneOverlay(searchResults.length > 0);

      // Validate rendering after a longer delay to allow for async operations
      setTimeout(() => {
        validateRendering();
      }, 1000);

      // Notify that map is ready (isochrone and markers rendered)
      onMapReady?.();
    }, 100);

    // Register timer for cleanup
    memoryUtils.registerTimer(timer);

    return () => {
      clearTimeout(timer);
    };
  }, [
    isGoogleMapsLoaded,
    primeIsochroneOverlay,
    unifiedCache,
    onMapReady,
    searchResults.length,
    validateRendering,
  ]);

  // Listen for preferences changes
  useEffect(() => {
    const handlePreferencesChange = () => {
      setRenderVersion(new Date().toISOString().split("T")[0]);
    };

    window.addEventListener("preferencesChanged", handlePreferencesChange);
    return () => {
      window.removeEventListener("preferencesChanged", handlePreferencesChange);
    };
  }, []);

  // Register memory manager with global monitor
  useEffect(() => {
    // Memory monitoring is handled automatically by unified cache
    return () => {
      // Cleanup handled by unified cache
    };
  }, [unifiedCache]);

  const currentData =
    activeTab === "results" ? searchResults : convertedSavedHomes;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-t-2xl">
      {/* Removed debug log */}
      {/* RippleBackground - only show when there are search results */}
      {searchResults.length > 0 && (
        <div className="absolute inset-0 z-0">
          <RippleBackground />
        </div>
      )}

      {/* Map container */}
      <div
        ref={mapRef}
        className="h-full w-full"
        style={{ minHeight: "100%" }}
      />

      {/* Map Controls */}
      <MapControls
        variant={isMobile ? "mobile" : "desktop"}
        page={currentPage}
        total={currentData.length}
        perPage={perPage}
        onPrev={() => setCurrentPage(Math.max(0, currentPage - 1))}
        onNext={() => setCurrentPage(currentPage + 1)}
        onZoomIn={mapZoomIn}
        onZoomOut={mapZoomOut}
        disabled={currentData.length === 0}
      />
    </div>
  );
}
