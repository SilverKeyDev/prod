import { useState, useEffect, useRef } from "react";
import { Bookmark, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import mapStyles from "../../hooks/mapStyling";
import { favoriteHomesApi } from "../../lib/api";
import HeartSave from "../../components/HeartSave";
import PropertyDetailsModal from "../../components/PropertyDetailsModal";
import { searchZillowByPolygon, LatLng } from "../../hooks/searchByCoords";
import { getPropertyDetailsByAddress } from "../../hooks/searchAddress";
import Loading from "../../components/Loading";
import KeyTurnLoader from "../../components/KeyTurnLoader";

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
  // selectedLocation state removed - no longer needed without map click search

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const [savedHomes, setSavedHomes] = useState<SearchResult[]>([]);
  const [favoriteAddresses, setFavoriteAddresses] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStage, setSearchStage] = useState<string>("");
  const [selectedProperty, setSelectedProperty] = useState<SearchResult | null>(
    null
  );
  const [showPropertyModals, setShowPropertyModals] = useState(false);
  const [isLocalStorageLoaded, setIsLocalStorageLoaded] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [, setIsochronePolygon] = useState<google.maps.Polygon | null>(null);
  const [, setIsochroneData] = useState<any>(null);
  const [, setImportantLocationMarkers] = useState<google.maps.Marker[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingPropertyDetails, setIsLoadingPropertyDetails] = useState(false);
  const PROPERTIES_PER_PAGE = 3;

  // Load search results from localStorage or run fresh search based on preferences version
  useEffect(() => {
    const initializeSearchResults = async () => {
      try {
        // Get current user preferences version
        let currentPreferencesVersion = '1.0'; // Default version
        
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
              currentPreferencesVersion = data.preferences?.preferences_version || '1.0';
              console.log(`🔧 Current user preferences version: ${currentPreferencesVersion}`);
            }
          }
        } catch (prefError) {
          console.warn('⚠️ Could not fetch current preferences version, using default:', prefError);
        }
        
        // Check localStorage for saved search results
        const savedSearchData = loadSearchResultsFromLocalStorage();
        const savedPreferencesVersion = savedSearchData?.preferencesVersion;
        
        console.log(`📊 Version comparison - Current: ${currentPreferencesVersion}, Saved: ${savedPreferencesVersion || 'none'}`);
        
        // Decide whether to load from localStorage or run fresh search
        if (savedSearchData && 
            savedSearchData.results && 
            savedSearchData.results.length > 0 && 
            savedPreferencesVersion === currentPreferencesVersion) {
          
          // Preferences versions match - load from localStorage
          console.log(`✅ Preferences versions match (${currentPreferencesVersion}) - loading ${savedSearchData.results.length} results from localStorage`);
          setSearchResults(savedSearchData.results);
          setHasSearched(savedSearchData.searchMetadata?.hasSearched || true);
          setCurrentPage(savedSearchData.searchMetadata?.currentPage || 0);
          setShowPropertyModals(true);
          console.log('✅ localStorage loading complete - cached results loaded');
          
        } else {
          console.log('🔄 No valid cached results found - will run fresh search');
        }
        
      } catch (error) {
        console.error('❌ Error in search results initialization:', error);
        // Fallback: try to load any saved data regardless of version
        const savedSearchData = loadSearchResultsFromLocalStorage();
        if (savedSearchData && savedSearchData.results && savedSearchData.results.length > 0) {
          console.log(`🔄 Fallback: loading ${savedSearchData.results.length} results from localStorage despite error`);
          setSearchResults(savedSearchData.results);
          setHasSearched(true);
          setShowPropertyModals(true);
        }
      }
      
      // Mark localStorage loading as complete
      setIsLocalStorageLoaded(true);
      console.log('✅ localStorage initialization complete');
    };
    
    initializeSearchResults();
  }, []); // Empty dependency array - only run on mount

  // Global function to open property modal from info window
  useEffect(() => {
    (window as any).openPropertyModal = (propertyId: string) => {
      const allProperties = [...searchResults, ...savedHomes];
      const property = allProperties.find((p) => p.id === propertyId);
      if (property) {
        setSelectedProperty(property);
      }
    };

    // Cleanup function
    return () => {
      delete (window as any).openPropertyModal;
    };
  }, [searchResults, savedHomes]);
  const [activeTab, setActiveTab] = useState<"results" | "saved">("results");

  // Reset to first page when switching tabs
  const handleTabChange = (tab: "results" | "saved") => {
    setActiveTab(tab);
    setCurrentPage(0);
  };
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const individualPolygonsRef = useRef<google.maps.Polygon[]>([]);
  const importantMarkersRef = useRef<google.maps.Marker[]>([]);

  // Use backend ML match score (already calculated as 0-100 integer)
  const calculatePropertyScore = (property: SearchResult) => {
    return property._score || 0; // Backend ML score (0-100 integer)
  };

  // Save search results to localStorage with preferences version
  const saveSearchResultsToLocalStorage = async (results: SearchResult[]) => {
    try {
      // Fetch current user preferences to get the version
      let preferencesVersion = '1.0'; // Default version
      
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
            preferencesVersion = data.preferences?.preferences_version || '1.0';
            console.log(`🔧 Retrieved preferences version: ${preferencesVersion}`);
          }
        }
      } catch (prefError) {
        console.warn('⚠️ Could not fetch preferences version, using default:', prefError);
      }
      
      const searchData = {
        results: results,
        timestamp: new Date().toISOString(),
        totalCount: results.length,
        preferencesVersion: preferencesVersion,
        searchMetadata: {
          hasSearched: true,
          currentPage: 0,
          propertiesPerPage: PROPERTIES_PER_PAGE
        }
      };
      
      localStorage.setItem('searchResults', JSON.stringify(searchData));
      console.log(`💾 Saved ${results.length} search results to localStorage with preferences version ${preferencesVersion}`);
    } catch (error) {
      console.error('❌ Error saving search results to localStorage:', error);
    }
  };

  // Load search results from localStorage on component mount
  const loadSearchResultsFromLocalStorage = () => {
    try {
      const savedData = localStorage.getItem('searchResults');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log(`📂 Loaded ${parsedData.results?.length || 0} search results from localStorage`);
        return parsedData;
      }
    } catch (error) {
      console.error('❌ Error loading search results from localStorage:', error);
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
    const initializeMap = async () => {
      try {
        // Fetch the Google Maps script URL from backend
        const idToken = localStorage.getItem("id_token");
        console.log("🔑 Fetching Google Maps script URL from backend...");
        const response = await fetch("/api/maps/script", {
          headers: {
            Authorization: idToken ? `Bearer ${idToken}` : "",
            "Content-Type": "application/json",
          },
        });

        console.log("📡 Response status:", response.status);
        console.log("📡 Response headers:", response.headers);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            "❌ Backend response error:",
            response.status,
            errorText
          );
          return;
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const responseText = await response.text();
          console.error(
            "❌ Expected JSON but got:",
            contentType,
            responseText.substring(0, 200)
          );
          return;
        }

        const data = await response.json();
        console.log("📦 Backend response data:", data);

        if (!data.success || !data.script_url) {
          console.error(
            "❌ Backend returned error or missing script_url:",
            data
          );
          return;
        }
        const scriptUrl = data.script_url;
        console.log("✅ Got script URL:", scriptUrl);

        // Load Google Maps script if not already loaded
        if (!window.google) {
          const script = document.createElement("script");
          script.src = scriptUrl;
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);

          script.onload = () => {
            createMap();
          };
        } else {
          createMap();
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    const createMap = () => {
      if (mapRef.current && window.google) {
        googleMapRef.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
          zoom: 12,
          styles: mapStyles,
          // Hide all controls except map type (satellite/map) controls
          disableDefaultUI: true,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: window.google.maps.ControlPosition.TOP_RIGHT,
            mapTypeIds: ["roadmap", "satellite"],
          },
          gestureHandling: "greedy", // Allow map interaction without ctrl key
        });

        // Check if we already have search results loaded (from localStorage or previous search)
        // If so, just fetch isochrone for map population without property search
        // If not, fetch isochrone with property search
        console.log("🚀 Map initialized, checking for existing search results...");
        
        // Small delay to allow localStorage loading to complete first
        setTimeout(() => {
          if (searchResults.length > 0) {
            console.log("✅ Found existing search results, fetching isochrone for map population only...");
            fetchIsochroneForMapOnly()
              .then((data) => {
                if (data) {
                  console.log("📦 Isochrone data received, rendering polygon...");
                  renderIsochronePolygon(data);

                  // Also render important location markers
                  console.log("📍 Rendering important location markers...");
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
          } else {
            console.log("🔄 No existing search results, fetching isochrone with property search...");
            fetchIsochronePolygon()
              .then((data) => {
                if (data) {
                  console.log("📦 Isochrone data received, rendering polygon...");
                  renderIsochronePolygon(data);

                  // Also render important location markers
                  console.log("📍 Rendering important location markers...");
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
          }
        }, 100); // Small delay to allow localStorage loading to complete
      }
    };

    // Only initialize map after localStorage loading is complete
    if (isLocalStorageLoaded) {
      initializeMap();
    }
  }, [isLocalStorageLoaded]);

  // Handle property details search
  const handleViewPropertyDetails = async (property: SearchResult) => {
    console.log("🔍 ===== VIEW DETAILS CLICKED =====");
    console.log("🔍 Timestamp:", new Date().toISOString());
    console.log(
      "🔍 Property data received:",
      JSON.stringify(property, null, 2)
    );
    console.log("🔍 Property address:", property.address);
    console.log(
      "🔍 getPropertyDetailsByAddress function available:",
      typeof getPropertyDetailsByAddress
    );

    // Set loading state to show KeyTurnLoader
    setIsLoadingPropertyDetails(true);

    try {
      console.log("🔍 Step 1: Starting detailed property information fetch...");
      console.log(
        "🔍 About to call getPropertyDetailsByAddress with zpid:",
        property.id,
        "for address:",
        property.address
      );

      // Call the searchAddress function to get detailed property information using zpid for exact match
      const detailedPropertyData = await getPropertyDetailsByAddress(
        property.id, // Use zpid for exact match instead of address
        property.address // Fallback address if zpid fails
      );

      console.log("✅ Step 2: Successfully received detailed property data");
      console.log("✅ Detailed data type:", typeof detailedPropertyData);
      console.log(
        "✅ Detailed data keys:",
        detailedPropertyData
          ? Object.keys(detailedPropertyData)
          : "null/undefined"
      );
      console.log(
        "✅ Full detailed data:",
        JSON.stringify(detailedPropertyData, null, 2)
      );

      // Update the selected property with the detailed data if available
      console.log("🔄 Step 3: Merging property data...");
      const enhancedProperty = {
        ...property,
        ...detailedPropertyData, // Merge detailed data with existing property data
      };

      console.log("🔄 Enhanced property keys:", Object.keys(enhancedProperty));
      console.log("🔄 Enhanced property sample fields:");
      console.log("  - address:", enhancedProperty.address);
      console.log("  - price:", enhancedProperty.price);
      console.log("  - yearBuilt:", enhancedProperty.yearBuilt);
      console.log("  - taxAnnualAmount:", enhancedProperty.taxAnnualAmount);
      console.log("  - listed_by:", !!enhancedProperty.listed_by);
      console.log("  - schools:", enhancedProperty.schools?.length || 0);

      console.log("🔄 Step 4: Setting selected property in state...");
      setSelectedProperty(enhancedProperty);
      console.log("✅ ===== VIEW DETAILS COMPLETED SUCCESSFULLY =====");
    } catch (error) {
      console.error("❌ ===== VIEW DETAILS FAILED =====");
      console.error("❌ Error fetching property details:", error);
      console.error("❌ Error type:", typeof error);
      console.error("❌ Error message:", (error as Error).message);
      console.error("❌ Error stack:", (error as Error).stack);

      // Fallback: use the original property data without detailed information
      console.log("🔄 Using fallback: setting original property data");
      setSelectedProperty(property);
      console.log("⚠️ ===== VIEW DETAILS COMPLETED WITH FALLBACK =====");
    } finally {
      // Clear loading state regardless of success or failure
      setIsLoadingPropertyDetails(false);
    }
  };

  // Create window function for map modal "View Details" buttons
  useEffect(() => {
    // Define the global function that map modals can call
    (window as any).openPropertyModal = (propertyId: string) => {
      console.log(
        "🗺️ MAP MODAL: View Details clicked for property ID:",
        propertyId
      );

      // Find the property in current data (search results or saved homes)
      const currentData = activeTab === "results" ? searchResults : savedHomes;
      const property = currentData.find((p) => p.id === propertyId);

      if (property) {
        console.log(
          "🗺️ MAP MODAL: Found property, calling handleViewPropertyDetails"
        );
        console.log("🗺️ MAP MODAL: Property address:", property.address);
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
      const currentData = activeTab === "results" ? searchResults : savedHomes;
      updateMapMarkers(currentData);
    } else if (googleMapRef.current && (!hasSearched || !showPropertyModals)) {
      // Clear all markers when user hasn't searched yet or property modals should not be shown
      markersRef.current.forEach((marker) => {
        marker.setMap(null);
        if ((marker as any).overlay) {
          (marker as any).overlay.setMap(null);
        }
      });
      markersRef.current = [];
    }
  }, [
    activeTab,
    searchResults,
    savedHomes,
    showPropertyModals,
    hasSearched,
    currentPage,
  ]);

  // Fetch isochrone polygon from backend for map population only (no property search)
  const fetchIsochroneForMapOnly = async () => {
    console.log("🗺️ Starting isochrone fetch for map population only...");
    try {
      // Try multiple token sources for authentication
      const idToken = localStorage.getItem("id_token");
      const token = localStorage.getItem("token");
      const authToken = idToken || token;

      if (!authToken) {
        console.log(
          "❌ No auth token found (checked both id_token and token), skipping isochrone fetch"
        );
        return null;
      }

      console.log("🔑 Auth token found, making API request...");
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
          console.log("✅ ISOCHRONE SUCCESS - Map population only:");
          console.log(
            "  📍 Center Location:",
            JSON.stringify(data.data.center, null, 2)
          );
          console.log(
            "  ⏱️ Commute Tolerance:",
            data.data.commute_tolerance,
            "minutes"
          );
          console.log("  🚗 Travel Mode:", data.data.mode);
          console.log(
            "  🗺️ Geometry Type:",
            data.data.isochrone?.geometry?.type
          );
          console.log(
            "  📐 Geometry Coordinates Length:",
            data.data.isochrone?.geometry?.coordinates?.length
          );

          // NO property search - just return the data for map population
          console.log("🗺️ Isochrone data ready for map population (no search triggered)");
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
    console.log("🔍 Starting isochrone polygon fetch...");
    try {
      // Try multiple token sources for authentication
      const idToken = localStorage.getItem("id_token");
      const token = localStorage.getItem("token");
      const authToken = idToken || token;

      if (!authToken) {
        console.log(
          "❌ No auth token found (checked both id_token and token), skipping isochrone fetch"
        );
        return null;
      }

      console.log("🔑 Auth token found, making API request...");
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const response = await fetch(`${apiBaseUrl}/api/v1/search/isochrone`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log("📡 API response status:", response.status);
      console.log("📡 API response ok:", response.ok);
      console.log("📡 API response statusText:", response.statusText);

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.data) {
          setIsochroneData(data.data);
          console.log("✅ ISOCHRONE SUCCESS - Detailed data breakdown:");
          console.log(
            "  📍 Center Location:",
            JSON.stringify(data.data.center, null, 2)
          );
          console.log(
            "  ⏱️ Commute Tolerance:",
            data.data.commute_tolerance,
            "minutes"
          );
          console.log("  🚗 Travel Mode:", data.data.mode);
          console.log(
            "  🗺️ Geometry Type:",
            data.data.isochrone?.geometry?.type
          );
          console.log(
            "  📐 Geometry Coordinates Length:",
            data.data.isochrone?.geometry?.coordinates?.length
          );
          console.log(
            "  🔍 Full Isochrone Object:",
            JSON.stringify(data.data.isochrone, null, 2)
          );

          // Automatically trigger property search using the isochrone polygon
          console.log(
            "🏠 Auto-triggering property search within isochrone polygon..."
          );
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
    console.log(
      "🏠 Starting automatic property search within isochrone polygon..."
    );
    setIsSearching(true);
    setSearchStage("Locating homes in your area...");

    // Clear previous search results to show loading state in sidebar
    setSearchResults([]);
    console.log("🧹 Cleared previous search results from sidebar");

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

      console.log(
        "🔍 Converted isochrone to search polygon with",
        searchPolygon.length,
        "points"
      );

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

      console.log(
        "🔍 Starting property search with preferences:",
        searchUserPreferences
      );

      setSearchStage("Extracting property data...");
      
      // Call the Zillow search API with the isochrone polygon
      const searchResult = await searchZillowByPolygon({
        polygon: searchPolygon,
        user_preferences: searchUserPreferences,
        status_type: "ForSale",
        perBucketPages: 10,
        maxRetries: 3,
      });

      console.log(
        "📊 Search completed, found",
        searchResult.properties.length,
        "properties"
      );

      // Show evaluating scores stage for 10 seconds
      setSearchStage("Evaluating scores...");
      await new Promise(resolve => setTimeout(resolve, 10000));

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
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSearchStage("Finalizing results...");
      
      // Update search results and mark as searched
      setSearchResults(transformedResults);
      
      // Save search results to localStorage with preferences version
      saveSearchResultsToLocalStorage(transformedResults).catch((error) => {
        console.error('❌ Failed to save search results to localStorage:', error);
      });
      
      setHasSearched(true);
      setIsSearching(false);
      setCurrentPage(0); // Reset to first page when new search results come in
      setShowPropertyModals(true); // Enable property markers to be displayed on map

      console.log(
        "✅ Auto-search completed successfully with",
        transformedResults.length,
        "results"
      );
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
    console.log("🗺️ Starting polygon rendering...");
    console.log("  - Map ref exists:", !!googleMapRef.current);
    console.log("  - Isochrone data exists:", !!isochroneData);
    console.log("  - Geometry exists:", !!isochroneData?.isochrone?.geometry);

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
      console.log("🧹 Clearing existing union polygon");
      polygonRef.current.setMap(null);
    }

    // Clear existing individual polygons
    if (individualPolygonsRef.current) {
      console.log("🧹 Clearing existing individual polygons");
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
        console.log(
          "🔍 Rendering",
          isochroneData.individual_isochrones.length,
          "individual isochrones"
        );

        isochroneData.individual_isochrones.forEach(
          (individualData: any, index: number) => {
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

              console.log(
                `✅ Rendered individual isochrone ${index + 1} (${
                  individualData.name
                }) in gray`
              );
            }
          }
        );
      }

      // Now render the main union isochrone
      const geometry = isochroneData.isochrone.geometry;
      console.log("📐 Geometry type:", geometry.type);
      console.log(
        "📐 Geometry coordinates length:",
        geometry.coordinates?.length
      );

      let coordinates: number[][][] = [];

      if (geometry.type === "Polygon") {
        coordinates = geometry.coordinates;
        console.log("📍 Processing Polygon with", coordinates.length, "rings");
      } else if (geometry.type === "MultiPolygon") {
        // For MultiPolygon, take the first polygon
        coordinates = geometry.coordinates[0];
        console.log(
          "📍 Processing MultiPolygon, using first polygon with",
          coordinates.length,
          "rings"
        );
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
        console.log("🔄 Converted ring with", convertedRing.length, "points");
        return convertedRing;
      });

      console.log("📊 Total paths created:", paths.length);
      console.log("📊 First path sample points:", paths[0]?.slice(0, 3));

      // Create the main union polygon
      const polygon = new google.maps.Polygon({
        paths: paths,
        strokeColor: "#7B9E7C", // Match the app's green theme
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#7B9E7C",
        fillOpacity: 0.15,
        clickable: false,
      });

      console.log("🎨 Created union polygon with styling");
      polygon.setMap(googleMapRef.current);
      polygonRef.current = polygon;
      setIsochronePolygon(polygon);

      console.log("✅ Successfully rendered isochrone polygon on map");

      // Fit the map to include the polygon bounds
      const bounds = new google.maps.LatLngBounds();
      paths[0].forEach((point: { lat: number; lng: number }) => {
        bounds.extend(point);
      });

      console.log("🔍 Fitting map bounds to polygon");
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

  // Render important location markers on the map
  const renderImportantLocationMarkers = async (isochroneData: any) => {
    if (!googleMapRef.current || !isochroneData?.center) {
      console.warn(
        "❌ Cannot render important location markers: map or data not available"
      );
      return;
    }

    // Clear existing important location markers
    importantMarkersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    importantMarkersRef.current = [];

    try {
      // Use the same important locations data that the isochrone calculation uses
      // The isochrone data already contains the important locations information
      let importantLocations = [];

      // Extract important locations from isochrone data (same as property search)
      if (isochroneData.center) {
        // Add the center location (primary important location)
        importantLocations.push({
          name: isochroneData.center.name || "Primary Location",
          address: isochroneData.center.address,
          lat: isochroneData.center.lat,
          lng: isochroneData.center.lng,
          commute_tolerance: isochroneData.commute_tolerance || 30,
        });
      }

      // If there are additional important locations in the isochrone data, add them
      if (isochroneData.locations && Array.isArray(isochroneData.locations)) {
        isochroneData.locations.forEach((location: any) => {
          if (location.address) {
            importantLocations.push({
              name: location.name || "Important Location",
              address: location.address,
              lat: location.lat || null, // Backend doesn't include lat/lng, will geocode
              lng: location.lng || null,
              commute_tolerance: location.commute_tolerance || 30,
            });
          }
        });
      }

      console.log("📍 IMPORTANT LOCATIONS - Using isochrone data:");
      console.log("📍 IMPORTANT LOCATIONS SUMMARY:");
      console.log("  🔢 Total Count:", importantLocations.length);
      importantLocations.forEach((loc: any, index: number) => {
        console.log(
          `  ${index + 1}. Name: "${loc.name}", Address: "${loc.address}"`
        );
      });

      // Create markers for each important location
      const markers: google.maps.Marker[] = [];

      for (let i = 0; i < importantLocations.length; i++) {
        const location = importantLocations[i];
        const { name, address } = location;

        if (!address) {
          console.warn("⚠️ Skipping location without address:", name);
          continue;
        }

        try {
          // Geocode the address to get coordinates
          const geocoder = new google.maps.Geocoder();
          const geocodeResponse = await geocoder.geocode({ address });

          if (geocodeResponse.results && geocodeResponse.results.length > 0) {
            const position = geocodeResponse.results[0].geometry.location;

            // Create custom marker icon based on location index
            const isFirstLocation = i === 0;
            const markerIcon = {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: isFirstLocation ? "#7B9E7C" : "#E8A87C", // Green for first (isochrone center), orange for others
              fillOpacity: 0.9,
              strokeColor: "#ffffff",
              strokeWeight: 2,
              scale: isFirstLocation ? 12 : 8,
            };

            // Create the marker
            const marker = new google.maps.Marker({
              position: position,
              map: googleMapRef.current,
              title: `${name}${isFirstLocation ? " (Commute Center)" : ""}`,
              icon: markerIcon,
            });

            // Create minimal info window for the marker - always visible, no close button
            const commuteTime = location.commute_tolerance || 30;
            const infoWindow = new google.maps.InfoWindow({
              content: `
                <style>
                  .gm-ui-hover-effect { display: none !important; }
                  .gm-style-iw-c button { display: none !important; }
                  .gm-style-iw-t::after { display: none !important; }
                </style>
                <div style="
                  padding: 6px 8px; 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  background: rgba(245, 245, 220, 0.95);
                  border: 1px solid #9E8371;
                  border-radius: 6px;
                  box-shadow: 0 2px 8px rgba(158, 131, 113, 0.2);
                  min-width: 80px;
                  max-width: 120px;
                  text-align: center;
                ">
                  <div style="
                    color: #5D4E37; 
                    font-size: 12px; 
                    font-weight: 600;
                    margin-bottom: 2px;
                  ">
                    ${name}
                  </div>
                  <div style="
                    color: #8B7355; 
                    font-size: 10px;
                    font-weight: 500;
                  ">
                    ${commuteTime} min
                  </div>
                </div>
              `,
              disableAutoPan: true,
              pixelOffset: new google.maps.Size(0, -5),
            });

            // Open the info window immediately and keep it open (always visible)
            infoWindow.open(googleMapRef.current, marker);

            // Store info window reference on marker for cleanup
            (marker as any).infoWindow = infoWindow;

            markers.push(marker);
            console.log(`✅ Created marker for ${name} at`, position.toJSON());
          } else {
            console.warn(
              `⚠️ Could not geocode address for ${name}: ${address}`
            );
          }
        } catch (error) {
          console.error(`❌ Error creating marker for ${name}:`, error);
        }
      }

      // Update refs and state
      importantMarkersRef.current = markers;
      setImportantLocationMarkers(markers);

      console.log(
        `✅ Successfully created ${markers.length} important location markers`
      );
    } catch (error) {
      console.error("❌ Error rendering important location markers:", error);
    }
  };

  // Load saved homes from user's favorite_home_ids on component mount
  useEffect(() => {
    const loadSavedHomes = async () => {
      console.log("🏠 ===== SAVED HOMES RETRIEVAL STARTED =====");
      console.log("🕐 Timestamp:", new Date().toISOString());

      try {
        // Get auth token
        console.log("🔑 Step 1: Checking authentication tokens...");
        const idToken = localStorage.getItem("id_token");
        const token = localStorage.getItem("token");
        const authToken = idToken || token;

        console.log("🔑 Token check results:");
        console.log("  - id_token exists:", !!idToken);
        console.log("  - token exists:", !!token);
        console.log(
          "  - Using token type:",
          idToken ? "id_token" : token ? "token" : "none"
        );
        console.log("  - Token length:", authToken ? authToken.length : 0);

        if (!authToken) {
          console.log("❌ No auth token found, cannot load saved homes");
          return;
        }

        // Step 2: Call the centralized favoriteHomesApi
        console.log("🏠 Step 2: Calling favoriteHomesApi.getFavorites()...");
        const favoritesData = await favoriteHomesApi.getFavorites();
        console.log("🏠 Step 3: Favorite homes API response received");
        console.log("🏠 Response success:", favoritesData.success);
        console.log("🏠 Response keys:", Object.keys(favoritesData));

        if (!favoritesData.success) {
          console.error("🏠 API returned success=false:", favoritesData.error);
          return;
        }

        // Step 3: Extract favorite addresses from API response (backend returns { favorites: string[] })
        const favoriteAddresses = favoritesData.favorites || [];
        console.log("🏠 Step 4: Processing favorite addresses...");
        console.log("🏠 FAVORITE ADDRESSES SUMMARY:");
        console.log("  🔢 Total Count:", favoriteAddresses.length);
        favoriteAddresses.forEach((address: string, index: number) => {
          console.log(`  ${index + 1}. Address: "${address}"`);
        });

        // Step 4: Convert favorite addresses to SearchResult objects with dummy data
        if (favoriteAddresses.length > 0) {
          console.log(
            "🔄 Step 5: Converting favorite addresses to SearchResult objects..."
          );

          const savedHomesData: SearchResult[] = favoriteAddresses.map(
            (address: string, index: number) => {
              // Generate realistic dummy data for each saved home
              const dummyPrices = [
                425000, 550000, 675000, 789000, 825000, 950000, 1200000,
              ];
              const dummyBedrooms = [2, 3, 3, 4, 4, 5, 5];
              const dummyBathrooms = [1.5, 2, 2.5, 2.5, 3, 3.5, 4];
              const dummySqft = [1200, 1450, 1800, 2100, 2400, 2800, 3200];
              const dummyImages = [
                "https://photos.zillowstatic.com/fp/01cb7e1f500768d5c6e07439ff5906c0-p_e.jpg",
                "https://photos.zillowstatic.com/fp/02ab8e2f600878d6c7e18549ff6917d1-p_e.jpg",
                "https://photos.zillowstatic.com/fp/03bc9f3f701989e7d8f29659ff7928e2-p_e.jpg",
                "https://photos.zillowstatic.com/fp/04cd0f4f802090f8e9f30769ff8039f3-p_e.jpg",
                "https://photos.zillowstatic.com/fp/05de1f5f903101f9f0f41879ff9140f4-p_e.jpg",
              ];

              const randomIndex = index % dummyPrices.length;

              return {
                id: `saved_${index + 1}`,
                address: address,
                price: `$${dummyPrices[randomIndex].toLocaleString()}`,
                bedrooms: dummyBedrooms[randomIndex],
                bathrooms: dummyBathrooms[randomIndex],
                sqft: dummySqft[randomIndex],
                lat: 33.749 + (Math.random() - 0.5) * 0.1, // Atlanta area with some variation
                lng: -84.388 + (Math.random() - 0.5) * 0.1,
                lotSize: `${(0.2 + Math.random() * 0.8).toFixed(3)} acres`,
                propertyType: "SINGLE_FAMILY",
                listingStatus: "FOR_SALE",
                imageUrl: dummyImages[randomIndex],
              };
            }
          );

          console.log("🏠 Created saved homes with dummy data:");
          savedHomesData.forEach((home, index) => {
            console.log(
              `  ${index + 1}. ${home.address} - ${home.price} - ${
                home.bedrooms
              }br/${home.bathrooms}ba`
            );
          });

          // Update state
          setFavoriteAddresses(favoriteAddresses);
          setSavedHomes(savedHomesData);
          console.log(
            "✅ Successfully set saved homes with dummy data in component state"
          );
        } else {
          console.log(
            "ℹ️ No favorite addresses found, saved homes will remain empty"
          );
        }

        console.log(
          "🏠 ===== SAVED HOMES RETRIEVAL COMPLETED SUCCESSFULLY ====="
        );
        console.log("📊 Final state summary:");
        console.log("  - Favorite addresses count:", favoriteAddresses.length);
        console.log("  - Saved homes count:", favoriteAddresses.length);
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
  const updateMapMarkers = (results: SearchResult[]) => {
    if (!googleMapRef.current) return;

    // Clear existing markers and overlays
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
      // Also remove the overlay if it exists
      if ((marker as any).overlay) {
        (marker as any).overlay.setMap(null);
      }
    });
    markersRef.current = [];

    // Paginate the results - only show PROPERTIES_PER_PAGE at a time
    const startIndex = currentPage * PROPERTIES_PER_PAGE;
    const endIndex = startIndex + PROPERTIES_PER_PAGE;
    const paginatedData = results.slice(startIndex, endIndex);
    const currentData = paginatedData;

    const BASE_PIN_PATH =
      "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z";

    const createMarkerStyle = ({
      fillColor,
      strokeColor,
      scale = 1.2,
      anchor = new google.maps.Point(12, 24),
    }: {
      fillColor: string;
      strokeColor: string;
      scale?: number;
      anchor?: google.maps.Point;
    }): google.maps.Symbol => ({
      path: BASE_PIN_PATH,
      scale,
      fillColor,
      fillOpacity: 0.9,
      strokeColor,
      strokeOpacity: 0.9,
      strokeWeight: 1.75,
      anchor,
    });

    currentData.forEach((result) => {
      // Use backend ML match score directly
      const score = calculatePropertyScore(result);
      const { fillColor, strokeColor } = getScoreBasedPinColor(score);

      const marker = new google.maps.Marker({
        position: { lat: result.lat, lng: result.lng },
        map: googleMapRef.current,
        title: result.address,
        icon: createMarkerStyle({ fillColor, strokeColor }),
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
        </div>
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
              style.innerHTML = '@keyframes turnKey { 0% { transform: rotate(0deg); } 25% { transform: rotate(20deg); } 50% { transform: rotate(0deg); } 75% { transform: rotate(-20deg); } 100% { transform: rotate(0deg); } }';
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

    // Fit map to show all markers
    if (currentData.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      currentData.forEach((result) => {
        bounds.extend({ lat: result.lat, lng: result.lng });
      });
      googleMapRef.current.fitBounds(bounds);
    }
  };
  const saveHome = async (property: SearchResult) => {
    try {
      // Call backend API to add favorite
      const response = await favoriteHomesApi.addFavorite(property);

      if (response.success) {
        // Update local state
        if (!savedHomes.find((home) => home.id === property.id)) {
          setSavedHomes((prev) => [...prev, property]);
        }
        // Update favorite addresses from backend response
        if (response.data?.favorites) {
          setFavoriteAddresses(response.data.favorites);
        }
        console.log("✅ Home added to favorites:", property.address);
      } else {
        console.error("❌ Failed to add favorite:", response.error);
      }
    } catch (error) {
      console.error("❌ Error adding favorite:", error);
    }
  };

  const removeSavedHome = async (propertyId: string) => {
    try {
      // Find the property to get its address
      const property = savedHomes.find((home) => home.id === propertyId);
      if (!property) return;

      // Call backend API to remove favorite
      const response = await favoriteHomesApi.removeFavorite(property.address);

      if (response.success) {
        // Update local state
        setSavedHomes((prev) => prev.filter((home) => home.id !== propertyId));
        // Update favorite addresses from backend response
        if (response.data?.favorites) {
          setFavoriteAddresses(response.data.favorites);
        }
        console.log("✅ Home removed from favorites:", property.address);
      } else {
        console.error("❌ Failed to remove favorite:", response.error);
      }
    } catch (error) {
      console.error("❌ Error removing favorite:", error);
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
      googleMapRef.current.setZoom(currentZoom + 1);
    }
  };

  const zoomOut = () => {
    if (googleMapRef.current) {
      const currentZoom = googleMapRef.current.getZoom() || 12;
      googleMapRef.current.setZoom(currentZoom - 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Main Layout */}
      <div className="flex gap-4 h-[calc(100vh-160px)]">
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
                Search Results
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
                Saved Homes
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
                                    const score = calculatePropertyScore(property);
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
                                  <div>
                                    {property.sqft.toLocaleString()} sqft
                                  </div>
                                </div>

                                {/* Match Score */}
                                {(() => {
                                  const score = calculatePropertyScore(property);
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
                                {property.lotSize && (
                                  <div className="text-xs text-gray-500">
                                    Lot: {property.lotSize}
                                  </div>
                                )}
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search Properties
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Map - Takes remaining height */}
          <div className="mobile-card flex-1 p-0 relative">
            {/* Loading overlay - shows until at least one property is available on map */}
            {(isSearching || (hasSearched && searchResults.length === 0 && savedHomes.length === 0) || (!hasSearched && searchResults.length === 0 && savedHomes.length === 0)) && (
              <div className="absolute inset-0 z-20 w-full h-full rounded-lg flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                  <Loading message={isSearching ? (searchStage || "Searching properties...") : "Loading map..."} />
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
        onClose={() => setSelectedProperty(null)}
        isHomeSaved={isHomeSaved}
        saveHome={saveHome}
        removeSavedHome={removeSavedHome}
      />
    </div>
  );
}
