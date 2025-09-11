// React imports
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// types
import { SearchResult } from "../../types/search";

// Third-party UI icons
import {
  Bookmark,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

// API clients
import { preferencesApi } from "../../api/preferences";
import { userApi } from "../../api/user";

// Services
import { searchPropertiesInIsochrone } from "../../features/search/services/propertySearch";
import { renderImportantLocationMarkers } from "../../features/search/lib/importantLocationRenderer";
import { renderIsochronePolygon } from "../../features/search/lib/isochroneRenderer";

// Context providers
import { useGoogleMaps } from "../../context/GoogleMapsContext";

// Hooks
import { usePropertyDetails } from "../../hooks/usePropertyDetails";
import { useMapZoomController } from "../../features/search/lib/MapZoomController";

// Utility functions
import { checkAuthAndRedirect, getAuthToken } from "../../lib/authUtils";

// UI Components
import {
  CardImageContainer,
  CardPropertyDetails,
  CardMatchScore,
  CardHeartSave,
  CardCarousel,
} from "../../components/cards/base";
import { PropertyCard } from "../../components/cards";
import { renderMapPropertyCard } from "../../components/cards/MapPropertyCard";
import PropertyDetailsModal from "../../components/modals/PropertyDetailsModal";
import KeyTurnLoader from "../../components/ui/loading/KeyTurnLoader";

// Feature components
import SearchMobileHeader from "../../features/search/SearchMobileHeader";
import SearchHeader from "../../features/search/SearchHeader";

interface SearchPageProps {
  setMobileHeaderActions: React.Dispatch<
    React.SetStateAction<React.ReactNode | null>
  >;
}

export default function SearchPage({
  setMobileHeaderActions,
}: SearchPageProps) {
  const navigate = useNavigate();
  const { isLoaded: isGoogleMapsLoaded, createMap } = useGoogleMaps();
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [savedHomes, setSavedHomes] = useState<SearchResult[]>([]);
  const [favoriteAddresses, setFavoriteAddresses] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStage, setSearchStage] = useState<string>("");
  const {
    isLoading: isLoadingPropertyDetails,
    selectedProperty,
    fetchPropertyDetails,
    clearSelectedProperty,
  } = usePropertyDetails();
  const [isLocalStorageLoaded, setIsLocalStorageLoaded] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isUpdatingMarkers, setIsUpdatingMarkers] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showPropertyModals, setShowPropertyModals] = useState(false);
  const [isCarouselCollapsed, setIsCarouselCollapsed] = useState(false);
  const PROPERTIES_PER_PAGE = 1;

  // Mobile header button handlers
  const handlePreferences = useCallback(() => {
    navigate("/dashboard/personalization");
  }, [navigate]);

  const handleSearch = useCallback(() => {
    if (!isSearching) {
      fetchIsochronePolygon();
    }
  }, [isSearching]);

  // Load search results from localStorage or run fresh search based on preferences version
  useEffect(() => {
    const initializeSearchResults = async () => {
      try {
        let currentPreferencesVersion = "0"; // Default version

        try {
          const idToken = localStorage.getItem("id_token");
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

          if (idToken) {
            const response = await fetch(`${apiBaseUrl}/api/v1/preferences`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${idToken}`,
                "Content-Type": "application/json",
              },
            });

            if (response.ok) {
              const data = await response.json();
              currentPreferencesVersion =
                data.preferences?.preferences_version || "1.0";
            }
          }
        } catch (prefError) {
          console.warn(
            "⚠️ Could not fetch current preferences version, using default:",
            prefError,
          );
        }

        // Check localStorage for saved search results
        const savedSearchData = loadSearchResultsFromLocalStorage();
        const savedPreferencesVersion = savedSearchData?.preferencesVersion;

        // Decide whether to load from localStorage or run fresh search
        if (
          savedSearchData &&
          savedSearchData.results &&
          savedSearchData.results.length > 0 &&
          savedPreferencesVersion === currentPreferencesVersion
        ) {
          setSearchResults(savedSearchData.results);
          setHasSearched(savedSearchData.searchMetadata?.hasSearched || true);
          setCurrentPage(savedSearchData.searchMetadata?.currentPage || 0);
          setShowPropertyModals(true);
        }
      } catch (error) {
        console.error("❌ Error in search results initialization:", error);
        // Fallback: try to load any saved data regardless of version
        const savedSearchData = loadSearchResultsFromLocalStorage();
        if (
          savedSearchData &&
          savedSearchData.results &&
          savedSearchData.results.length > 0
        ) {
          setSearchResults(savedSearchData.results);
          setHasSearched(true);
          setShowPropertyModals(true);
        }
      }

      // Mark localStorage loading as complete
      setIsLocalStorageLoaded(true);
    };

    initializeSearchResults();
  }, []); // Empty dependency array - only run on mount

  // Mobile header actions setup
  useEffect(() => {
    // Cleanup actions when component unmounts
    return () => {
      setMobileHeaderActions(null);
    };
  }, [setMobileHeaderActions]);

  // Handle mobile header actions based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setMobileHeaderActions(
          <SearchMobileHeader
            onPreferences={handlePreferences}
            onSearch={handleSearch}
            isSearching={isSearching}
          />,
        );
      } else {
        setMobileHeaderActions(null);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [setMobileHeaderActions, handlePreferences, handleSearch, isSearching]);

  const [activeTab, setActiveTab] = useState<"results" | "saved">("results");

  // Reset to first page when switching tabs and save to localStorage
  const handleTabChange = (tab: "results" | "saved") => {
    setActiveTab(tab);
    setCurrentPage(0);
  };
  const mobileMapRef = useRef<HTMLDivElement>(null);
  const desktopMapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const individualPolygonsRef = useRef<google.maps.Polygon[]>([]);
  const importantMarkersRef = useRef<
    google.maps.marker.AdvancedMarkerElement[]
  >([]);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

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

  // Use backend ML match score (already calculated as 0-100 integer)
  const calculatePropertyScore = (property: SearchResult) => {
    return property._score || 0; // Backend ML score (0-100 integer)
  };

  // Save search results to localStorage with preferences version
  const saveSearchResultsToLocalStorage = async (results: SearchResult[]) => {
    try {
      // Fetch current user preferences to get the version
      let preferencesVersion = "1.0"; // Default version

      try {
        const idToken = localStorage.getItem("id_token");
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

        if (idToken) {
          const response = await fetch(`${apiBaseUrl}/api/v1/preferences`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            preferencesVersion = data.preferences?.preferences_version || "1.0";
          }
        }
      } catch (prefError) {
        console.warn(
          "⚠️ Could not fetch preferences version, using default:",
          prefError,
        );
      }

      const searchData = {
        results: results,
        timestamp: new Date().toISOString(),
        totalCount: results.length,
        preferencesVersion: preferencesVersion,
        searchMetadata: {
          hasSearched: true,
          currentPage: 0,
          propertiesPerPage: PROPERTIES_PER_PAGE,
        },
      };

      localStorage.setItem("searchResults", JSON.stringify(searchData));
    } catch (error) {
      console.error("❌ Error saving search results to localStorage:", error);
    }
  };

  // Load search results from localStorage on component mount
  const loadSearchResultsFromLocalStorage = () => {
    try {
      const savedData = localStorage.getItem("searchResults");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        return parsedData;
      }
    } catch (error) {
      console.error(
        "❌ Error loading search results from localStorage:",
        error,
      );
    }
    return null;
  };

  // Helper: which container is visible?
  const getVisibleMapEl = () => {
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    return isDesktop ? desktopMapRef.current : mobileMapRef.current;
  };

  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = () => {
      if (!isLocalStorageLoaded || !isGoogleMapsLoaded) return;

      const container = getVisibleMapEl();
      if (!container) return;

      const map = createMap(container);
      if (!map) {
        console.error("❌ Failed to create map");
        return;
      }

      googleMapRef.current = map;

      // Force map resize after creation
      setTimeout(() => {
        if (window.google?.maps?.event && googleMapRef.current) {
          window.google.maps.event.trigger(googleMapRef.current, "resize");
        }
      }, 100);

      // ---------- Isochrone overlay logic (unchanged) ----------
      setTimeout(() => {
        const fetcher =
          searchResults.length > 0
            ? fetchIsochroneForMapOnly
            : fetchIsochronePolygon;
        fetcher()
          .then((data) => {
            if (data) {
              renderIsochronePolygonWrapper(data);
              renderImportantLocationMarkersWrapper(data);
            } else {
              console.warn(
                "⚠️ No isochrone data received, polygon will not be displayed",
              );
            }
          })
          .catch((error) => {
            console.error(
              "❌ Failed to fetch or render isochrone polygon:",
              error,
            );
          });
      }, 100);
    };

    // Only initialize map after localStorage loading is complete and Google Maps is loaded
    if (isLocalStorageLoaded && isGoogleMapsLoaded) {
      initializeMap();
    }
  }, [isLocalStorageLoaded, isGoogleMapsLoaded, createMap]);

  // Handle resize/orientation changes
  useEffect(() => {
    const onResize = () => {
      const container = getVisibleMapEl();
      if (!container || !googleMapRef.current) return;

      // If the map was created in the hidden container, re-attach by recreating it
      if (!container.contains(googleMapRef.current.getDiv())) {
        const map = createMap(container);
        if (map) {
          googleMapRef.current = map;
        }
      }

      if (window.google?.maps?.event && googleMapRef.current) {
        window.google.maps.event.trigger(googleMapRef.current, "resize");
      }
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [createMap]);

  // Handle property details search using the hook
  const handleViewPropertyDetails = async (property: SearchResult) => {
    // Map SearchResult to Property format for the hook
    const propertyForDetails = {
      ...property,
      latitude: property.lat,
      longitude: property.lng,
    };
    await fetchPropertyDetails(propertyForDetails as any);
  };

  // Create window function for map modal "View Details" buttons
  useEffect(() => {
    // Define the global function that map modals can call
    (window as any).openPropertyModal = (propertyId: string) => {
      // Find the property in current data (search results or saved homes)
      const currentData = activeTab === "results" ? searchResults : savedHomes;
      const property = currentData.find((p) => p.id === propertyId);

      if (property) {
        handleViewPropertyDetails(property);
      } else {
        console.error("🗺️ MAP MODAL: Property not found with ID:", propertyId);
        console.error(
          "🗺️ MAP MODAL: Available properties:",
          currentData.map((p) => ({ id: p.id, address: p.address })),
        );
      }
    };

    // Cleanup function to remove global function when component unmounts
    return () => {
      delete (window as any).openPropertyModal;
    };
  }, [searchResults, savedHomes, activeTab, handleViewPropertyDetails]);

  // Map zoom controller functions
  // Use MapZoomController functions instead of manual implementations

  // Auto-zoom to selected property when it changes
  useEffect(() => {
    if (selectedProperty && googleMapRef.current) {
      // Use MapZoomController for consistent zoom behavior
      mapFocusOnCurrentProperty();

      console.log(
        `🎯 Auto-zoomed to property at ${selectedProperty.lat}, ${selectedProperty.lng} using MapZoomController`,
      );
    }
  }, [selectedProperty, mapFocusOnCurrentProperty]);

  // Focus map on current property when page changes (arrow clicks)
  useEffect(() => {
    if (
      googleMapRef.current &&
      (searchResults.length > 0 || savedHomes.length > 0)
    ) {
      // Use MapZoomController to focus on current property
      mapFocusOnCurrentProperty();
    }
  }, [
    currentPage,
    mapFocusOnCurrentProperty,
    searchResults.length,
    savedHomes.length,
  ]);

  // Focus map on current property when tab changes
  useEffect(() => {
    if (
      googleMapRef.current &&
      (searchResults.length > 0 || savedHomes.length > 0)
    ) {
      // Use MapZoomController to focus on current property after tab switch
      setTimeout(() => {
        mapFocusOnCurrentProperty();
      }, 100); // Small delay to ensure tab switch is complete
    }
  }, [
    activeTab,
    mapFocusOnCurrentProperty,
    searchResults.length,
    savedHomes.length,
  ]);

  // Update markers when activeTab, currentPage changes or when hasSearched/showPropertyModals changes
  useEffect(() => {
    if (googleMapRef.current && hasSearched && showPropertyModals) {
      // Show only the currently selected property marker
      const allData = activeTab === "results" ? searchResults : savedHomes;
      const currentProperty = allData[currentPage];
      if (currentProperty) {
        updateMapMarkers([currentProperty]); // Show only current property
      } else {
        updateMapMarkers([]); // Clear markers if no current property
      }
    } else if (googleMapRef.current && (!hasSearched || !showPropertyModals)) {
      // Clear all markers when user hasn't searched yet or property modals should not be shown
      markersRef.current.forEach((marker) => {
        marker.map = null;
        if ((marker as any).overlay) {
          (marker as any).overlay.setMap(null);
        }
      });
      markersRef.current = [];
    }
  }, [
    activeTab,
    currentPage,
    hasSearched,
    showPropertyModals,
    searchResults,
    savedHomes,
  ]);

  // Fetch isochrone polygon from backend for map population only (no property search)
  const fetchIsochroneForMapOnly = async () => {
    try {
      // Check auth and redirect if no token found
      if (!checkAuthAndRedirect(navigate)) {
        return null;
      }

      const authToken = getAuthToken();

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const response = await fetch(`${apiBaseUrl}/api/v1/search/isochrone`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.data) {
          return data.data;
        } else {
          console.warn("⚠️ Invalid isochrone response structure:", data);
          return null;
        }
      } else {
        const errorText = await response.text();
        console.error("❌ Isochrone API error:", response.status, errorText);
        return null;
      }
    } catch (error) {
      console.error("❌ Error fetching isochrone polygon:", error);
      return null;
    }
  };

  // Fetch isochrone polygon from backend
  const fetchIsochronePolygon = async () => {
    try {
      // Check auth and redirect if no token found
      if (!checkAuthAndRedirect(navigate)) {
        return null;
      }

      const authToken = getAuthToken();

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const response = await fetch(`${apiBaseUrl}/api/v1/search/isochrone`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.data) {
          await handleSearchPropertiesInIsochrone(data.data);

          return data.data;
        } else {
          console.warn(
            "⚠️ ISOCHRONE FAILED - API returned unsuccessful response:",
          );
          console.warn("  📄 Message:", data.message || "Unknown error");
          console.warn("  📊 Full Response:", JSON.stringify(data, null, 2));
        }
      } else {
        console.warn("⚠️ ISOCHRONE HTTP ERROR - Request failed:");
        console.warn("  🔢 Status Code:", response.status);
        console.warn("  📄 Status Text:", response.statusText);

        try {
          const errorText = await response.text();
          console.warn("  📋 Error Response Text:", errorText);

          // Try to parse as JSON for more structured error info
          try {
            const errorJson = JSON.parse(errorText);
            console.warn(
              "  📊 Error Response JSON:",
              JSON.stringify(errorJson, null, 2),
            );
          } catch (jsonError) {
            console.warn(
              "  📋 Error response is not JSON, showing as text above",
            );
          }
        } catch (textError) {
          console.warn("  ❌ Could not read error response text:", textError);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching isochrone polygon:", error);
    }
    return null;
  };

  // Automatically search for properties within the isochrone polygon
  const handleSearchPropertiesInIsochrone = async (isochroneData: unknown) => {
    // Get user preferences for the search
    let userPrefs = {};
    try {
      const response = await preferencesApi.get();
      if (response.success && response.preferences) {
        userPrefs = response.preferences;
      }
    } catch (prefError) {
      console.warn(
        "⚠️ Could not fetch user preferences, using empty preferences:",
        prefError,
      );
    }

    // Use the service function
    await searchPropertiesInIsochrone(
      isochroneData,
      userPrefs,
      setSearchStage,
      setSearchResults,
      setIsSearching,
      setHasSearched,
      setCurrentPage,
      setShowPropertyModals,
      saveSearchResultsToLocalStorage,
    );
  };

  // Use centralized isochrone renderer
  const renderIsochronePolygonWrapper = (isochroneData: unknown) => {
    if (!googleMapRef.current) {
      console.warn("❌ Google Map not initialized yet");
      return;
    }

    renderIsochronePolygon(isochroneData, {
      map: googleMapRef.current,
      polygonRef,
      individualPolygonsRef,
      focusOnCurrentProperty: mapFocusOnCurrentProperty,
    });
  };

  // Use imported renderImportantLocationMarkers function
  const renderImportantLocationMarkersWrapper = async (
    isochroneData: unknown,
  ) => {
    if (!googleMapRef.current) {
      console.warn(
        "❌ Cannot render important location markers: map not available",
      );
      return;
    }

    await renderImportantLocationMarkers(isochroneData, {
      map: googleMapRef.current,
      importantMarkersRef,
      setImportantLocationMarkers: (markers) => {
        importantMarkersRef.current = markers;
      },
      resetToDefaultZoom,
    });
  };

  // Load saved homes from user's favorite_home_ids on component mount
  useEffect(() => {
    const loadSavedHomes = async () => {
      try {
        // Check auth and redirect if no token found
        if (!checkAuthAndRedirect(navigate)) {
          return;
        }

        // Step 2: Call the centralized userApi
        const favoritesData = await userApi.getFavoriteHomes();

        if (!favoritesData.success) {
          console.error("🏠 API returned success=false:", favoritesData.error);
          return;
        }

        // Step 3: Extract actual saved homes data from API response (backend returns { favorites: HomeUniversal[] })
        const rawHomes = favoritesData.favorites || [];

        // Step 4: Convert HomeUniversal objects to SearchResult format (same as UserDashboard)
        if (rawHomes.length > 0) {
          const savedHomesData: SearchResult[] = await Promise.all(
            rawHomes.map(async (home: any, index: number) => {
              let lat = home.lat;
              let lng = home.lng;

              // If coordinates are missing, geocode the address
              if (!lat || !lng) {
                try {
                  // Check if Google Maps API is loaded before geocoding
                  if (!window.google || !window.google.maps) {
                    console.warn(
                      `⚠️ Google Maps API not loaded yet, skipping geocoding for ${home.address}`,
                    );
                    lat = 33.749; // Atlanta fallback
                    lng = -84.388;
                  } else {
                    const geocoder = new google.maps.Geocoder();
                    const geocodeResponse = await geocoder.geocode({
                      address: home.address,
                    });

                    if (
                      geocodeResponse.results &&
                      geocodeResponse.results.length > 0
                    ) {
                      const location =
                        geocodeResponse.results[0].geometry.location;
                      lat = location.lat();
                      lng = location.lng();
                    } else {
                      console.warn(
                        `⚠️ Could not geocode ${home.address}, using fallback coordinates`,
                      );
                      lat = 33.749; // Atlanta fallback
                      lng = -84.388;
                    }
                  }
                } catch (error) {
                  console.error(
                    `❌ Geocoding error for ${home.address}:`,
                    error,
                  );
                  lat = 33.749; // Atlanta fallback
                  lng = -84.388;
                }
              }

              return {
                id: home.address || `saved_${index + 1}`,
                address: home.address || "Address not available",
                price:
                  typeof home.price === "string" && home.price.startsWith("$")
                    ? home.price
                    : `$${home.price?.toLocaleString() || "N/A"}`,
                bedrooms: parseInt(home.beds) || 0,
                bathrooms: parseInt(home.baths) || 0,
                sqft: parseInt(home.sqft) || 0,
                lat: lat,
                lng: lng,
                lotSize: home.lot_size || undefined,
                propertyType: home.property_type || "SINGLE_FAMILY",
                listingStatus: home.listing_status || "FOR_SALE",
                imageUrl: home.image_url || undefined,
              };
            }),
          );

          // Extract addresses for favoriteAddresses state (for compatibility)
          const favoriteAddresses = rawHomes
            .map((home: unknown) => home.address)
            .filter(Boolean);

          // Update state
          setFavoriteAddresses(favoriteAddresses);
          setSavedHomes(savedHomesData);
        }
      } catch (error) {
        console.error("❌ ===== SAVED HOMES RETRIEVAL FAILED =====");
        console.error("❌ Error loading saved homes:", error);
        console.error("❌ Error type:", typeof error);
        if (error instanceof Error) {
          console.error("❌ Error message:", error.message);
          console.error("❌ Error stack:", error.stack);
        } else {
          console.error("❌ Unknown error type:", error);
        }
      }
    };

    loadSavedHomes();
  }, []); // Run once on mount

  // Update map markers
  const updateMapMarkers = async (results: SearchResult[]) => {
    if (!googleMapRef.current) {
      console.log("🗺️ [MARKER_DEBUG] No map reference available");
      return;
    }

    // Prevent duplicate processing using proper state
    if (isUpdatingMarkers) {
      console.log("🗺️ [MARKER_DEBUG] Already updating markers, skipping");
      return;
    }
    setIsUpdatingMarkers(true);

    console.log(
      "🗺️ [MARKER_DEBUG] Starting marker update for",
      results.length,
      "results",
    );

    // Clear existing HOME markers and overlays (but preserve important location markers)
    markersRef.current.forEach((marker) => {
      marker.map = null;
      // Also remove the overlay if it exists
      if ((marker as any).overlay) {
        (marker as any).overlay.setMap(null);
      }
    });
    markersRef.current = [];

    // Important location markers are rendered once on initial load
    // No need to re-render them when updating property markers

    // Show all properties (no pagination on map - users should see all markers)
    const currentData = results;

    console.log("🗺️ [MARKER_DEBUG] Marker data:", {
      totalResults: results.length,
      properties: currentData.map((p) => ({
        id: p.id,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
      })),
    });

    // Check if Google Maps API and AdvancedMarkerElement are available
    if (!window.google || !window.google.maps || !window.google.maps.marker) {
      console.warn(
        "⚠️ Google Maps API or AdvancedMarkerElement not available yet",
      );
      setIsUpdatingMarkers(false);
      return;
    }

    const { AdvancedMarkerElement } = window.google.maps.marker;

    currentData.forEach((result, index) => {
      console.log(
        `🗺️ [MARKER_DEBUG] Creating marker ${index + 1}/${currentData.length} for property:`,
        {
          id: result.id,
          address: result.address,
          lat: result.lat,
          lng: result.lng,
        },
      );
      // Use backend ML match score directly
      const score = calculatePropertyScore(result);
      // Simple color mapping based on score

      const isSaved = isHomeSaved(result.id);

      // Create custom marker element for AdvancedMarkerElement
      const markerElement = document.createElement("div");
      markerElement.style.cssText = `
        width: 24px;
        height: 32px;
        cursor: pointer;
      `;

      // Create the marker
      const marker = new AdvancedMarkerElement({
        map: googleMapRef.current,
        position: { lat: result.lat, lng: result.lng },
        title: result.address,
        content: markerElement,
      });

      console.log(`🗺️ [MARKER_DEBUG] Created marker for ${result.address}:`, {
        position: { lat: result.lat, lng: result.lng },
        hasMap: !!marker.map,
        markerElement: markerElement,
      });

      // Create property overlay using MapPropertyCard component
      const overlayDiv = document.createElement("div");
      overlayDiv.style.cssText = `
        position: absolute;
        transform: translate(-50%, -100%);
        margin-top: -8px;
        z-index: 1000;
        pointer-events: auto;
      `;

      // Convert SearchResult to MapPropertyCard format
      const propertyData = {
        id: result.id,
        address: result.address,
        price: result.price,
        bedrooms: result.bedrooms,
        bathrooms: result.bathrooms,
        sqft: result.sqft,
        lotSize: result.lotSize,
        propertyType: result.propertyType,
        lat: result.lat,
        lng: result.lng,
        images: result.imageUrl ? [result.imageUrl] : undefined,
        calculatedScore: score,
      };

      // Render MapPropertyCard into the overlay div
      renderMapPropertyCard(overlayDiv, {
        property: propertyData,
        isSaved: isSaved,
        onSave: () => saveHome(result),
        onUnsave: () => removeSavedHome(result.id),
        showScore: !isSaved, // Only show score for non-saved homes
      });

      // Create custom overlay
      class PropertyOverlay extends google.maps.OverlayView {
        private div: HTMLElement;
        private position: google.maps.LatLng;

        constructor(position: google.maps.LatLng, content: HTMLElement) {
          super();
          this.position = position;
          this.div = content;
        }

        onAdd() {
          const panes = this.getPanes();
          if (panes) {
            panes.overlayMouseTarget.appendChild(this.div);
          }
        }

        draw() {
          const projection = this.getProjection();
          if (projection) {
            const point = projection.fromLatLngToDivPixel(this.position);
            if (point) {
              this.div.style.left = point.x + "px";
              this.div.style.top = point.y + "px";
            }
          }
        }

        onRemove() {
          if (this.div.parentNode) {
            this.div.parentNode.removeChild(this.div);
          }
        }
      }

      const overlay = new PropertyOverlay(
        new google.maps.LatLng(result.lat, result.lng),
        overlayDiv,
      );
      overlay.setMap(googleMapRef.current);

      // Store overlay reference for cleanup
      (marker as any).overlay = overlay;
      markersRef.current.push(marker);
    });

    console.log("🗺️ [MARKER_DEBUG] Marker creation complete:", {
      totalMarkersCreated: markersRef.current.length,
      expectedCount: currentData.length,
      markerPositions: markersRef.current.map((m) => ({
        position: m.position,
        hasMap: !!m.map,
        title: m.title,
      })),
    });

    // Fit map to show current page markers with adaptive zoom
    if (results.length > 0) {
      // Focus on the first property in the current page results
      const firstProperty = results[0];
      if (firstProperty && googleMapRef.current) {
        // Use MapZoomController for consistent behavior
        mapFocusOnCurrentProperty();
      }
    }

    // Reset processing flag
    setIsUpdatingMarkers(false);
  };
  const saveHome = async (property: SearchResult) => {
    try {
      // Call backend API to add favorite
      const response = await userApi.addFavoriteHome({ home: property });
      if (response.success) {
        // Update local state
        const isAlreadySaved = savedHomes.find(
          (home) => home.id === property.id,
        );

        if (!isAlreadySaved) {
          setSavedHomes((prev) => {
            const newSavedHomes = [...prev, property];
            return newSavedHomes;
          });
        }

        // Update favorite addresses from backend response
        if (response.favorites) {
          setFavoriteAddresses(response.favorites);
        }
      } else {
        console.error("❌ Backend API returned failure:", response.error);
        console.error("🏠 ===== HOME SAVE OPERATION FAILED (FRONTEND) =====");
      }
    } catch (error) {
      console.error("🏠 ===== HOME SAVE OPERATION FAILED (FRONTEND) =====");
      console.error("❌ Error adding favorite:", error);
      console.error("❌ Error type:", typeof error);
      if (error instanceof Error) {
        console.error("❌ Error message:", error.message);
        console.error("❌ Error stack:", error.stack);
      }
    }
  };

  const removeSavedHome = async (propertyId: string) => {
    try {
      // Find the property to get its address
      const property = savedHomes.find((home) => home.id === propertyId);
      if (!property) {
        console.error(
          "❌ Property not found in local savedHomes state:",
          propertyId,
        );
        console.error("🗑️ ===== HOME UNSAVE OPERATION FAILED (FRONTEND) =====");
        return;
      }

      const response = await userApi.removeFavoriteHome({
        address: property.address,
      });

      if (response.success) {
        // Update local state
        setSavedHomes((prev) => {
          const newSavedHomes = prev.filter((home) => home.id !== propertyId);
          return newSavedHomes;
        });

        // Update favorite addresses from backend response
        if (response.favorites) {
          setFavoriteAddresses(response.favorites);
        }
      } else {
        console.error("❌ Backend API returned failure:", response.error);
      }
    } catch (error) {
      console.error("🗑️ ===== HOME UNSAVE OPERATION FAILED (FRONTEND) =====");
      console.error("❌ Error removing favorite:", error);
      console.error("❌ Error type:", typeof error);
      if (error instanceof Error) {
        console.error("❌ Error message:", error.message);
        console.error("❌ Error stack:", error.stack);
      }
    }
  };

  const isHomeSaved = (propertyId: string): boolean => {
    // Check both local savedHomes and favoriteAddresses from backend
    const property =
      searchResults.find((p) => p.id === propertyId) ||
      savedHomes.find((p) => p.id === propertyId);
    return (
      savedHomes.some((home) => home.id === propertyId) ||
      (property ? favoriteAddresses.includes(property.address) : false)
    );
  };

  // Zoom functions are defined above

  return (
    <div className="h-full">
      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col h-full">
        {/* Mobile Carousel for Properties */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200">
          {/* Tab Navigation */}
          <div className="flex justify-center items-center border-b border-gray-200">
            <button
              onClick={() => {
                handleTabChange("results");
                if (hasSearched && searchResults.length > 0) {
                  setShowPropertyModals(true);
                }
              }}
              className={`px-responsive-sm py-responsive-sm text-responsive-sm font-medium border-b-2 transition-colors ${
                activeTab === "results"
                  ? "border-brown text-brown"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>Search</span>
                {searchResults.length > 0 && (
                  <span className="w-5 h-5 bg-olive text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {searchResults.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => {
                handleTabChange("saved");
                // For saved homes, we can show modals even without searching since these are user's saved properties
                if (savedHomes.length > 0) {
                  setShowPropertyModals(true);
                  setHasSearched(true); // Allow saved homes to be viewed
                }
              }}
              className={`px-responsive-sm py-responsive-sm text-responsive-sm font-medium border-b-2 transition-colors ${
                activeTab === "saved"
                  ? "border-brown text-brown"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>Saved</span>
                {savedHomes.length > 0 && (
                  <span className="w-5 h-5 bg-olive text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {savedHomes.length}
                  </span>
                )}
              </div>
            </button>

            {/* Collapse/Expand Button */}
            <button
              onClick={() => setIsCarouselCollapsed(!isCarouselCollapsed)}
              className="ml-2 p-1 text-gray-500 hover:text-gray-700 transition-colors cursor-help-hint"
              title={
                isCarouselCollapsed ? "Expand carousel" : "Collapse carousel"
              }
            >
              {isCarouselCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Mobile Property Carousel */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isCarouselCollapsed ? "max-h-0" : "max-h-96"
            }`}
          >
            <div className="">
              {activeTab === "results" ? (
                searchResults.length > 0 ? (
                  <>
                    <CardCarousel
                      items={searchResults.slice(
                        currentPage * PROPERTIES_PER_PAGE,
                        (currentPage + 1) * PROPERTIES_PER_PAGE,
                      )}
                      renderItem={(property: SearchResult, _index: number) => (
                        <PropertyCard
                          id={property.id}
                          imageUrl={property.imageUrl}
                          address={
                            typeof property.address === "string" ||
                            typeof property.address === "number"
                              ? property.address.toString()
                              : "[Invalid address]"
                          }
                          price={
                            typeof property.price === "string" ||
                            typeof property.price === "number"
                              ? property.price.toString()
                              : "[Invalid price]"
                          }
                          bedrooms={property.bedrooms}
                          bathrooms={property.bathrooms}
                          sqft={property.sqft}
                          isSaved={isHomeSaved(property.id)}
                          onSave={() => saveHome(property)}
                          onViewDetails={() =>
                            handleViewPropertyDetails(property)
                          }
                          cardType="searchpage"
                        />
                      )}
                      getItemKey={(property: SearchResult, _index: number) =>
                        property.id
                      }
                    />
                  </>
                ) : (
                  <div className="text-center py-responsive-md sm:py-responsive-lg text-gray-500 px-responsive-sm">
                    <p className="text-responsive-sm sm:text-responsive-md">
                      No search results yet.
                    </p>
                    <p className="text-responsive-xs sm:text-responsive-sm mt-1">
                      Tap "Search Properties" to find homes.
                    </p>
                  </div>
                )
              ) : savedHomes.length > 0 ? (
                <CardCarousel
                  items={savedHomes.slice(
                    currentPage * PROPERTIES_PER_PAGE,
                    (currentPage + 1) * PROPERTIES_PER_PAGE,
                  )}
                  renderItem={(property: SearchResult, _index: number) => (
                    <PropertyCard
                      id={property.id}
                      imageUrl={property.imageUrl}
                      address={
                        typeof property.address === "string" ||
                        typeof property.address === "number"
                          ? property.address.toString()
                          : "[Invalid address]"
                      }
                      price={
                        typeof property.price === "string" ||
                        typeof property.price === "number"
                          ? property.price.toString()
                          : "[Invalid price]"
                      }
                      bedrooms={property.bedrooms}
                      bathrooms={property.bathrooms}
                      sqft={property.sqft}
                      isSaved={true}
                      onSave={() => saveHome(property)}
                      onViewDetails={() => handleViewPropertyDetails(property)}
                      cardType="searchpage"
                    />
                  )}
                  getItemKey={(property: SearchResult, _index: number) =>
                    property.id
                  }
                />
              ) : (
                <div className="text-center py-responsive-md sm:py-responsive-lg text-gray-500 px-responsive-sm">
                  <p className="text-responsive-sm sm:text-responsive-md">
                    No saved homes yet.
                  </p>
                  <p className="text-responsive-xs sm:text-responsive-sm mt-1">
                    Save homes from search results.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Map - Takes majority of screen */}
        <div className="flex-1 relative">
          {/* Loading overlay - Only show when actively searching */}
          {isSearching && (
            <div className="absolute inset-0 z-20 w-full h-full flex items-center justify-center bg-gray-50">
              <div className="flex flex-col items-center gap-responsive-sm">
                <KeyTurnLoader
                  message={searchStage || "Searching properties..."}
                />
              </div>
            </div>
          )}

          {/* Map container */}
          <div className="w-full h-full relative rounded-t-2xl overflow-hidden">
            <div
              ref={mobileMapRef}
              className="w-full h-full"
              style={{ minHeight: "100%" }}
            />

            {/* Mobile Map Controls */}
            {!isSearching && (
              <>
                {/* Mobile Zoom Controls */}
                <div className="absolute bottom-4 left-4 flex flex-col gap-responsive-xs z-10">
                  <button
                    onClick={mapZoomIn}
                    className="mobile-icon-sm sm:mobile-icon-lg md:mobile-icon-xl bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 touch-friendly cursor-zoom"
                    title="Zoom in"
                  >
                    <span className="text-responsive-sm font-bold leading-none">
                      +
                    </span>
                  </button>
                  <button
                    onClick={mapZoomOut}
                    className="mobile-icon-sm sm:mobile-icon-lg md:mobile-icon-xl bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 touch-friendly cursor-zoom"
                    title="Zoom out"
                  >
                    <span className="text-responsive-sm font-bold leading-none">
                      −
                    </span>
                  </button>
                </div>

                {/* Mobile Property Navigation Controls */}
                {hasSearched &&
                  (activeTab === "results"
                    ? searchResults.length > PROPERTIES_PER_PAGE
                    : savedHomes.length > PROPERTIES_PER_PAGE) && (
                    <div className="absolute bottom-4 right-4 flex flex-row gap-responsive-xs z-10">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(0, currentPage - 1))
                        }
                        disabled={currentPage === 0}
                        className="mobile-icon-sm sm:mobile-icon-lg md:mobile-icon-xl bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-700 disabled:hover:border-gray-300 touch-friendly"
                        title="Previous property"
                      >
                        <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <div className="mobile-icon-sm sm:mobile-icon-lg md:mobile-icon-xl bg-white border border-gray-300 rounded-lg shadow-md flex items-center justify-center text-xs sm:text-sm font-medium text-gray-700 px-2">
                        {Math.min(
                          (currentPage + 1) * PROPERTIES_PER_PAGE,
                          activeTab === "results"
                            ? searchResults.length
                            : savedHomes.length,
                        )}
                        <span className="mx-1">/</span>
                        {activeTab === "results"
                          ? searchResults.length
                          : savedHomes.length}
                      </div>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={
                          (currentPage + 1) * PROPERTIES_PER_PAGE >=
                          (activeTab === "results"
                            ? searchResults.length
                            : savedHomes.length)
                        }
                        className="mobile-icon-sm sm:mobile-icon-lg md:mobile-icon-xl bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-700 disabled:hover:border-gray-300 touch-friendly"
                        title="Next property"
                      >
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex gap-responsive-md h-full">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 flex flex-col">
          <div className="flex flex-col bg-white border border-gray-200 rounded-lg p-4 h-full">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-4 flex-shrink-0">
              <button
                onClick={() => {
                  handleTabChange("results");
                  if (hasSearched && searchResults.length > 0) {
                    setShowPropertyModals(true);
                  }
                }}
                className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "results"
                    ? "border-brown text-brown"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>Search</span>
                  {searchResults.length > 0 && (
                    <span className="w-5 h-5 bg-olive text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {searchResults.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => {
                  handleTabChange("saved");
                  // For saved homes, we can show modals even without searching since these are user's saved properties
                  if (savedHomes.length > 0) {
                    setShowPropertyModals(true);
                    setHasSearched(true); // Allow saved homes to be viewed
                  }
                }}
                className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "saved"
                    ? "border-brown text-brown"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>Saved</span>
                  {savedHomes.length > 0 && (
                    <span className="w-5 h-5 bg-olive text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {savedHomes.length}
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* Tab Content - Scrollable */}
            <div className="flex-1 overflow-hidden">
              {activeTab === "results" ? (
                // Search Results Tab
                <div className="h-full">
                  {searchResults.length > 0 ? (
                    <div className="h-full flex flex-col">
                      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3 pr-2">
                        {searchResults.map((property) => (
                          <div
                            key={property.id}
                            className={`w-full border rounded-lg cursor-pointer transition-all overflow-hidden relative ${
                              selectedProperty?.id === property.id
                                ? "border-brown bg-brown/5"
                                : "border-gray-200 hover:border-brown/50 hover:bg-gray-50"
                            }`}
                            onClick={() => handleViewPropertyDetails(property)}
                          >
                            {/* Loading overlay */}
                            {isLoadingPropertyDetails && (
                              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                                <KeyTurnLoader message="Loading details..." />
                              </div>
                            )}
                            {/* Property Image */}
                            <CardImageContainer
                              imageUrl={property.imageUrl}
                              alt={property.address || "Property image"}
                              height="sm"
                              imageVariant="professional"
                            />

                            <div className="p-3">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  {/* Address */}
                                  <h3 className="text-responsive-sm font-medium text-black line-clamp-2 mb-1">
                                    {typeof property.address === "string" ||
                                    typeof property.address === "number"
                                      ? property.address
                                      : "[Invalid address]"}
                                  </h3>

                                  {/* Price and Match Score */}
                                  <div className="flex justify-left">
                                    <p className="text-responsive-sm font-semibold text-brown flex-1">
                                      {typeof property.price === "string" ||
                                      typeof property.price === "number"
                                        ? property.price
                                        : "[Invalid price]"}
                                    </p>
                                    <CardMatchScore
                                      score={calculatePropertyScore(property)}
                                      size="xs"
                                      useColorStyling={true}
                                      className="ml-2"
                                    />
                                  </div>

                                  {/* Property Details */}
                                  <CardPropertyDetails
                                    bedrooms={property.bedrooms}
                                    bathrooms={property.bathrooms}
                                    sqft={property.sqft}
                                    lotSize={property.lotSize}
                                    variant="horizontal"
                                    className="mb-2 sm:mb-3"
                                  />
                                </div>
                                <CardHeartSave
                                  property={property}
                                  isSaved={isHomeSaved(property.id)}
                                  onSave={saveHome}
                                  onRemove={removeSavedHome}
                                  size="sm"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="mobile-icon-lg mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">
                        Click on the map to search for properties
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // Saved Homes Tab
                <div className="h-full">
                  {savedHomes.length > 0 ? (
                    <div className="h-full overflow-y-auto scrollbar-hide space-y-3 pr-2">
                      {savedHomes.map((property) => (
                        <div
                          key={property.id}
                          className={`border rounded-lg cursor-pointer transition-all overflow-hidden relative ${
                            selectedProperty?.id === property.id
                              ? "border-brown bg-brown/5"
                              : "border-gray-200 hover:border-brown/50 hover:bg-gray-50"
                          }`}
                          onClick={() => handleViewPropertyDetails(property)}
                        >
                          {/* Loading overlay */}
                          {isLoadingPropertyDetails && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                              <KeyTurnLoader message="Loading details..." />
                            </div>
                          )}
                          {/* Property Image */}
                          <CardImageContainer
                            imageUrl={property.imageUrl}
                            alt={property.address || "Property image"}
                            height="responsive"
                            imageVariant="professional"
                            className="rounded-t-lg"
                          />

                          <div className="space-responsive-xs">
                            <div className="flex items-start justify-between gap-responsive-sm mb-2">
                              <div className="flex-1">
                                {/* Property Type and Status */}
                                <div className="flex items-center gap-2 mb-1">
                                  {typeof property.propertyType === "string" &&
                                    property.propertyType.toLowerCase() !==
                                      "single_family" && (
                                      <span className="text-responsive-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                        {property.propertyType}
                                      </span>
                                    )}
                                </div>

                                {/* Address */}
                                <h3 className="text-responsive-sm font-medium text-black line-clamp-2 mb-1">
                                  {typeof property.address === "string" ||
                                  typeof property.address === "number"
                                    ? property.address
                                    : "[Invalid address]"}
                                </h3>

                                {/* Price */}
                                <div className="mb-2">
                                  <p className="text-responsive-lg font-semibold text-brown">
                                    {typeof property.price === "string" ||
                                    typeof property.price === "number"
                                      ? property.price
                                      : "[Invalid price]"}
                                  </p>
                                </div>

                                {/* Property Details */}
                                <CardPropertyDetails
                                  bedrooms={property.bedrooms}
                                  bathrooms={property.bathrooms}
                                  sqft={property.sqft}
                                  lotSize={property.lotSize}
                                  variant="horizontal"
                                  className="mb-2 sm:mb-3"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Bookmark className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No saved homes yet</p>
                      <p className="text-xs mt-1">
                        Click the heart icon to save properties
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Search Header */}
          <div className="hidden lg:block">
            <SearchHeader
              onUpdatePreferences={() => navigate("/dashboard/personalization")}
              onSearchProperties={async () => {
                try {
                  setIsSearching(true);
                  await fetchIsochronePolygon();
                } catch (error) {
                  console.error("Search failed:", error);
                } finally {
                  setIsSearching(false);
                }
              }}
              isSearching={isSearching}
            />
          </div>

          {/* Desktop Map - Takes remaining height */}
          <div className="flex-1 relative bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Loading overlay - shows until at least one property is available on map */}
            {(isSearching ||
              (hasSearched &&
                searchResults.length === 0 &&
                savedHomes.length === 0) ||
              (!hasSearched &&
                searchResults.length === 0 &&
                savedHomes.length === 0)) && (
              <div className="absolute inset-0 z-20 w-full h-full rounded-lg flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                  <KeyTurnLoader
                    message={
                      isSearching
                        ? searchStage || "Searching properties..."
                        : "Loading map..."
                    }
                  />
                </div>
              </div>
            )}

            {/* Map container - always present in DOM */}
            <div className="w-full h-full relative">
              <div
                ref={desktopMapRef}
                className="w-full h-full rounded-lg"
                style={{ minHeight: "400px" }}
              />

              {/* Desktop Map Controls - hidden during search */}
              {!isSearching && (
                <>
                  {/* Custom Zoom Controls */}
                  <div className="absolute bottom-12 left-8 flex flex-row gap-1 z-10">
                    <button
                      onClick={mapZoomIn}
                      className="w-8 h-8 lg:w-10 lg:h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 cursor-zoom"
                      title="Zoom in"
                    >
                      <span className="text-sm lg:text-lg font-bold leading-none">
                        +
                      </span>
                    </button>
                    <button
                      onClick={mapZoomOut}
                      className="w-8 h-8 lg:w-10 lg:h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 cursor-zoom"
                      title="Zoom out"
                    >
                      <span className="text-sm lg:text-lg font-bold leading-none">
                        −
                      </span>
                    </button>
                  </div>

                  {/* Property Navigation Controls */}
                  {hasSearched &&
                    (activeTab === "results"
                      ? searchResults.length > PROPERTIES_PER_PAGE
                      : savedHomes.length > PROPERTIES_PER_PAGE) && (
                      <div className="absolute bottom-12 right-8 flex flex-row gap-1 z-10">
                        <button
                          onClick={() =>
                            setCurrentPage(Math.max(0, currentPage - 1))
                          }
                          disabled={currentPage === 0}
                          className="w-8 h-8 lg:w-10 lg:h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-700 disabled:hover:border-gray-300 cursor-pointer"
                          title="Previous properties"
                        >
                          <ChevronLeft className="w-3 h-3 lg:w-4 lg:h-4" />
                        </button>
                        <div className="w-auto px-2 lg:px-3 h-8 lg:h-10 bg-white border border-gray-300 rounded-lg shadow-md flex items-center justify-center text-xs lg:text-sm font-medium text-gray-700">
                          {Math.min(
                            (currentPage + 1) * PROPERTIES_PER_PAGE,
                            activeTab === "results"
                              ? searchResults.length
                              : savedHomes.length,
                          )}{" "}
                          of{" "}
                          {activeTab === "results"
                            ? searchResults.length
                            : savedHomes.length}
                        </div>
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={
                            (currentPage + 1) * PROPERTIES_PER_PAGE >=
                            (activeTab === "results"
                              ? searchResults.length
                              : savedHomes.length)
                          }
                          className="w-8 h-8 lg:w-10 lg:h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-700 disabled:hover:border-gray-300 cursor-pointer"
                          title="Next properties"
                        >
                          <ChevronRight className="w-3 h-3 lg:w-4 lg:h-4" />
                        </button>
                      </div>
                    )}
                </>
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
