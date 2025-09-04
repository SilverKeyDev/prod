import { Bookmark, MapPin } from "lucide-react";
import HomeCard from "../../cards/HomeCard";
import KeyTurnLoader from "../base/KeyTurnLoader";
import { SearchResult } from "../../../types/search";

interface SearchResultWithScore extends SearchResult {
  calculatedScore?: number;
}

interface MobileSearchSidebarProps {
  searchResults: SearchResultWithScore[];
  savedHomes: SearchResult[];
  activeTab: "results" | "saved";
  onTabChange: (tab: "results" | "saved") => void;
  selectedProperty: SearchResult | null;
  isLoadingPropertyDetails: boolean;
  onViewPropertyDetails: (property: SearchResult) => void;
  onSaveHome: (property: SearchResult) => void;
  onRemoveSavedHome: (propertyId: string) => void;
  isHomeSaved: (propertyId: string) => boolean;
  hasSearched: boolean;
  setShowPropertyModals: (show: boolean) => void;
  setHasSearched: (searched: boolean) => void;
  onFocusProperty?: (property: SearchResult) => void;
}

export default function MobileSearchSidebar({
  searchResults,
  savedHomes,
  activeTab,
  onTabChange,
  selectedProperty,
  isLoadingPropertyDetails,
  onSaveHome,
  onRemoveSavedHome,
  isHomeSaved,
  hasSearched,
  setShowPropertyModals,
  setHasSearched,
  onFocusProperty,
}: MobileSearchSidebarProps) {
  const handleTabChange = (tab: "results" | "saved") => {
    onTabChange(tab);
    if (tab === "results") {
      if (hasSearched && searchResults.length > 0) {
        setShowPropertyModals(true);
      }
    } else {
      // For saved homes, we can show modals even without searching since these are user's saved properties
      if (savedHomes.length > 0) {
        setShowPropertyModals(true);
        setHasSearched(true); // Allow saved homes to be viewed
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border border-gray-200 rounded-lg px-responsive-md pt-responsive-md pb-0 lg:p-responsive-md">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 flex-shrink-0 my-4">
        <button
          onClick={() => handleTabChange("results")}
          className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "results"
              ? "border-brown text-brown"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span>Search</span>
            <span className="w-5 h-5 bg-olive text-white text-xs rounded-full flex items-center justify-center font-medium">
              {searchResults.length}
            </span>
          </div>
        </button>
        <button
          onClick={() => handleTabChange("saved")}
          className={`flex-1 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "saved"
              ? "border-brown text-brown"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span>Saved</span>
            <span className="w-5 h-5 bg-olive text-white text-xs rounded-full flex items-center justify-center font-medium">
              {savedHomes.length}
            </span>
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
                <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3 px-2">
                  {searchResults.map((property) => {
                    // Convert SearchResult to HomeDescription format
                    const homeData = {
                      home_id: property.id,
                      description: property.description,
                      image_url: property.imageUrl,
                      price: property.price,
                      score: property._score,
                      bedrooms: property.bedrooms,
                      bathrooms: property.bathrooms,
                      sqft: property.sqft,
                      lot_size: property.lotSize,
                      propertyType: property.propertyType,
                      lat: property.lat || property.latitude,
                      lng: property.lng || property.longitude,
                      address: property.address,
                      calculatedScore: property.calculatedScore,
                    };

                    return (
                      <div
                        key={property.id}
                        className={`${
                          selectedProperty?.id === property.id
                            ? "ring-2 ring-brown ring-opacity-50"
                            : ""
                        }`}
                      >
                        {/* Loading overlay */}
                        {isLoadingPropertyDetails &&
                          selectedProperty?.id === property.id && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                              <KeyTurnLoader message="Loading details..." />
                            </div>
                          )}

                        <HomeCard
                          home={homeData}
                          showScore={true}
                          isOnMap={false}
                          isHomeSaved={isHomeSaved}
                          onSave={(_home) => {
                            onSaveHome(property);
                          }}
                          onRemove={(homeId) => {
                            onRemoveSavedHome(homeId);
                          }}
                          onFocus={() => {
                            if (onFocusProperty) {
                              onFocusProperty(property);
                            }
                          }}
                        />
                      </div>
                    );
                  })}
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
              <div className="h-full overflow-y-auto scrollbar-hide space-y-3 px-2">
                {savedHomes.map((home) => {
                  // Convert saved home to HomeDescription format
                  const homeData = {
                    home_id: home.id,
                    description: home.description,
                    image_url: home.imageUrl,
                    price: home.price,
                    bedrooms: home.bedrooms,
                    bathrooms: home.bathrooms,
                    sqft: home.sqft,
                    lot_size: home.lotSize,
                    propertyType: home.propertyType,
                    lat: home.lat || home.latitude,
                    lng: home.lng || home.longitude,
                    address: home.address,
                  };

                  return (
                    <div
                      key={home.id}
                      className={`${
                        selectedProperty?.id === home.id
                          ? "ring-2 ring-brown ring-opacity-50"
                          : ""
                      }`}
                    >
                      {/* Loading overlay */}
                      {isLoadingPropertyDetails &&
                        selectedProperty?.id === home.id && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                            <KeyTurnLoader message="Loading details..." />
                          </div>
                        )}

                      <HomeCard
                        home={homeData}
                        showScore={false}
                        isOnMap={false}
                        isHomeSaved={isHomeSaved}
                        onSave={() => {}}
                        onRemove={(homeId) => onRemoveSavedHome(homeId)}
                        onFocus={() => {
                          if (onFocusProperty) {
                            onFocusProperty(home);
                          }
                        }}
                      />
                    </div>
                  );
                })}
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
  );
}
