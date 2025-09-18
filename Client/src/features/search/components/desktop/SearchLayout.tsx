import React from "react";
import useMobile from "../../../../core/hooks/ui/useMobile";

import type { PropertyDetails } from "../../../../core/schemas/search";
import { SidebarList } from "./SidebarList";
import SearchHeader from "../SearchHeader";
import { Tabs } from "../Tabs";
import { PropertyCarousel } from "../mobile/PropertyCarousel";
import KeyTurnLoader from "../../../../components/ui/loading/KeyTurnLoader";

import SearchMapContainer from "../SearchMapContainer";

export type DesktopSearchLayoutProps = {
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
  /** Selected property for details */
  selectedProperty?: any;
  /** Whether property details are loading */
  isLoadingPropertyDetails: boolean;
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
  /** Callback when preferences are updated */
  onUpdatePreferences: () => void;
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

export default function DesktopSearchLayout({
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
  selectedProperty,
  isLoadingPropertyDetails,
  onViewPropertyDetails,
  onSearch,
  onTabChange,
  onToggleCarousel,
  onPageChange,
  onUpdatePreferences,
  perPage = 1,
  isHomeSaved,
  onSaveHome,
  onRemoveSavedHome,
  mapRef,
}: DesktopSearchLayoutProps) {
  const isMobile = useMobile("(max-width: 1024px)");
  const handleTabChange = (tab: "results" | "saved") => {
    onTabChange(tab);
    if (tab === "results" && hasSearched && searchResults.length > 0) {
      // This would need to be handled by parent component
    } else if (tab === "saved" && savedHomes.length > 0) {
      // This would need to be handled by parent component
    }
  };

  const handlePropertyFocus = (property: PropertyDetails) => {
    const currentData = activeTab === "results" ? searchResults : savedHomes;
    const propertyIndex = currentData.findIndex((p) => p.id === property.id);
    if (propertyIndex !== -1) {
      onPageChange(propertyIndex);
    }
  };

  return (
    <div className="gap-responsive-md flex h-full">
      {/* Sidebar - hidden on <= 1024px via isMobile */}
      {!isMobile && (
        <div className="flex w-64 flex-shrink-0 flex-col">
          <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white p-4">
            {/* Tab Navigation */}
            <Tabs
              active={activeTab}
              onChange={handleTabChange}
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
                savedAddresses={savedAddresses}
                onSave={onSaveHome}
                removeSavedHome={onRemoveSavedHome}
                onPropertyFocus={handlePropertyFocus}
                activeTab={activeTab}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Search Header - hidden on <= 1024px via isMobile */}
        {!isMobile && (
          <div>
            <SearchHeader
              onUpdatePreferences={onUpdatePreferences}
              onSearchProperties={onSearch}
            />
          </div>
        )}

        {/* Mobile Carousel - shown on <= 1024px via isMobile */}
        {isMobile && (
          <div className="flex-shrink-0 border-b border-gray-200 bg-white">
            {/* Tab Navigation */}
            <Tabs
              active={activeTab}
              onChange={handleTabChange}
              counts={{
                results: searchResults.length,
                saved: savedHomes.length,
              }}
              isCarouselCollapsed={isCarouselCollapsed}
              onToggleCarousel={onToggleCarousel}
              compact
            />

            {/* Property Carousel */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isCarouselCollapsed ? "max-h-0 py-0" : "max-h-96 py-4"
              }`}
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
        )}

        {/* Desktop Map - Takes remaining height */}
        <div className="relative flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white">
          {/* Loading overlay - centralized logic from SearchPage */}
          {shouldShowLoadingOverlay && (
            <div className="absolute inset-0 z-20 flex h-full w-full items-center justify-center rounded-lg bg-gray-50">
              <div className="flex flex-col items-center gap-4">
                <KeyTurnLoader message={getLoadingMessage()} />
              </div>
            </div>
          )}

          {/* Map container - always render but show loading overlay when not ready */}
          <div className="relative h-full w-full">
            <SearchMapContainer
              mapRef={mapRef}
              isMobile={isMobile}
              searchResults={searchResults}
              savedHomes={savedHomes}
              activeTab={activeTab}
              currentPage={currentPage}
              hasSearched={hasSearched}
              showPropertyModals={showPropertyModals}
              onMapReady={onMapReady}
              perPage={perPage}
              savedAddresses={savedAddresses}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
