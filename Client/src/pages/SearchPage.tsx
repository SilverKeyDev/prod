import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Filter, Heart, Bookmark } from "lucide-react";
import mapStyles from "../hooks/mapStyling";

interface SearchResult {
  id: string;
  address: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lat: number;
  lng: number;
}

interface PropertyScore {
  score: number;
  recommendation: string;
  factors: {
    factor: string;
    impact: "positive" | "negative" | "neutral";
    description: string;
  }[];
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([
    {
      id: "1",
      address: "123 Oak Street, San Francisco, CA 94102",
      price: "$850,000",
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1850,
      lat: 37.7849,
      lng: -122.4094,
    },
    {
      id: "2",
      address: "456 Pine Avenue, San Francisco, CA 94103",
      price: "$1,200,000",
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2400,
      lat: 37.7749,
      lng: -122.4194,
    },
    {
      id: "3",
      address: "789 Market Street, San Francisco, CA 94105",
      price: "$950,000",
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1600,
      lat: 37.7649,
      lng: -122.4294,
    },
    {
      id: "4",
      address: "321 Valencia Street, San Francisco, CA 94110",
      price: "$750,000",
      bedrooms: 3,
      bathrooms: 1,
      sqft: 1400,
      lat: 37.7549,
      lng: -122.4094,
    },
    {
      id: "5",
      address: "654 Mission Bay Blvd, San Francisco, CA 94158",
      price: "$1,100,000",
      bedrooms: 3,
      bathrooms: 2.5,
      sqft: 2100,
      lat: 37.7699,
      lng: -122.3944,
    },
  ]);

  const [savedHomes, setSavedHomes] = useState<SearchResult[]>([
    {
      id: "6",
      address: "987 Castro Street, San Francisco, CA 94114",
      price: "$1,350,000",
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2600,
      lat: 37.7599,
      lng: -122.4344,
    },
    {
      id: "7",
      address: "147 Nob Hill Avenue, San Francisco, CA 94108",
      price: "$2,100,000",
      bedrooms: 5,
      bathrooms: 4,
      sqft: 3200,
      lat: 37.7899,
      lng: -122.4144,
    },
    {
      id: "8",
      address: "258 Pacific Heights Dr, San Francisco, CA 94115",
      price: "$1,800,000",
      bedrooms: 4,
      bathrooms: 3.5,
      sqft: 2800,
      lat: 37.7949,
      lng: -122.4394,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<SearchResult | null>(
    null
  );

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
  const [activeTab, setActiveTab] = useState<"results" | "saved">("saved");
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Filter states
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");

  // Calculate property score based on user preferences
  const calculatePropertyScore = (property: SearchResult): PropertyScore => {
    let score = 0;
    const factors: PropertyScore["factors"] = [];

    // Parse price (remove $ and commas)
    const propertyPrice = parseInt(property.price.replace(/[$,]/g, ""));

    // Price scoring (30% weight)
    if (
      propertyPrice >= userPreferences.priceRange.min &&
      propertyPrice <= userPreferences.priceRange.max
    ) {
      score += 30;
      factors.push({
        factor: "Price",
        impact: "positive",
        description: `${
          property.price
        } fits perfectly within your budget of $${userPreferences.priceRange.min.toLocaleString()}-$${userPreferences.priceRange.max.toLocaleString()}`,
      });
    } else if (propertyPrice < userPreferences.priceRange.min) {
      const discount =
        ((userPreferences.priceRange.min - propertyPrice) /
          userPreferences.priceRange.min) *
        100;
      score += 25;
      factors.push({
        factor: "Price",
        impact: "positive",
        description: `${property.price} is ${discount.toFixed(
          0
        )}% below your budget - great value!`,
      });
    } else {
      const overage =
        ((propertyPrice - userPreferences.priceRange.max) /
          userPreferences.priceRange.max) *
        100;
      score += Math.max(0, 30 - overage);
      factors.push({
        factor: "Price",
        impact: "negative",
        description: `${property.price} is ${overage.toFixed(
          0
        )}% over your budget of $${userPreferences.priceRange.max.toLocaleString()}`,
      });
    }

    // Bedrooms scoring (20% weight)
    const bedroomDiff = Math.abs(
      property.bedrooms - userPreferences.preferredBedrooms
    );
    if (bedroomDiff === 0) {
      score += 20;
      factors.push({
        factor: "Bedrooms",
        impact: "positive",
        description: `${property.bedrooms} bedrooms matches your preference exactly`,
      });
    } else if (bedroomDiff === 1) {
      score += 15;
      factors.push({
        factor: "Bedrooms",
        impact: "neutral",
        description: `${property.bedrooms} bedrooms is close to your preference of ${userPreferences.preferredBedrooms}`,
      });
    } else {
      score += Math.max(0, 20 - bedroomDiff * 5);
      factors.push({
        factor: "Bedrooms",
        impact: "negative",
        description: `${property.bedrooms} bedrooms differs significantly from your preference of ${userPreferences.preferredBedrooms}`,
      });
    }

    // Square footage scoring (20% weight)
    if (
      property.sqft >= userPreferences.preferredSqft.min &&
      property.sqft <= userPreferences.preferredSqft.max
    ) {
      score += 20;
      factors.push({
        factor: "Size",
        impact: "positive",
        description: `${property.sqft.toLocaleString()} sqft is within your ideal range`,
      });
    } else if (property.sqft > userPreferences.preferredSqft.max) {
      score += 18;
      factors.push({
        factor: "Size",
        impact: "positive",
        description: `${property.sqft.toLocaleString()} sqft gives you extra space beyond your minimum needs`,
      });
    } else {
      const shortfall =
        ((userPreferences.preferredSqft.min - property.sqft) /
          userPreferences.preferredSqft.min) *
        100;
      score += Math.max(0, 20 - shortfall);
      factors.push({
        factor: "Size",
        impact: "negative",
        description: `${property.sqft.toLocaleString()} sqft is ${shortfall.toFixed(
          0
        )}% smaller than your minimum preference`,
      });
    }

    // Location/Commute scoring (20% weight) - simplified for demo
    const locationScore = Math.random() * 20; // In real app, would calculate actual commute time
    score += locationScore;
    if (locationScore > 15) {
      factors.push({
        factor: "Commute",
        impact: "positive",
        description: `Excellent location with easy access to ${userPreferences.commuteLocation}`,
      });
    } else if (locationScore > 10) {
      factors.push({
        factor: "Commute",
        impact: "neutral",
        description: `Moderate commute to ${userPreferences.commuteLocation}`,
      });
    } else {
      factors.push({
        factor: "Commute",
        impact: "negative",
        description: `Longer commute to ${userPreferences.commuteLocation} than preferred`,
      });
    }

    // Lifestyle fit (10% weight)
    const lifestyleScore = Math.random() * 10; // In real app, would analyze neighborhood data
    score += lifestyleScore;
    factors.push({
      factor: "Lifestyle",
      impact:
        lifestyleScore > 7
          ? "positive"
          : lifestyleScore > 4
          ? "neutral"
          : "negative",
      description: `${
        lifestyleScore > 7 ? "Great" : lifestyleScore > 4 ? "Good" : "Limited"
      } match for ${userPreferences.lifestyle} lifestyle preferences`,
    });

    // Generate recommendation based on score
    let recommendation = "";
    if (score >= 85) {
      recommendation =
        "Excellent match! This property aligns perfectly with your preferences and priorities.";
    } else if (score >= 70) {
      recommendation =
        "Strong match! This property meets most of your key criteria with minor trade-offs.";
    } else if (score >= 55) {
      recommendation =
        "Good option with some compromises. Consider if the trade-offs align with your priorities.";
    } else if (score >= 40) {
      recommendation =
        "Mixed fit. This property has both strengths and significant drawbacks for your needs.";
    } else {
      recommendation =
        "Poor match. This property doesn't align well with your stated preferences.";
    }

    return {
      score: Math.round(score),
      recommendation,
      factors,
    };
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
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        console.error("Google Maps API key not found");
        return;
      }

      try {
        // Load Google Maps script if not already loaded
        if (!window.google) {
          const script = document.createElement("script");
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
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
        googleMapRef.current = new google.maps.Map(mapRef.current, {
          center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
          zoom: 12,
          styles: mapStyles,
          // Hide all controls except map type (satellite/map) controls
          disableDefaultUI: true,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_RIGHT,
            mapTypeIds: ["roadmap", "satellite"],
          },
          gestureHandling: "greedy", // Allow map interaction without ctrl key
        });

        // Load initial markers after map is created
        const initialData =
          activeTab === "results" ? searchResults : savedHomes;
        updateMapMarkers(initialData);
      }
    };

    initializeMap();
  }, []);

  // Update markers when activeTab changes
  useEffect(() => {
    if (googleMapRef.current) {
      const currentData = activeTab === "results" ? searchResults : savedHomes;
      updateMapMarkers(currentData);
    }
  }, [activeTab, searchResults, savedHomes]);

  // Mock search function - replace with actual API call
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const mockResults: SearchResult[] = [
        {
          id: "1",
          address: "123 Main St, San Francisco, CA",
          price: "$850,000",
          bedrooms: 2,
          bathrooms: 2,
          sqft: 1200,
          lat: 37.7849,
          lng: -122.4094,
        },
        {
          id: "2",
          address: "456 Oak Ave, San Francisco, CA",
          price: "$1,200,000",
          bedrooms: 3,
          bathrooms: 2.5,
          sqft: 1800,
          lat: 37.7649,
          lng: -122.4294,
        },
        {
          id: "3",
          address: "789 Pine St, San Francisco, CA",
          price: "$950,000",
          bedrooms: 2,
          bathrooms: 1.5,
          sqft: 1400,
          lat: 37.7949,
          lng: -122.3994,
        },
      ];

      setSearchResults(mockResults);
      updateMapMarkers(mockResults);
      setIsLoading(false);
    }, 1000);
  };

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

    // Use the passed results parameter (which will be the current data)
    const currentData = results;

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
      // Calculate property score and get explanation
      const propertyAnalysis = calculatePropertyScore(result);
      const { fillColor, strokeColor } = getScoreBasedPinColor(propertyAnalysis.score);

      const marker = new google.maps.Marker({
        position: { lat: result.lat, lng: result.lng },
        map: googleMapRef.current,
        title: result.address,
        icon: createMarkerStyle({ fillColor, strokeColor }),
      });

      // Create always-visible property overlay
      
      // Generate a concise explanation for the overlay
      const getShortExplanation = (analysis: PropertyScore): string => {
        const positiveFactors = analysis.factors.filter(f => f.impact === 'positive');
        const negativeFactors = analysis.factors.filter(f => f.impact === 'negative');
        
        if (analysis.score >= 70) {
          const topPositive = positiveFactors.slice(0, 2).map(f => f.factor).join(', ');
          return `Great fit! Strong on ${topPositive}.`;
        } else if (analysis.score >= 55) {
          const positive = positiveFactors[0]?.factor || 'some aspects';
          const negative = negativeFactors[0]?.factor || 'some areas';
          return `Good match on ${positive}, but ${negative} could be better.`;
        } else {
          const topNegative = negativeFactors.slice(0, 2).map(f => f.factor).join(', ');
          return `Limited fit. Concerns with ${topNegative}.`;
        }
      };
      
      const shortExplanation = getShortExplanation(propertyAnalysis);

      const overlayDiv = document.createElement('div');
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
          font-size: 9px;
          color: #4b5563;
          margin-bottom: 6px;
          line-height: 1.3;
          min-height: 26px;
        ">${shortExplanation}</div>
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
          ">${propertyAnalysis.score}/100</div>
          <div style="
            font-size: 9px;
            color: #6b7280;
          ">Match Score</div>
        </div>
        <button 
          onclick="window.openPropertyModal('${result.id}')"
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
            transition: background-color 0.2s;
          "
          onmouseover="this.style.background='#8b5a3c'"
          onmouseout="this.style.background='#A47551'"
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
              this.div.style.left = point.x + 'px';
              this.div.style.top = point.y + 'px';
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setPriceRange({ min: "", max: "" });
    setBedrooms("");
    setBathrooms("");
  };

  const saveHome = (property: SearchResult) => {
    if (!savedHomes.find((home) => home.id === property.id)) {
      setSavedHomes((prev) => [...prev, property]);
    }
  };

  const removeSavedHome = (propertyId: string) => {
    setSavedHomes((prev) => prev.filter((home) => home.id !== propertyId));
  };

  const isHomeSaved = (propertyId: string) => {
    return savedHomes.some((home) => home.id === propertyId);
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
                onClick={() => setActiveTab("results")}
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
                onClick={() => setActiveTab("saved")}
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
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brown mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="h-full overflow-y-auto scrollbar-hide space-y-3 pr-2">
                      {searchResults.map((property) => (
                        <div
                          key={property.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedProperty?.id === property.id
                              ? "border-brown bg-brown/5"
                              : "border-gray-200 hover:border-brown/50 hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedProperty(property)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center mb-1">
                                <h3 className="text-sm font-medium text-black line-clamp-2">
                                  {property.address}
                                </h3>
                              </div>
                              <p className="text-lg font-semibold text-brown mb-2">
                                {property.price}
                              </p>
                              <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                                <div>{property.bedrooms} beds</div>
                                <div>{property.bathrooms} baths</div>
                                <div>{property.sqft.toLocaleString()} sqft</div>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isHomeSaved(property.id)) {
                                  removeSavedHome(property.id);
                                } else {
                                  saveHome(property);
                                }
                              }}
                              className={`p-1 rounded-full transition-colors ${
                                isHomeSaved(property.id)
                                  ? "text-red-500 hover:text-red-600"
                                  : "text-gray-400 hover:text-red-500"
                              }`}
                            >
                              <Heart
                                className={`w-4 h-4 ${
                                  isHomeSaved(property.id) ? "fill-current" : ""
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">
                        Search for properties to see results
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
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedProperty?.id === property.id
                              ? "border-brown bg-brown/5"
                              : "border-gray-200 hover:border-brown/50 hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedProperty(property)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center mb-1">
                                <h3 className="text-sm font-medium text-black line-clamp-2">
                                  {property.address}
                                </h3>
                              </div>
                              <p className="text-lg font-semibold text-brown mb-2">
                                {property.price}
                              </p>
                              <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                                <div>{property.bedrooms} beds</div>
                                <div>{property.bathrooms} baths</div>
                                <div>{property.sqft.toLocaleString()} sqft</div>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSavedHome(property.id);
                              }}
                              className="p-1 rounded-full text-red-500 hover:text-red-600 transition-colors"
                            >
                              <Heart className="w-4 h-4 fill-current" />
                            </button>
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
          {/* Search Bar */}
          <div className="mobile-card mb-6 flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by address, city, or neighborhood..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="mobile-input pl-10 pr-4"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    showFilters
                      ? "bg-brown text-white border-brown"
                      : "bg-white text-gray-700 border-gray-300 hover:border-brown"
                  }`}
                >
                  <Filter className="w-4 h-4 inline mr-2" />
                  Filters
                </button>
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isLoading}
                  className="px-6 py-2 bg-olive-light text-gray-800 rounded-lg hover:bg-olive-light/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? "Searching..." : "Search"}
                </button>
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price Range
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Min"
                        value={priceRange.min}
                        onChange={(e) =>
                          setPriceRange((prev) => ({
                            ...prev,
                            min: e.target.value,
                          }))
                        }
                        className="mobile-input text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Max"
                        value={priceRange.max}
                        onChange={(e) =>
                          setPriceRange((prev) => ({
                            ...prev,
                            max: e.target.value,
                          }))
                        }
                        className="mobile-input text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bedrooms
                    </label>
                    <select
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      className="mobile-input text-sm"
                    >
                      <option value="">Any</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                      <option value="5">5+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bathrooms
                    </label>
                    <select
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value)}
                      className="mobile-input text-sm"
                    >
                      <option value="">Any</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Map - Takes remaining height */}
          <div className="mobile-card flex-1 p-0 relative">
            <div
              ref={mapRef}
              className="w-full h-full rounded-lg"
              style={{ minHeight: "100%" }}
            />

            {/* Custom Zoom Controls */}
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
          </div>
        </div>
      </div>

      {/* Selected Property Details */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-xs w-full p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-serif text-black">
                Property Details
              </h3>
              <button
                onClick={() => setSelectedProperty(null)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <svg
                  className="w-4 h-4 text-gray-500 hover:text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-1">
              <div className="flex items-center">
                <span className="text-xs text-black">
                  {selectedProperty.address}
                </span>
              </div>
              <div className="text-base font-semibold text-brown mb-1">
                {selectedProperty.price}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-medium text-black">
                    {selectedProperty.bedrooms}
                  </div>
                  <div className="text-gray-600 text-xs">beds</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-black">
                    {selectedProperty.bathrooms}
                  </div>
                  <div className="text-gray-600 text-xs">baths</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-black">
                    {selectedProperty.sqft.toLocaleString()}
                  </div>
                  <div className="text-gray-600 text-xs">sqft</div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <button className="w-full bg-olive-light text-gray-800 py-1.5 px-3 rounded-md hover:bg-olive-light/80 transition-colors text-xs">
                  Generate Report for This Property
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
