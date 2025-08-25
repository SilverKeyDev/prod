import { useState, useEffect, useRef } from "react";
import { Bookmark, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { favoriteHomesApi } from "../../lib/api";
import HeartSave from "../../components/ui/HeartSave";
import PropertyDetailsModal from "../../components/modals/PropertyDetailsModal";
import { searchZillowByPolygon, LatLng } from "../../lib/searchApi";
import { usePropertyDetails } from "../../hooks/usePropertyDetails";
import KeyTurnLoader from "../../components/ui/KeyTurnLoader";
import { checkAuthAndRedirect, getAuthToken } from "../../utils/authUtils";
import { useGoogleMaps } from "../../context/GoogleMapsContext";

interface SearchResult {
  id: string;
  address: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lat: number;
  lng: number;
  lotSize?: string;
  propertyType?: string;
  listingStatus?: string;
  imageUrl?: string;
  _score?: number; // Backend ML match score (0-100 integer)

  // Enhanced property details from searchAddress API
  zpid?: number;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  yearBuilt?: number;
  livingArea?: string;
  livingAreaValue?: number;
  pricePerSquareFoot?: number;
  propertyTypeDimension?: string;
  homeType?: string;
  homeStatus?: string;
  timeOnZillow?: string;
  daysOnZillow?: number;
  onMarketDate?: number;

  // Financial information
  zestimate?: number;
  taxAnnualAmount?: number;
  propertyTaxRate?: number;
  hoaFee?: string;
  associationFee?: string;
  monthlyHoaFee?: number;
  annualHomeownersInsurance?: number;
  rentZestimate?: number;

  // Property features
  architecturalStyle?: string;
  structureType?: string;
  propertyCondition?: string;
  isNewConstruction?: boolean;
  hasGarage?: boolean;
  hasAttachedGarage?: boolean;
  garageSpaces?: number;
  parking?: number;
  hasView?: boolean;
  waterView?: string;
  hasFireplace?: boolean;
  hasCooling?: boolean;
  hasHeating?: boolean;
  hasAssociation?: boolean;

  // Detailed features
  view?: string[];
  flooring?: string[];
  heating?: string[];
  cooling?: string[];
  appliances?: string[];
  interiorFeatures?: string[];
  exteriorFeatures?: any;
  lotFeatures?: string[];
  communityFeatures?: string[];
  parkingFeatures?: string[];
  utilities?: string[];
  inclusions?: string[];

  // Room information
  rooms?: any[];
  bathroomsFull?: number;
  bathroomsHalf?: number;
  bathroomsPartial?: number;
  bathroomsThreeQuarter?: number;
  mainLevelBedrooms?: number;
  mainLevelBathrooms?: number;

  // Building details
  stories?: string;
  roofType?: string;
  foundationDetails?: string[];
  constructionMaterials?: string[];
  windowFeatures?: string[];

  // Location details
  subdivision?: string;
  subdivisionName?: string;
  county?: string;
  cityId?: number;
  parcelNumber?: string;

  // Agent information
  contact_recipients?: any[];
  listed_by?: {
    agent_reason?: number;
    zpro?: boolean;
    recent_sales?: number;
    review_count?: number;
    display_name?: string;
    badge_type?: string;
    business_name?: string;
    rating_average?: number;
    phone?: {
      prefix?: string;
      areacode?: string;
      number?: string;
    };
    zuid?: string;
    image_url?: string;
  };

  // Schools
  schools?: Array<{
    name?: string;
    rating?: number;
    level?: string;
    grades?: string;
    type?: string;
    distance?: number;
    isAssigned?: boolean;
    studentsPerTeacher?: number;
    size?: number;
    link?: string;
  }>;

  // Price history
  priceHistory?: Array<{
    date?: string;
    price?: number;
    event?: string;
    priceChangeRate?: number;
    source?: string;
    pricePerSquareFoot?: number;
  }>;

  // Nearby homes
  nearbyHomes?: any[];

  // At a glance facts
  atAGlanceFacts?: Array<{
    factLabel?: string;
    factValue?: string;
  }>;

  // Additional details
  description?: string;
  url?: string;
  mlsid?: string;
  pageViewCount?: number;
  favoriteCount?: number;
  virtualTour?: string;
  buildingName?: string;

  // Mortgage rates
  mortgageRates?: {
    thirtyYearFixedRate?: number;
    fifteenYearFixedRate?: number;
    arm5Rate?: number;
  };
}

interface UserPreferences {
  priceRange: { min: number; max: number };
  preferredBedrooms: number;
  preferredSqft: { min: number; max: number };
  commuteLocation: string;
  lifestyle: string;
}

const userPreferences: UserPreferences = {
  priceRange: { min: 500000, max: 1000000 },
  preferredBedrooms: 3,
  preferredSqft: { min: 1500, max: 2500 },
  commuteLocation: "San Francisco",
  lifestyle: "Family",
};

export default function SearchPage() {
  const navigate = useNavigate();
  const { isLoaded: isGoogleMapsLoaded, createMap } = useGoogleMaps();
  // selectedLocation state removed - no longer needed without map click search

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
  const [, setIsochronePolygon] = useState<google.maps.Polygon | null>(null);
  const [isochroneData, setIsochroneData] = useState<any>(null);
  const [, setImportantLocationMarkers] = useState<
    google.maps.marker.AdvancedMarkerElement[]
  >([]);
  const [isUpdatingMarkers, setIsUpdatingMarkers] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showPropertyModals, setShowPropertyModals] = useState(false);
  const PROPERTIES_PER_PAGE = 3;

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
            prefError
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

  // Global function to open property modal from info window
  useEffect(() => {
    (window as any).openPropertyModal = (propertyId: string) => {
      const allProperties = [...searchResults, ...savedHomes];
      const property = allProperties.find((p) => p.id === propertyId);
      if (property) {
        handleViewPropertyDetails(property);
      }
    };

    // Cleanup function
    return () => {
      delete (window as any).openPropertyModal;
    };
  }, [searchResults, savedHomes]);
  const [activeTab, setActiveTab] = useState<"results" | "saved">(() => {
    // Load last active tab from localStorage, default to "results"
    const savedTab = localStorage.getItem("searchPageActiveTab");
    return savedTab === "results" || savedTab === "saved"
      ? savedTab
      : "results";
  });

  // Reset to first page when switching tabs and save to localStorage
  const handleTabChange = (tab: "results" | "saved") => {
    setActiveTab(tab);
    setCurrentPage(0);
    // Save the selected tab to localStorage
    localStorage.setItem("searchPageActiveTab", tab);
  };
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const individualPolygonsRef = useRef<google.maps.Polygon[]>([]);
  const importantMarkersRef = useRef<
    google.maps.marker.AdvancedMarkerElement[]
  >([]);

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
          prefError
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
        error
      );
    }
    return null;
  };

  // Get pin color based on property score (gradient from very dark faded green to very dark faded red)
  const getScoreBasedPinColor = (
    score: number
  ): { fillColor: string; strokeColor: string } => {
    const normalizedScore = Math.max(0, Math.min(100, score)) / 100;

    const highColor = { r: 123, g: 158, b: 124 }; // #7B9E7C
    const midColor = { r: 240, g: 233, b: 210 }; // #F0E9D2
    const lowColor = { r: 216, g: 140, b: 140 }; // #D88C8C

    let r: number, g: number, b: number;

    if (normalizedScore >= 0.5) {
      const t = (normalizedScore - 0.5) * 2;
      r = Math.round(midColor.r + (highColor.r - midColor.r) * t);
      g = Math.round(midColor.g + (highColor.g - midColor.g) * t);
      b = Math.round(midColor.b + (highColor.b - midColor.b) * t);
    } else {
      const t = normalizedScore * 2;
      r = Math.round(lowColor.r + (midColor.r - lowColor.r) * t);
      g = Math.round(lowColor.g + (midColor.g - lowColor.g) * t);
      b = Math.round(lowColor.b + (midColor.b - lowColor.b) * t);
    }

    const fillColor = `rgb(${r}, ${g}, ${b})`;
    const strokeColor = `rgb(${Math.round(r * 0.75)}, ${Math.round(
      g * 0.75
    )}, ${Math.round(b * 0.75)})`;

    return { fillColor, strokeColor };
  };

  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = () => {
      if (!mapRef.current || !isGoogleMapsLoaded) return;

      const map = createMap(mapRef.current);
      if (!map) {
        console.error("❌ Failed to create map");
        return;
      }

      googleMapRef.current = map;

      // ---------- Isochrone overlay logic (unchanged) ----------
      setTimeout(() => {
        const fetcher =
          searchResults.length > 0
            ? fetchIsochroneForMapOnly
            : fetchIsochronePolygon;
        fetcher()
          .then((data) => {
            if (data) {
              renderIsochronePolygon(data);
              renderImportantLocationMarkers(data);
            } else {
              console.warn(
                "⚠️ No isochrone data received, polygon will not be displayed"
              );
            }
          })
          .catch((error) => {
            console.error(
              "❌ Failed to fetch or render isochrone polygon:",
              error
            );
          });
      }, 100);
    };

    // Only initialize map after localStorage loading is complete and Google Maps is loaded
    if (isLocalStorageLoaded && isGoogleMapsLoaded) {
      initializeMap();
    }
  }, [isLocalStorageLoaded, isGoogleMapsLoaded, createMap]);

  // Handle property details search using the hook
  const handleViewPropertyDetails = async (property: SearchResult) => {
    await fetchPropertyDetails(property);
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
          currentData.map((p) => ({ id: p.id, address: p.address }))
        );
      }
    };

    // Cleanup function to remove global function when component unmounts
    return () => {
      delete (window as any).openPropertyModal;
    };
  }, [searchResults, savedHomes, activeTab, handleViewPropertyDetails]);

  // Update markers when activeTab changes or when hasSearched/showPropertyModals changes
  useEffect(() => {
    if (googleMapRef.current && hasSearched && showPropertyModals) {
      // Show only properties from the currently selected tab
      const currentData = activeTab === "results" ? searchResults : savedHomes;
      updateMapMarkers(currentData);
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
    searchResults.length, // Only depend on length to avoid re-renders on same data
    savedHomes.length,    // Only depend on length to avoid re-renders on same data
    showPropertyModals,
    hasSearched,
    currentPage,
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
          setIsochroneData(data.data);
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
          setIsochroneData(data.data);
          await searchPropertiesInIsochrone(data.data);

          return data.data;
        } else {
          console.warn(
            "⚠️ ISOCHRONE FAILED - API returned unsuccessful response:"
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
              JSON.stringify(errorJson, null, 2)
            );
          } catch (jsonError) {
            console.warn(
              "  📋 Error response is not JSON, showing as text above"
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
  const searchPropertiesInIsochrone = async (isochroneData: any) => {
    setIsSearching(true);
    setSearchStage("Locating homes in your area...");

    // Clear previous search results to show loading state in sidebar
    setSearchResults([]);

    if (!isochroneData?.isochrone?.geometry) {
      console.warn("❌ No isochrone geometry available for property search");
      setIsSearching(false);
      return;
    }

    try {
      // Convert isochrone polygon coordinates to LatLng format for search
      const geometry = isochroneData.isochrone.geometry;
      let searchPolygon: LatLng[] = [];

      if (geometry.type === "Polygon") {
        // Use the outer ring of the polygon
        const coordinates = geometry.coordinates[0];
        searchPolygon = coordinates.map((coord: [number, number]) => ({
          lon: coord[0],
          lat: coord[1],
        }));
      } else if (geometry.type === "MultiPolygon") {
        // Use the first polygon's outer ring
        const coordinates = geometry.coordinates[0][0];
        searchPolygon = coordinates.map((coord: [number, number]) => ({
          lon: coord[0],
          lat: coord[1],
        }));
      } else {
        console.warn("❌ Unsupported geometry type for search:", geometry.type);
        return;
      }

      // Map current userPreferences to the searchByCoords format
      // Include ALL important_locations from the isochrone data (not just center)
      const searchUserPreferences = {
        home_budget: userPreferences.priceRange.max,
        preferred_bedrooms: userPreferences.preferredBedrooms,
        preferred_bathrooms:
          Math.floor(userPreferences.preferredBedrooms / 2) + 1,
        preferred_housing_type: "single_family",
        preferred_home_age: "any",
        preferred_lot_size: "medium",
        preferred_home_features: [],
        deal_breakers: [],
        // Use ALL important_locations from the isochrone response, not just center
        important_locations: isochroneData.locations || [],
      };

      setSearchStage("Extracting property data...");

      // Call the Zillow search API with the isochrone polygon
      const searchResult = await searchZillowByPolygon({
        polygon: searchPolygon,
        user_preferences: searchUserPreferences,
        status_type: "ForSale",
        perBucketPages: 10,
        maxRetries: 3,
      });

      // Show evaluating scores stage for 10 seconds
      setSearchStage("Evaluating scores...");
      await new Promise((resolve) => setTimeout(resolve, 10000));

      setSearchStage("Scoring homes based on your preferences...");

      // Transform Zillow API results to SearchResult format
      const transformedResults: SearchResult[] = searchResult.properties.map(
        (property, index) => ({
          id: property.zpid || `${Date.now()}-${index}`,
          address: property.address || "Address not available",
          price: property.price
            ? `$${property.price.toLocaleString()}`
            : "Price not available",
          bedrooms: property.bedrooms || 0,
          bathrooms: property.bathrooms || 0,
          sqft: property.livingArea || 0,
          lat:
            property.latitude ||
            isochroneData.center.lat + (Math.random() - 0.5) * 0.01,
          lng:
            property.longitude ||
            isochroneData.center.lng + (Math.random() - 0.5) * 0.01,
          lotSize:
            property.lotAreaValue && property.lotAreaUnit
              ? `${property.lotAreaValue.toLocaleString()} ${
                  property.lotAreaUnit
                }`
              : undefined,
          propertyType: property.propertyType || "Single Family",
          listingStatus: property.listingStatus || "For Sale",
          imageUrl: property.imgSrc || "/default-home.jpg",
          _score: property._score || 0, // Backend ML match score (0-100 integer)
        })
      );

      setSearchStage("Extracting property images...");

      // Simulate image extraction delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      setSearchStage("Finalizing results...");

      // Update search results and mark as searched
      setSearchResults(transformedResults);

      // Save search results to localStorage with preferences version
      saveSearchResultsToLocalStorage(transformedResults).catch((error) => {
        console.error(
          "❌ Failed to save search results to localStorage:",
          error
        );
      });

      setHasSearched(true);
      setIsSearching(false);
      setCurrentPage(0); // Reset to first page when new search results come in
      setShowPropertyModals(true); // Enable property markers to be displayed on map
    } catch (error) {
      console.error("❌ Error in automatic isochrone property search:", error);
      console.error("❌ Error details:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        isochroneData: isochroneData,
      });
      setIsSearching(false);
      setSearchStage("");
    }
  };

  // Render isochrone polygon on the map
  const renderIsochronePolygon = (isochroneData: any) => {
    if (!googleMapRef.current) {
      console.warn("❌ Google Map not initialized yet");
      return;
    }

    if (!isochroneData?.isochrone?.geometry) {
      console.warn("❌ No isochrone geometry data available");
      return;
    }

    // Clear existing polygons
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
    }

    // Clear existing individual polygons
    if (individualPolygonsRef.current) {
      individualPolygonsRef.current.forEach((polygon: google.maps.Polygon) =>
        polygon.setMap(null)
      );
      individualPolygonsRef.current = [];
    }

    try {
      // First, render individual isochrones as gray outlines
      if (
        isochroneData.individual_isochrones &&
        Array.isArray(isochroneData.individual_isochrones)
      ) {
        isochroneData.individual_isochrones.forEach((individualData: any) => {
          const geometry = individualData.isochrone?.geometry;
          if (!geometry) return;

          let coordinates: number[][][] = [];

          if (geometry.type === "Polygon") {
            coordinates = geometry.coordinates;
          } else if (geometry.type === "MultiPolygon") {
            coordinates = geometry.coordinates[0];
          }

          if (coordinates.length > 0) {
            const paths = coordinates.map((ring: number[][]) => {
              return ring.map((coord: number[]) => ({
                lat: coord[1],
                lng: coord[0],
              }));
            });

            // Create individual polygon with gray styling
            const individualPolygon = new google.maps.Polygon({
              paths: paths,
              strokeColor: "#888888", // Gray color
              strokeOpacity: 0.6,
              strokeWeight: 1,
              fillColor: "transparent",
              fillOpacity: 0,
              clickable: false,
            });

            individualPolygon.setMap(googleMapRef.current);
            if (!individualPolygonsRef.current)
              individualPolygonsRef.current = [];
            individualPolygonsRef.current.push(individualPolygon);
          }
        });
      }

      // Now render the main union isochrone
      const geometry = isochroneData.isochrone.geometry;
      let coordinates: number[][][] = [];

      if (geometry.type === "Polygon") {
        coordinates = geometry.coordinates;
      } else if (geometry.type === "MultiPolygon") {
        // For MultiPolygon, take the first polygon
        coordinates = geometry.coordinates[0];
      } else {
        console.warn("❌ Unsupported geometry type:", geometry.type);
        return;
      }

      // Convert GeoJSON coordinates to Google Maps LatLng format
      // GeoJSON uses [longitude, latitude], Google Maps uses {lat, lng}
      const paths = coordinates.map((ring: number[][]) => {
        const convertedRing = ring.map((coord: number[]) => ({
          lat: coord[1], // latitude is second
          lng: coord[0], // longitude is first
        }));
        return convertedRing;
      });

      const polygon = new google.maps.Polygon({
        paths: paths,
        strokeColor: "#7B9E7C", // Match the app's green theme
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#7B9E7C",
        fillOpacity: 0.15,
        clickable: false,
      });

      polygon.setMap(googleMapRef.current);
      polygonRef.current = polygon;
      setIsochronePolygon(polygon);

      // Fit the map to include the polygon bounds
      const bounds = new google.maps.LatLngBounds();
      paths[0].forEach((point: { lat: number; lng: number }) => {
        bounds.extend(point);
      });

      googleMapRef.current.fitBounds(bounds);

      // Add some padding to the bounds
      setTimeout(() => {
        if (googleMapRef.current) {
          const currentZoom = googleMapRef.current.getZoom();
          if (currentZoom && currentZoom > 15) {
            googleMapRef.current.setZoom(15); // Max zoom for better visibility
          }
        }
      }, 100);
    } catch (error) {
      console.error("❌ Error rendering isochrone polygon:", error);
      console.error("❌ Error details:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        isochroneData: isochroneData,
      });
    }
  };

  // Render important location markers on the map (nubless, gapless bubbles)
  const renderImportantLocationMarkers = async (isochroneData: any) => {
    if (!googleMapRef.current || !isochroneData?.center) {
      console.warn(
        "❌ Cannot render important location markers: map or data not available"
      );
      return;
    }

    // Clear existing markers + bubbles
    importantMarkersRef.current.forEach((marker) => {
      (marker as any)._bubble?.setMap(null);
      marker.map = null;
    });
    importantMarkersRef.current = [];

    // Build list of important locations
    const importantLocations: Array<any> = [];
    if (isochroneData.center) {
      importantLocations.push({
        name: isochroneData.center.name || "Primary Location",
        address: isochroneData.center.address,
        lat: isochroneData.center.lat,
        lng: isochroneData.center.lng,
        commute_tolerance: isochroneData.commute_tolerance || 30,
      });
    }
    if (Array.isArray(isochroneData.locations)) {
      isochroneData.locations.forEach((loc: any) => {
        if (!loc?.address) return;
        const dup = importantLocations.some((e) => e.address === loc.address);
        if (!dup) {
          importantLocations.push({
            name: loc.name || "Important Location",
            address: loc.address,
            lat: loc.lat ?? null,
            lng: loc.lng ?? null,
            commute_tolerance: loc.commute_tolerance || 30,
          });
        }
      });
    }

    // Small, always-visible bubble overlay (no nub, zero-gap)
    class BubbleOverlay extends google.maps.OverlayView {
      private div: HTMLDivElement;
      private position: google.maps.LatLng | google.maps.LatLngLiteral;

      constructor(
        position: google.maps.LatLng | google.maps.LatLngLiteral,
        contentHTML: string
      ) {
        super();
        this.position = position;
        this.div = document.createElement("div");
        this.div.style.position = "absolute";
        this.div.style.zIndex = "1100"; // above property overlays (yours use 1000)
        // Place directly above the marker, no gap:
        // translateX(-50%) centers horizontally; -100% puts top edge at marker point;
        // extra -2px tucks it flush (tweak if your dot size changes)
        this.div.style.transform = "translate(-50%, calc(-100% - 2px))";
        this.div.style.pointerEvents = "auto";
        // Safely set content using textContent to prevent XSS
        this.div.textContent = '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = contentHTML;
        // Only append if content is safe (basic validation)
        if (tempDiv.textContent || tempDiv.innerText) {
          this.div.appendChild(tempDiv);
        }
      }

      onAdd() {
        const panes = this.getPanes();
        panes?.overlayMouseTarget.appendChild(this.div);
      }

      draw() {
        const projection = this.getProjection();
        if (!projection) return;
        const pt = projection.fromLatLngToDivPixel(
          this.position instanceof google.maps.LatLng
            ? this.position
            : new google.maps.LatLng(this.position)
        );
        if (!pt) return;
        this.div.style.left = `${pt.x}px`;
        this.div.style.top = `${pt.y}px`;
      }

      onRemove() {
        this.div.remove();
      }
    }

    // Check if Google Maps API and AdvancedMarkerElement are available
    if (!window.google || !window.google.maps || !window.google.maps.marker) {
      console.warn(
        "⚠️ Google Maps API or AdvancedMarkerElement not available yet for important locations"
      );
      return;
    }

    const { AdvancedMarkerElement } = window.google.maps.marker;
    const markers: google.maps.marker.AdvancedMarkerElement[] = [];
    const geocoder = new google.maps.Geocoder();

    for (let i = 0; i < importantLocations.length; i++) {
      const loc = importantLocations[i];
      const name = loc.name ?? "Important Location";
      const address = loc.address;

      if (!address) {
        console.warn("⚠️ Skipping location without address:", name);
        continue;
      }

      // Resolve coordinates
      let position: google.maps.LatLng | google.maps.LatLngLiteral | null =
        null;
      if (typeof loc.lat === "number" && typeof loc.lng === "number") {
        position = { lat: loc.lat, lng: loc.lng };
      } else {
        const geocode = await geocoder.geocode({ address });
        if (geocode.results?.length) {
          position = geocode.results[0].geometry.location;
        }
      }
      if (!position) {
        console.warn(
          `⚠️ Could not resolve coordinates for ${name}: ${address}`
        );
        continue;
      }

      const isFirst = i === 0;

      // Create custom marker element for AdvancedMarkerElement
      const markerElement = document.createElement("div");
      markerElement.style.cssText = `
        width: ${isFirst ? 12 : 8}px;
        height: ${isFirst ? 12 : 8}px;
        background-color: ${isFirst ? "#7B9E7C" : "#E8A87C"};
        border: 1px solid #ffffff;
        border-radius: 50%;
        opacity: 0.9;
      `;

      const marker = new AdvancedMarkerElement({
        position,
        map: googleMapRef.current!,
        title: `${name}${isFirst ? " (Commute Center)" : ""}`,
        content: markerElement,
      });

      const commuteTime =
        loc.commute_tolerance ?? isochroneData.commute_tolerance ?? 30;
      const bubbleHTML = `
      <div style="
        padding: 3px 6px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(158, 131, 113, 0.3);
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        min-width: 60px; max-width: 90px;
        text-align: center; font-size: 10px; line-height: 1.2;
      ">
        <div style="
          color: #4A3228; font-size: 10px; font-weight: 600;
          margin-bottom: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        ">${name}</div>
        <div style="color: #8B7355; font-size: 9px; font-weight: 500;">
          ${commuteTime} min
        </div>
      </div>
    `;

      const bubble = new BubbleOverlay(
        position instanceof google.maps.LatLng
          ? position
          : new google.maps.LatLng(position),
        bubbleHTML
      );
      bubble.setMap(googleMapRef.current!);

      (marker as any)._bubble = bubble;
      markers.push(marker);
    }

    importantMarkersRef.current = markers;
    setImportantLocationMarkers(markers);
  };

  // Load saved homes from user's favorite_home_ids on component mount
  useEffect(() => {
    const loadSavedHomes = async () => {
      try {
        // Check auth and redirect if no token found
        if (!checkAuthAndRedirect(navigate)) {
          return;
        }

        // Step 2: Call the centralized favoriteHomesApi
        const favoritesData = await favoriteHomesApi.getFavorites();

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
                      `⚠️ Google Maps API not loaded yet, skipping geocoding for ${home.address}`
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
                        `⚠️ Could not geocode ${home.address}, using fallback coordinates`
                      );
                      lat = 33.749; // Atlanta fallback
                      lng = -84.388;
                    }
                  }
                } catch (error) {
                  console.error(
                    `❌ Geocoding error for ${home.address}:`,
                    error
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
            })
          );

          // Extract addresses for favoriteAddresses state (for compatibility)
          const favoriteAddresses = rawHomes
            .map((home: any) => home.address)
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

  // Adaptive zoom function to fit all housing markers
  const fitMapToMarkers = (properties: SearchResult[]) => {
    if (!googleMapRef.current || properties.length === 0) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();

    // Add all property locations to bounds
    properties.forEach((property) => {
      bounds.extend(new google.maps.LatLng(property.lat, property.lng));
    });

    googleMapRef.current.fitBounds(bounds, {
      top: 50,
      right: 50,
      bottom: 50,
      left: 320, // Extra padding for sidebar
    });
    // Set reasonable zoom limits
    const listener = google.maps.event.addListener(
      googleMapRef.current,
      "bounds_changed",
      () => {
        const currentZoom = googleMapRef.current!.getZoom();

        if (currentZoom && currentZoom > 16) {
          googleMapRef.current!.setZoom(16); // Max zoom for readability
        } else if (currentZoom && currentZoom < 10) {
          googleMapRef.current!.setZoom(10); // Min zoom to avoid being too far out
        }
        google.maps.event.removeListener(listener);
      }
    );
  };

  // Update map markers
  const updateMapMarkers = async (results: SearchResult[]) => {
    if (!googleMapRef.current) return;

    // Prevent duplicate processing using proper state
    if (isUpdatingMarkers) {
      return;
    }
    setIsUpdatingMarkers(true);

    // Clear existing HOME markers and overlays (but preserve important location markers)
    markersRef.current.forEach((marker) => {
      marker.map = null;
      // Also remove the overlay if it exists
      if ((marker as any).overlay) {
        (marker as any).overlay.setMap(null);
      }
    });
    markersRef.current = [];

    // Re-render important location markers FIRST (so they appear behind home markers)
    // Use cached isochrone data if available, otherwise fetch it
    if (isochroneData) {
      await renderImportantLocationMarkers(isochroneData);
    } else {
      const data = await fetchIsochroneForMapOnly();
      if (data) {
        setIsochroneData(data);
        await renderImportantLocationMarkers(data);
      }
    }

    // Paginate the results - only show PROPERTIES_PER_PAGE at a time
    const startIndex = currentPage * PROPERTIES_PER_PAGE;
    const endIndex = startIndex + PROPERTIES_PER_PAGE;
    const paginatedData = results.slice(startIndex, endIndex);
    const currentData = paginatedData;

    const BASE_PIN_PATH =
      "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z";

    // Check if Google Maps API and AdvancedMarkerElement are available
    if (!window.google || !window.google.maps || !window.google.maps.marker) {
      console.warn(
        "⚠️ Google Maps API or AdvancedMarkerElement not available yet"
      );
      return;
    }

    const { AdvancedMarkerElement } = window.google.maps.marker;

    currentData.forEach((result) => {
      // Use backend ML match score directly
      const score = calculatePropertyScore(result);
      const { fillColor, strokeColor } = getScoreBasedPinColor(score);
      const isSaved = isHomeSaved(result.id);

      // Create custom marker element for AdvancedMarkerElement
      const markerElement = document.createElement("div");
      markerElement.style.cssText = `
        width: 24px;
        height: 32px;
        cursor: pointer;
      `;
      
      // Create SVG element safely without innerHTML
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "24");
      svg.setAttribute("height", "32");
      svg.setAttribute("viewBox", "0 0 24 32");
      
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", BASE_PIN_PATH);
      path.setAttribute("fill", fillColor);
      path.setAttribute("stroke", strokeColor);
      path.setAttribute("stroke-width", "1.75");
      path.setAttribute("stroke-opacity", "0.9");
      path.setAttribute("fill-opacity", "0.9");
      
      svg.appendChild(path);
      markerElement.appendChild(svg);

      // Create the marker
      const marker = new AdvancedMarkerElement({
        map: googleMapRef.current,
        position: { lat: result.lat, lng: result.lng },
        title: result.address,
        content: markerElement,
      });

      // Create always-visible property overlay
      const overlayDiv = document.createElement("div");
      overlayDiv.style.cssText = `
        position: absolute;
        padding: 6px;
        width: 140px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.2;
        background-color: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(4px);
        border-radius: 6px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.2);
        border: 1px solid rgba(0,0,0,0.1);
        transform: translate(-50%, -100%);
        margin-top: -8px;
        z-index: 1000;
        pointer-events: auto;
      `;

      // Conditionally include match score section only for non-saved homes
      const matchScoreSection = isSaved
        ? ""
        : `
        <div style="
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        ">
          <div style="
            background: ${fillColor};
            color: ${strokeColor};
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
          ">${score}/100</div>
          <div style="
            font-size: 9px;
            color: #6b7280;
          ">Match Score</div>
        </div>`;

      // Create overlay content safely using DOM methods
      overlayDiv.innerHTML = `
        <style>
          .gm-style-cc { display: none !important; }
          .gm-style .gm-style-cc { display: none !important; }
          .gm-style-mtc { display: none !important; }
          .gmnoprint { display: none !important; }
          .gm-bundled-control { display: none !important; }
          .gm-fullscreen-control { display: none !important; }
          .gm-svpc { display: none !important; }
          [title="View on Google Maps"] { display: none !important; }
          a[href*="maps.google.com"] { display: none !important; }
          .gm-style .gm-style-iw-tc::after { display: none !important; }
        </style>
        <img src="${
          result.imageUrl || "/default-home.jpg"
        }" alt="Property" style="
          width: 100%;
          height: 60px;
          object-fit: cover;
          border-radius: 4px;
          margin-bottom: 6px;
        " onerror="this.src='/default-home.jpg'" />
        <div style="
          font-size: 11px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
          line-height: 1.3;
        ">${result.address}</div>
        <div style="
          font-size: 13px;
          font-weight: 700;
          color: #A47551;
          margin-bottom: 6px;
        ">${result.price}</div>
        ${matchScoreSection}
        <button 
          onclick="
            // Show loading state
            this.style.cursor = 'not-allowed';
            this.style.opacity = '0.8';
            this.disabled = true;
            
            // Add keyframe animation if not already added
            if (!document.getElementById('mapModalKeyframes')) {
              const style = document.createElement('style');
              style.id = 'mapModalKeyframes';
              style.textContent = '@keyframes turnKey { 0% { transform: rotate(0deg); } 25% { transform: rotate(20deg); } 50% { transform: rotate(0deg); } 75% { transform: rotate(-20deg); } 100% { transform: rotate(0deg); } }';
              document.head.appendChild(style);
            }
            
            window.openPropertyModal('${result.id}');
          "
          style="
            width: 100%;
            background: #A47551;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          "
          onmouseover="if (!this.disabled) this.style.background='#8b5a3c'"
          onmouseout="if (!this.disabled) this.style.background='#A47551'"
        >
          View Details
        </button>
      `;

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
        overlayDiv
      );
      overlay.setMap(googleMapRef.current);

      // Store overlay reference for cleanup
      (marker as any).overlay = overlay;
      markersRef.current.push(marker);
    });

    // Fit map to show all housing markers with adaptive zoom
    if (results.length > 0) {
      fitMapToMarkers(results);
    }

    // Reset processing flag
    setIsUpdatingMarkers(false);
  };
  const saveHome = async (property: SearchResult) => {
    try {
      // Call backend API to add favorite
      const response = await favoriteHomesApi.addFavorite(property);
      if (response.success) {
        // Update local state
        const isAlreadySaved = savedHomes.find(
          (home) => home.id === property.id
        );

        if (!isAlreadySaved) {
          setSavedHomes((prev) => {
            const newSavedHomes = [...prev, property];
            return newSavedHomes;
          });
        } 

        // Update favorite addresses from backend response
        if (response.data?.favorites) {
          setFavoriteAddresses(response.data.favorites);
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
          propertyId
        );
        console.error("🗑️ ===== HOME UNSAVE OPERATION FAILED (FRONTEND) =====");
        return;
      }
      
      const response = await favoriteHomesApi.removeFavorite(property.address);

      if (response.success) {
        // Update local state
        setSavedHomes((prev) => {
          const newSavedHomes = prev.filter((home) => home.id !== propertyId);
          return newSavedHomes;
        });

        // Update favorite addresses from backend response
        if (response.data?.favorites) {
          setFavoriteAddresses(response.data.favorites);
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

  // Zoom functions
  const zoomIn = () => {
    if (googleMapRef.current) {
      const currentZoom = googleMapRef.current.getZoom() || 12;
      const newZoom = currentZoom + 1;
      googleMapRef.current.setZoom(newZoom);
    }
  };

  const zoomOut = () => {
    if (googleMapRef.current) {
      const currentZoom = googleMapRef.current.getZoom() || 12;
      const newZoom = currentZoom - 1;
      googleMapRef.current.setZoom(newZoom);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col h-[calc(100vh-80px)]">
        {/* Mobile Header - Small and Compact */}
        <div className="flex-shrink-0 p-3 bg-white border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/dashboard/personalization")}
              className="flex-1 px-3 py-2 text-xs font-medium text-brown border border-brown rounded-lg hover:bg-brown hover:text-white transition-colors touch-friendly"
            >
              Edit Preferences
            </button>
            <button
              onClick={async () => {
                try {
                  setIsSearching(true);
                  await fetchIsochronePolygon();
                } catch (error) {
                  console.error("Search failed:", error);
                } finally {
                  setIsSearching(false);
                }
              }}
              disabled={isSearching}
              className="flex-1 px-3 py-2 text-xs font-medium text-white bg-brown rounded-lg hover:bg-brown-dark transition-colors touch-friendly disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? "Searching..." : "Search Properties"}
            </button>
          </div>
        </div>

        {/* Mobile Carousel for Properties */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                handleTabChange("results");
                if (hasSearched && searchResults.length > 0) {
                  setShowPropertyModals(true);
                }
              }}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "results"
                  ? "border-brown text-brown"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Search
              {searchResults.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-olive-light text-gray-800 text-xs rounded-full">
                  {searchResults.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                handleTabChange("saved");
                if (savedHomes.length > 0) {
                  setShowPropertyModals(true);
                  setHasSearched(true);
                }
              }}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "saved"
                  ? "border-brown text-brown"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Saved
              {savedHomes.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-olive-light text-gray-800 text-xs rounded-full">
                  {savedHomes.length}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Property Carousel */}
          <div className="p-2 sm:p-3">
            {activeTab === "results" ? (
              searchResults.length > 0 ? (
                <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-2" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                  {searchResults.slice(currentPage * PROPERTIES_PER_PAGE, (currentPage + 1) * PROPERTIES_PER_PAGE).map((property) => (
                    <div
                      key={property.id}
                      className="flex-shrink-0 w-56 sm:w-64 border rounded-lg cursor-pointer transition-all overflow-hidden bg-white hover:shadow-md active:scale-95 touch-manipulation"
                      onClick={() => handleViewPropertyDetails(property)}
                    >
                      {property.imageUrl && (
                        <div className="w-full h-28 sm:h-32 bg-gray-200 overflow-hidden rounded-t-lg">
                          <img
                            src={property.imageUrl}
                            alt={property.address}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/default-home.jpg";
                            }}
                          />
                        </div>
                      )}
                      <div className="p-2 sm:p-3">
                        <h3 className="text-xs sm:text-sm font-medium text-black line-clamp-2 mb-1 leading-tight">
                          {typeof property.address === "string" || typeof property.address === "number"
                            ? property.address
                            : "[Invalid address]"}
                        </h3>
                        <p className="text-base sm:text-lg font-semibold text-brown mb-1 sm:mb-2">
                          {typeof property.price === "string" || typeof property.price === "number"
                            ? property.price
                            : "[Invalid price]"}
                        </p>
                        <div className="grid grid-cols-3 gap-1 sm:gap-2 text-xs text-gray-600">
                          <div className="text-center">{property.bedrooms} beds</div>
                          <div className="text-center">{property.bathrooms} baths</div>
                          <div className="text-center">{property.sqft.toLocaleString()} sqft</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-gray-500 px-4">
                  <p className="text-sm sm:text-base">No search results yet.</p>
                  <p className="text-xs sm:text-sm mt-1">Tap "Search Properties" to find homes.</p>
                </div>
              )
            ) : (
              savedHomes.length > 0 ? (
                <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-2" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                  {savedHomes.slice(currentPage * PROPERTIES_PER_PAGE, (currentPage + 1) * PROPERTIES_PER_PAGE).map((property) => (
                    <div
                      key={property.id}
                      className="flex-shrink-0 w-56 sm:w-64 border rounded-lg cursor-pointer transition-all overflow-hidden bg-white hover:shadow-md active:scale-95 touch-manipulation"
                      onClick={() => handleViewPropertyDetails(property)}
                    >
                      {property.imageUrl && (
                        <div className="w-full h-28 sm:h-32 bg-gray-200 overflow-hidden rounded-t-lg">
                          <img
                            src={property.imageUrl}
                            alt={property.address}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/default-home.jpg";
                            }}
                          />
                        </div>
                      )}
                      <div className="p-2 sm:p-3">
                        <h3 className="text-xs sm:text-sm font-medium text-black line-clamp-2 mb-1 leading-tight">
                          {typeof property.address === "string" || typeof property.address === "number"
                            ? property.address
                            : "[Invalid address]"}
                        </h3>
                        <p className="text-base sm:text-lg font-semibold text-brown mb-1 sm:mb-2">
                          {typeof property.price === "string" || typeof property.price === "number"
                            ? property.price
                            : "[Invalid price]"}
                        </p>
                        <div className="grid grid-cols-3 gap-1 sm:gap-2 text-xs text-gray-600">
                          <div className="text-center">{property.bedrooms} beds</div>
                          <div className="text-center">{property.bathrooms} baths</div>
                          <div className="text-center">{property.sqft.toLocaleString()} sqft</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-gray-500 px-4">
                  <p className="text-sm sm:text-base">No saved homes yet.</p>
                  <p className="text-xs sm:text-sm mt-1">Save homes from search results.</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Mobile Map - Takes majority of screen */}
        <div className="flex-1 relative">
          {/* Loading overlay */}
          {(isSearching ||
            (hasSearched &&
              searchResults.length === 0 &&
              savedHomes.length === 0) ||
            (!hasSearched &&
              searchResults.length === 0 &&
              savedHomes.length === 0)) && (
            <div className="absolute inset-0 z-20 w-full h-full flex items-center justify-center bg-gray-50">
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

          {/* Map container */}
          <div className="w-full h-full relative">
            <div
              ref={mapRef}
              className="w-full h-full"
              style={{ minHeight: "100%" }}
            />

            {/* Mobile Zoom Controls */}
            {!isSearching && (
              <div className="absolute bottom-4 left-4 flex flex-col gap-1 z-10">
                <button
                  onClick={zoomIn}
                  className="w-12 h-12 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 touch-friendly"
                  title="Zoom in"
                >
                  <span className="text-xl font-bold leading-none">+</span>
                </button>
                <button
                  onClick={zoomOut}
                  className="w-12 h-12 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 touch-friendly"
                  title="Zoom out"
                >
                  <span className="text-xl font-bold leading-none">−</span>
                </button>
              </div>
            )}

            {/* Mobile Pagination Controls */}
            {!isSearching &&
              hasSearched &&
              (activeTab === "results"
                ? searchResults.length > PROPERTIES_PER_PAGE
                : savedHomes.length > PROPERTIES_PER_PAGE) && (
                <div className="absolute bottom-4 right-4 flex flex-row gap-1 z-10">
                  <button
                    onClick={() =>
                      setCurrentPage(Math.max(0, currentPage - 1))
                    }
                    disabled={currentPage === 0}
                    className="w-12 h-12 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 disabled:opacity-50 disabled:cursor-not-allowed touch-friendly"
                    title="Previous properties"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={
                      (currentPage + 1) * PROPERTIES_PER_PAGE >=
                      (activeTab === "results"
                        ? searchResults.length
                        : savedHomes.length)
                    }
                    className="w-12 h-12 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 disabled:opacity-50 disabled:cursor-not-allowed touch-friendly"
                    title="Next properties"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex gap-4 h-[calc(100vh-160px)]">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 flex flex-col">
          <div
            className="mobile-card flex flex-col"
            style={{ height: "calc(100vh - 160px)" }}
          >
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
                Search
                {searchResults.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-olive-light text-gray-800 text-xs rounded-full">
                    {searchResults.length}
                  </span>
                )}
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
                Saved
                {savedHomes.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-olive-light text-gray-800 text-xs rounded-full">
                    {savedHomes.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tab Content - Scrollable */}
            <div className="flex-1 overflow-hidden">
              {activeTab === "results" ? (
                // Search Results Tab
                <div className="h-full">
                  {searchResults.length > 0 ? (
                    <div className="h-full flex flex-col">
                      {/* Pagination Info */}
                      {searchResults.length > PROPERTIES_PER_PAGE && (
                        <div className="text-xs text-gray-600 mb-3 px-1 flex-shrink-0">
                          Showing {currentPage * PROPERTIES_PER_PAGE + 1}-
                          {Math.min(
                            (currentPage + 1) * PROPERTIES_PER_PAGE,
                            searchResults.length
                          )}{" "}
                          of {searchResults.length} properties on map
                        </div>
                      )}
                      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3 pr-2">
                        {searchResults.map((property) => (
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
                                <KeyTurnLoader />
                              </div>
                            )}
                            {/* Property Image */}
                            {property.imageUrl && (
                              <div className="w-full h-32 bg-gray-200 overflow-hidden">
                                <img
                                  src={property.imageUrl}
                                  alt={property.address}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "/default-home.jpg";
                                  }}
                                />
                              </div>
                            )}

                            <div className="p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  {/* Property Type and Status */}
                                  <div className="flex items-center gap-2 mb-1">
                                    {property.propertyType &&
                                      property.propertyType.toLowerCase() !==
                                        "single_family" && (
                                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                          {property.propertyType}
                                        </span>
                                      )}
                                    {typeof property.listingStatus ===
                                      "string" &&
                                      property.listingStatus.toLowerCase() !==
                                        "for_sale" && (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                          {property.listingStatus}
                                        </span>
                                      )}
                                  </div>

                                  {/* Address */}
                                  <h3 className="text-sm font-medium text-black line-clamp-2 mb-1">
                                    {typeof property.address === "string" ||
                                    typeof property.address === "number"
                                      ? property.address
                                      : "[Invalid address]"}
                                  </h3>

                                  {/* Price */}
                                  <p className="text-lg font-semibold text-brown mb-2">
                                    {typeof property.price === "string" ||
                                    typeof property.price === "number"
                                      ? property.price
                                      : "[Invalid price]"}
                                  </p>

                                  {/* Property Details */}
                                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mb-1">
                                    <div>{property.bedrooms} beds</div>
                                    <div>{property.bathrooms} baths</div>
                                    <div>
                                      {property.sqft.toLocaleString()} sqft
                                    </div>
                                  </div>

                                  {/* Match Score */}
                                  {(() => {
                                    const score =
                                      calculatePropertyScore(property);
                                    const { fillColor, strokeColor } =
                                      getScoreBasedPinColor(score);
                                    return (
                                      <div className="flex items-center gap-2 mb-1">
                                        <div
                                          className="px-2 py-1 rounded text-xs font-semibold"
                                          style={{
                                            backgroundColor: fillColor,
                                            color: strokeColor,
                                          }}
                                        >
                                          {score}/100
                                        </div>
                                        <span className="text-xs text-gray-500">
                                          Match Score
                                        </span>
                                      </div>
                                    );
                                  })()}

                                  {/* Lot Size */}
                                  {typeof property.lotSize === "string" &&
                                    property.lotSize && (
                                      <div className="text-xs text-gray-500">
                                        Lot: {property.lotSize}
                                      </div>
                                    )}
                                </div>
                                <HeartSave
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
                      <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
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
                              <KeyTurnLoader />
                            </div>
                          )}
                          {/* Property Image */}
                          {property.imageUrl && (
                            <div className="w-full h-32 bg-gray-200 overflow-hidden">
                              <img
                                src={property.imageUrl}
                                alt={property.address}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "/default-home.jpg";
                                }}
                              />
                            </div>
                          )}

                          <div className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                {/* Property Type and Status */}
                                <div className="flex items-center gap-2 mb-1">
                                  {typeof property.propertyType === "string" &&
                                    property.propertyType.toLowerCase() !==
                                      "single_family" && (
                                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                        {property.propertyType}
                                      </span>
                                    )}
                                </div>

                                {/* Address */}
                                <h3 className="text-sm font-medium text-black line-clamp-2 mb-1">
                                  {typeof property.address === "string" ||
                                  typeof property.address === "number"
                                    ? property.address
                                    : "[Invalid address]"}
                                </h3>

                                {/* Price */}
                                <p className="text-lg font-semibold text-brown mb-2">
                                  {typeof property.price === "string" ||
                                  typeof property.price === "number"
                                    ? property.price
                                    : "[Invalid price]"}
                                </p>

                                {/* Property Details */}
                                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mb-1">
                                  <div>{property.bedrooms} beds</div>
                                  <div>{property.bathrooms} baths</div>
                                  {property.sqft > 0 && (
                                    <div>
                                      {property.sqft.toLocaleString()} sqft
                                    </div>
                                  )}
                                </div>
                              </div>
                              <HeartSave
                                property={property}
                                isSaved={true}
                                onSave={saveHome}
                                onRemove={removeSavedHome}
                                size="sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Bookmark className="w-8 h-8 mx-auto mb-2 text-gray-300" />
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
          {/* Search Instructions and Controls */}
          <div className="mobile-card mb-6 flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      We use your preferences, commute times, and important
                      addresses to find the best properties for you. &nbsp;
                      <button
                        onClick={() => navigate("/dashboard/personalization")}
                        className="text-xs text-brown hover:text-brown-dark underline cursor-pointer"
                      >
                        Edit Here
                      </button>
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    setIsSearching(true);
                    await fetchIsochronePolygon();
                  } catch (error) {
                    console.error("Search failed:", error);
                  } finally {
                    setIsSearching(false);
                  }
                }}
                disabled={isSearching}
                className="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSearching ? (
                  <KeyTurnLoader message="Searching..." />
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    Search Properties
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Desktop Map - Takes remaining height */}
          <div className="mobile-card flex-1 p-0 relative">
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
                ref={mapRef}
                className="w-full h-full rounded-lg"
                style={{ minHeight: "100%" }}
              />

              {/* Custom Zoom Controls - hidden during search */}
              {!isSearching && (
                <div className="absolute bottom-12 left-8 flex flex-row gap-1 z-10">
                  <button
                    onClick={zoomIn}
                    className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20"
                    title="Zoom in"
                  >
                    <span className="text-lg font-bold leading-none">+</span>
                  </button>
                  <button
                    onClick={zoomOut}
                    className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20"
                    title="Zoom out"
                  >
                    <span className="text-lg font-bold leading-none">−</span>
                  </button>
                </div>
              )}

              {/* Property Pagination Controls - hidden during search */}
              {!isSearching &&
                hasSearched &&
                (activeTab === "results"
                  ? searchResults.length > PROPERTIES_PER_PAGE
                  : savedHomes.length > PROPERTIES_PER_PAGE) && (
                  <div className="absolute bottom-12 right-8 flex flex-row gap-1 z-10">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(0, currentPage - 1))
                      }
                      disabled={currentPage === 0}
                      className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-700 disabled:hover:border-gray-300"
                      title="Previous properties"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="w-auto px-3 h-10 bg-white border border-gray-300 rounded-lg shadow-md flex items-center justify-center text-sm font-medium text-gray-700">
                      {Math.min(
                        (currentPage + 1) * PROPERTIES_PER_PAGE,
                        activeTab === "results"
                          ? searchResults.length
                          : savedHomes.length
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
                      className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-700 disabled:hover:border-gray-300"
                      title="Next properties"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
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
