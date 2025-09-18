import React from "react";

import type { PropertyDetails } from "../../../../core/schemas/search";
import { PropertyCarousel } from "./PropertyCarousel";
import { Tabs } from "./../Tabs";
import KeyTurnLoader from "../../../../components/ui/loading/KeyTurnLoader";

import SearchMapContainer from "./../SearchMapContainer";

export type MobileSearchLayoutProps = {
  /** Search results to display */
  searchResults: PropertyDetails[];
  /** Saved homes to display */
  savedHomes: PropertyDetails[];
  /** Normalized set of saved addresses for cross-checking saved state */
  savedAddresses?: Set<string>;
  /** Current active tab */
  activeTab: "results" | "saved";
  /** Current page number */
  currentPage: number;
  /** Whether search has been performed */
  hasSearched: boolean;
  /** Current search stage */
  searchStage?: string;
  /** Whether to show property modals */
  showPropertyModals: boolean;
  /** Whether carousel is collapsed */
  isCarouselCollapsed: boolean;
  /** Whether localStorage is loaded */
  isLocalStorageLoaded: boolean;
  /** Whether map is ready (isochrone and markers rendered) */
  isMapReady: boolean;
  /** Whether to show loading overlay */
  shouldShowLoadingOverlay: boolean;
  /** Function to get loading message */
  getLoadingMessage: () => string;
  /** Callback when map is ready */
  onMapReady: () => void;
  /** Callback when property details are requested */
  onViewPropertyDetails: (property: PropertyDetails) => void;
  /** Callback when search is initiated */
  onSearch: () => void;
  /** Callback when tab changes */
  onTabChange: (tab: "results" | "saved") => void;
  /** Callback when carousel toggle is requested */
  onToggleCarousel: () => void;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Properties per page */
  perPage?: number;
  /** Whether a home is saved */
  isHomeSaved: (id: string) => boolean;
  /** Save home handler */
  onSaveHome: (property: PropertyDetails) => void;
  /** Remove saved home handler */
  onRemoveSavedHome: (propertyId: string) => void;
  /** Map reference */
  mapRef: React.RefObject<HTMLDivElement>;
};

export default function MobileSearchLayout({
  searchResults,
  savedHomes,
  savedAddresses,
  activeTab,
  currentPage,
  hasSearched,
  showPropertyModals,
  isCarouselCollapsed,
  shouldShowLoadingOverlay,
  getLoadingMessage,
  onMapReady,
  onViewPropertyDetails,
  onTabChange,
  onToggleCarousel,
  perPage = 1,
  isHomeSaved,
  onSaveHome,
  onRemoveSavedHome,
  mapRef,
}: MobileSearchLayoutProps) {
  const handleTabChange = (tab: "results" | "saved") => {
    onTabChange(tab);
    // Legacy behavior: The parent component (SearchPage) handles the tab change logic
    // including setting showPropertyModals and hasSearched appropriately
  };

  return (
    <div className="flex h-full flex-col md:hidden">
      {/* Mobile Carousel for Properties */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        {/* Tab Navigation */}
        <Tabs
          active={activeTab}
          onChange={handleTabChange}
          counts={{ results: searchResults.length, saved: savedHomes.length }}
          compact
          isCarouselCollapsed={isCarouselCollapsed}
          onToggleCarousel={onToggleCarousel}
        />

        {/* Mobile Property Carousel */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isCarouselCollapsed ? "max-h-0 py-0" : "max-h-96 py-4"
          } flex justify-center`}
        >
          <PropertyCarousel
            items={activeTab === "results" ? searchResults : savedHomes}
            perPage={perPage}
            currentPage={currentPage}
            isHomeSaved={isHomeSaved}
            savedAddresses={savedAddresses}
            onSave={onSaveHome}
            onViewDetails={onViewPropertyDetails}
            onRemoveSavedHome={onRemoveSavedHome}
            activeTab={activeTab}
          />
        </div>
      </div>

      {/* Mobile Map - Takes majority of screen */}
      <div className="relative flex-1">
        {/* Loading overlay - centralized logic from SearchPage */}
        {shouldShowLoadingOverlay && (
          <div className="absolute inset-0 z-20 flex h-full w-full items-center justify-center bg-gray-50">
            <div className="gap-responsive-sm flex flex-col items-center">
              <KeyTurnLoader message={getLoadingMessage()} />
            </div>
          </div>
        )}

        {/* Map container - always render but show loading overlay when not ready */}
        <SearchMapContainer
          mapRef={mapRef}
          isMobile={true}
          searchResults={searchResults}
          savedHomes={savedHomes}
          activeTab={activeTab}
          currentPage={currentPage}
          hasSearched={hasSearched}
          showPropertyModals={showPropertyModals}
          onMapReady={onMapReady}
          perPage={perPage}
        />
      </div>
    </div>
  );
}
