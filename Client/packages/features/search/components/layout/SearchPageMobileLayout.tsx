import { ChevronDown, ChevronUp } from "lucide-react";

import { PropertyCarousel } from "packages/features/search/components/list/PropertyCarousel";
import { Tabs } from "packages/features/search/components/list/Tabs.web";
import type { SearchResult } from "packages/features/search/types";
import type { SavedHome } from "packages/features/search/types/property";
import IconButton from "packages/ui/components/button/IconButton";

import { SearchPageMapContainer } from "./SearchPageMapContainer.web";

const PROPERTIES_PER_PAGE = 1;

export type SearchPageMobileLayoutProps = {
  activeTab: "results" | "saved";
  onTabChange: (tab: "results" | "saved") => void;
  filteredSearchResults: SearchResult[];
  savedHomes: SearchResult[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  onViewPropertyDetails: (property: SearchResult) => void | Promise<void>;
  isHomeSaved: (id: string, address?: string) => boolean;
  saveHome: (p: SearchResult) => Promise<void>;
  removeSavedHome: (id: string, address?: string) => Promise<void>;
  isCarouselCollapsed: boolean;
  setIsCarouselCollapsed: (collapsed: boolean) => void;
  isSearching: boolean;
  hasSearched: boolean;
  searchResults: SearchResult[];
  searchStage: string | null;
  mapZoomIn: () => void;
  mapZoomOut: () => void;
  mobileMapRef: React.RefObject<HTMLDivElement | null>;
  setShowPropertyModals: (show: boolean) => void;
  setHasSearched: (searched: boolean) => void;
};

export function SearchPageMobileLayout({
  activeTab,
  onTabChange,
  filteredSearchResults,
  savedHomes,
  currentPage,
  setCurrentPage,
  onViewPropertyDetails,
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
  setShowPropertyModals,
  setHasSearched,
}: SearchPageMobileLayoutProps): JSX.Element {
  const handleTabChangeWithSideEffects = (tab: "results" | "saved") => {
    onTabChange(tab);
    if (tab === "results" && hasSearched && filteredSearchResults.length > 0) {
      setShowPropertyModals(true);
    } else if (tab === "saved" && savedHomes.length > 0) {
      setShowPropertyModals(true);
      setHasSearched(true);
    }
  };

  const saveHomeAdapter = async (p: SearchResult) => {
    const priceString = p.price != null ? String(p.price) : "";
    const savedHome: SavedHome = {
      home_id: p.id,
      address: p.address,
      price: priceString,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      sqft: p.sqft,
      lat: p.lat,
      lng: p.lng,
      lot_size: p.lotSize,
      image_url: p.imageUrl,
    };
    await saveHome(savedHome);
  };

  const total = activeTab === "results" ? filteredSearchResults.length : savedHomes.length;
  const isLoading = isSearching && !hasSearched && searchResults.length === 0;

  return (
    <div className="flex h-full flex-col md:hidden">
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-center border-b border-gray-200">
          <Tabs
            active={activeTab}
            onChange={handleTabChangeWithSideEffects}
            counts={{
              results: filteredSearchResults.length,
              saved: savedHomes.length,
            }}
            compact
          />

          <div className="ml-4 px-2">
            <IconButton
              onClick={() => setIsCarouselCollapsed(!isCarouselCollapsed)}
              variant="ghost"
              size="sm"
              rounded="full"
              label={isCarouselCollapsed ? "Expand carousel" : "Collapse carousel"}
              icon={
                isCarouselCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )
              }
            />
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isCarouselCollapsed ? "max-h-0" : "max-h-[45vh]"
          }`}
        >
          <div className="py-3">
            <PropertyCarousel
              items={activeTab === "results" ? filteredSearchResults : savedHomes}
              currentPage={currentPage}
              onViewDetails={onViewPropertyDetails}
              onSlideChange={(index) => setCurrentPage(index)}
              infiniteLoop={false}
              activeTab={activeTab}
              isHomeSaved={isHomeSaved}
              saveHome={saveHomeAdapter}
              removeSavedHome={removeSavedHome}
            />
          </div>
        </div>
      </div>

      <div className="relative flex-1">
        <SearchPageMapContainer
          mapRef={mobileMapRef}
          isLoading={isLoading}
          loadingMessage={searchStage ?? "Searching properties..."}
          loadingVariant="gray"
          showLoadingWrapper={false}
          page={currentPage}
          total={total}
          perPage={PROPERTIES_PER_PAGE}
          onPrev={() => setCurrentPage(Math.max(0, currentPage - 1))}
          onNext={() => setCurrentPage(currentPage + 1)}
          onZoomIn={mapZoomIn}
          onZoomOut={mapZoomOut}
          disabled={!hasSearched}
          isSearching={isSearching}
        />
      </div>
    </div>
  );
}
