import type { VirtuosoHandle } from "react-virtuoso";

import { FEED_ACTION_INTERACTION_CLASS } from "packages/features/feed";
import {
  DesktopReelsView,
  SearchPageMapView,
  SearchPageModals,
  type SearchResult,
} from "packages/features/search";
import { Box } from "packages/ui/components/structure/primitives";
import { MotionView } from "packages/ui/components/system/adapters/motion";

import { IconButton } from "@/components/ui";

export type SearchPageContentProps = {
  searchViewMode: "map" | "reels";
  handleToggleMode: () => void;
  feedScrollRef: React.RefObject<VirtuosoHandle | null>;
  onBeforeSwitchToReels: () => void;
  activeTab: "results" | "saved";
  handleTabChange: (tab: "results" | "saved") => void;
  filteredSearchResults: SearchResult[];
  savedHomes: unknown[];
  currentPage: number;
  setCurrentPage: (n: number) => void;
  onViewPropertyDetails: (p: unknown) => void;
  onNavigateToProperty: (p: unknown) => void;
  isHomeSaved: (p: unknown) => boolean;
  saveHome: (p: unknown) => Promise<void>;
  removeSavedHome: (id: string, addr?: string) => Promise<void>;
  isCarouselCollapsed: boolean;
  setIsCarouselCollapsed: (v: boolean) => void;
  isSearching: boolean;
  hasSearched: boolean;
  searchResults: unknown[];
  searchStage: string;
  mapZoomIn: () => void;
  mapZoomOut: () => void;
  mobileMapRef: React.RefObject<unknown>;
  desktopMapRef: React.RefObject<unknown>;
  setShowPropertyModals: (v: boolean) => void;
  setHasSearched: (v: boolean) => void;
  selectedPropertyId: string | undefined;
  onSearchProperties: () => Promise<void>;
  hasLocations?: boolean;
  onLocationSearchSubmit: () => void | Promise<void>;
  onCancelSearch: () => void;
  selectedClientId: string | null;
  onClientChange: (id: string | null) => void;
  isLoadingPropertyDetails: boolean;
  isLoadingSearchResults: boolean;
  isLoadingIsochrone: boolean;
  isochroneData: unknown;
  selectedProperty: unknown;
  clearSelectedProperty: () => void;
  fitMapToBounds?: (bounds: google.maps.LatLngBounds) => void;
  mapHomeCardsCount?: number;
  showCommuteOverlay?: boolean;
};

export function SearchPageContent({
  searchViewMode,
  handleToggleMode,
  feedScrollRef,
  onBeforeSwitchToReels,
  activeTab,
  handleTabChange,
  filteredSearchResults,
  savedHomes,
  currentPage,
  setCurrentPage,
  onViewPropertyDetails,
  onNavigateToProperty,
  isHomeSaved,
  saveHome,
  removeSavedHome,
  isCarouselCollapsed,
  setIsCarouselCollapsed,
  isSearching,
  hasSearched,
  searchResults,
  searchStage,
  mapZoomIn,
  mapZoomOut,
  mobileMapRef,
  desktopMapRef,
  setShowPropertyModals,
  setHasSearched,
  selectedPropertyId,
  onSearchProperties,
  hasLocations = true,
  onLocationSearchSubmit,
  onCancelSearch,
  selectedClientId,
  onClientChange,
  isLoadingPropertyDetails,
  isLoadingSearchResults,
  isLoadingIsochrone,
  isochroneData,
  selectedProperty,
  clearSelectedProperty,
  fitMapToBounds = () => {
    /* optional legacy page shell */
  },
  mapHomeCardsCount = 1,
  showCommuteOverlay = true,
}: SearchPageContentProps) {
  return (
    <Box className="relative h-full">
      {searchViewMode === "reels" && (
        <Box className="absolute right-4 top-4 z-dock flex items-center md:flex">
          <IconButton
            variant="ghost"
            size="md"
            iconName="search"
            onClick={handleToggleMode}
            label="Back to search"
            className={`bg-overlay-backdrop text-white backdrop-blur-sm ${FEED_ACTION_INTERACTION_CLASS}`}
          />
        </Box>
      )}
      <Box className="relative h-full">
        <Box
          className={`absolute inset-0 h-full ${
            searchViewMode === "map" ? "z-header" : "pointer-events-none invisible z-0"
          }`}
          aria-hidden={searchViewMode !== "map"}
        >
          <SearchPageMapView
            onBeforeSwitchToReels={onBeforeSwitchToReels}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            filteredSearchResults={filteredSearchResults}
            savedHomes={savedHomes}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            onViewPropertyDetails={onViewPropertyDetails}
            onNavigateToProperty={onNavigateToProperty}
            isHomeSaved={isHomeSaved}
            saveHome={saveHome}
            removeSavedHome={removeSavedHome}
            isCarouselCollapsed={isCarouselCollapsed}
            setIsCarouselCollapsed={setIsCarouselCollapsed}
            isSearching={isSearching}
            hasSearched={hasSearched}
            searchResults={searchResults}
            searchStage={searchStage}
            mapZoomIn={mapZoomIn}
            mapZoomOut={mapZoomOut}
            mobileMapRef={mobileMapRef}
            desktopMapRef={desktopMapRef}
            setShowPropertyModals={setShowPropertyModals}
            setHasSearched={setHasSearched}
            selectedPropertyId={selectedPropertyId}
            onSearchProperties={onSearchProperties}
            hasLocations={hasLocations}
            onLocationSearchSubmit={onLocationSearchSubmit}
            onCancelSearch={onCancelSearch}
            selectedClientId={selectedClientId}
            onClientChange={onClientChange}
            isLoadingPropertyDetails={isLoadingPropertyDetails}
            isLoadingSearchResults={isLoadingSearchResults}
            isLoadingIsochrone={isLoadingIsochrone}
            isochroneData={isochroneData}
            fitMapToBounds={fitMapToBounds}
            mapHomeCardsCount={mapHomeCardsCount}
            showCommuteOverlay={showCommuteOverlay}
          />
        </Box>
        <Box
          className={`absolute inset-0 h-full ${
            searchViewMode === "reels" ? "z-header" : "pointer-events-none invisible z-0"
          }`}
          aria-hidden={searchViewMode !== "reels"}
        >
          <MotionView
            key="reels"
            className="h-full"
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <DesktopReelsView
              virtuosoRef={feedScrollRef}
              filteredSearchResults={filteredSearchResults}
              onRunSearch={onSearchProperties}
              isSearching={isSearching}
            />
          </MotionView>
        </Box>
      </Box>
      <SearchPageModals
        selectedProperty={selectedProperty}
        onClosePropertyDetails={clearSelectedProperty}
        isLoadingPropertyDetails={isLoadingPropertyDetails}
      />
    </Box>
  );
}
