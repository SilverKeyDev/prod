import { ChevronLeft, ChevronRight } from "lucide-react";
import KeyTurnLoader from "../base/KeyTurnLoader";

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
  _score?: number;
}

interface SearchMapProps {
  // Map state
  isMapReady: boolean;
  isSearching: boolean;
  searchStage: string;
  mapRef: React.RefObject<HTMLDivElement>;
  
  // Data
  searchResults: SearchResult[];
  savedHomes: SearchResult[];
  activeTab: "results" | "saved";
  currentPage: number;
  hasSearched: boolean;
  
  // Functions
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPageChange: (page: number) => void;
  
  // Mobile specific
  isMobile: boolean;
}

export default function SearchMap({
  isMapReady,
  isSearching,
  searchStage,
  mapRef,
  searchResults,
  savedHomes,
  activeTab,
  currentPage,
  hasSearched,
  onZoomIn,
  onZoomOut,
  onPageChange,
  isMobile,
}: SearchMapProps) {
  const PROPERTIES_PER_PAGE = 1;

  const containerClasses = "w-full h-full relative rounded-lg overflow-hidden";
  const mapClasses = "w-full h-full relative";
  const mapRefClasses = "w-full h-full min-h-0";
  const skeletonClasses = "absolute inset-0 z-20 w-full h-full bg-gray-50";
  const loadingOverlayClasses = "absolute inset-0 z-30 w-full h-full flex items-center justify-center bg-black/20 backdrop-blur-sm";

  return (
    <div className={containerClasses} style={{ width: '100%', height: '100%' }}>
      {/* Map skeleton loading state */}
      {!isMapReady && (
        <div className={skeletonClasses}>
          {/* Map skeleton */}
          <div className="w-full h-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse"></div>
            <div className={`absolute top-4 left-4 ${isMobile ? 'w-24 h-6' : 'w-32 h-8'} bg-white/80 rounded animate-pulse`}></div>
            <div className={`absolute top-4 right-4 ${isMobile ? 'w-16 h-4' : 'w-24 h-6'} bg-white/80 rounded animate-pulse`}></div>
            <div className={`absolute bottom-4 left-4 ${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-white/80 rounded animate-pulse`}></div>
            {!isMobile && (
              <div className="absolute bottom-4 right-4 w-20 h-8 bg-white/80 rounded animate-pulse"></div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <KeyTurnLoader message="Loading map..." />
            </div>
          </div>
        </div>
      )}

      {/* Search loading overlay - Only show when actively searching */}
      {isSearching && (
        <div className={loadingOverlayClasses}>
          <div className={`flex flex-col items-center ${isMobile ? 'gap-responsive-sm' : 'gap-4'} bg-white/95 ${isMobile ? 'p-4' : 'p-6'} rounded-lg shadow-lg`}>
            <KeyTurnLoader
              message={searchStage || "Searching properties..."}
            />
          </div>
        </div>
      )}

      {/* Map container */}
      <div className={mapClasses} style={{ width: '100%', height: '100%' }}>
        <div
          ref={mapRef}
          className={mapRefClasses}
          style={{ width: '100%', height: '100%' }}
        />

        {/* Zoom Controls - Desktop only */}
        {!isMobile && !isSearching && (
          <div className="absolute bottom-12 left-8 flex flex-row gap-1 z-10">
            <button
              onClick={onZoomIn}
              className="w-8 h-8 lg:w-10 lg:h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 cursor-zoom"
              title="Zoom in"
            >
              <span className="text-sm lg:text-lg font-bold leading-none">
                +
              </span>
            </button>
            <button
              onClick={onZoomOut}
              className="w-8 h-8 lg:w-10 lg:h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 hover:text-brown hover:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 cursor-zoom"
              title="Zoom out"
            >
              <span className="text-sm lg:text-lg font-bold leading-none">
                −
              </span>
            </button>
          </div>
        )}

        {/* Property Pagination Controls - Desktop only */}
        {!isMobile && !isSearching &&
          hasSearched &&
          (activeTab === "results"
            ? searchResults.length > PROPERTIES_PER_PAGE
            : savedHomes.length > PROPERTIES_PER_PAGE) && (
            <div className="absolute bottom-12 right-8 flex flex-row gap-1 z-10">
              <button
                onClick={() =>
                  onPageChange(Math.max(0, currentPage - 1))
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
                    : savedHomes.length
                )}{" "}
                of{" "}
                {activeTab === "results"
                  ? searchResults.length
                  : savedHomes.length}
              </div>
              <button
                onClick={() => onPageChange(currentPage + 1)}
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
      </div>
    </div>
  );
}
