import { Icon } from "@ui/icons";

import { PropertyCarousel } from "packages/features/search/components/list/PropertyCarousel";
import { Tabs } from "packages/features/search/components/list/Tabs.web";
import type { SearchResult } from "packages/features/search/types";
import type { SavedHome } from "packages/features/search/types/domain/property";
import { IconButton } from "packages/ui";
import { Box } from "packages/ui/components/primitives";

import { SearchPageMapContainer } from "./SearchPageMapContainer.web";

export type SearchPageMobileLayoutProps = {
  activeTab: "results" | "saved";
  onTabChange: (tab: "results" | "saved") => void;
  filteredSearchResults: SearchResult[];
  savedHomes: SearchResult[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  onViewPropertyDetails: (property: SearchResult) => void | Promise<void>;
  onNavigateToProperty?: (property: SearchResult) => void;
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
  mapHomeCardsCount: number;
};

export function SearchPageMobileLayout({
  activeTab,
  onTabChange,
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
  setShowPropertyModals,
  setHasSearched,
  mapHomeCardsCount,
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
  const perPage = mapHomeCardsCount;
  const maxCardStart = Math.max(0, total - perPage);
  const isLoading = isSearching && !hasSearched && searchResults.length === 0;

  return (
    <Box className="flex h-full flex-col md:hidden">
      <Box className="border-border bg-background-surface flex-shrink-0 border-b">
        <Box className="border-border flex items-center justify-center border-b">
          <Tabs
            active={activeTab}
            onChange={handleTabChangeWithSideEffects}
            counts={{
              results: filteredSearchResults.length,
              saved: savedHomes.length,
            }}
            compact
          />

          <Box className="ml-4 px-2">
            <IconButton
              onClick={() => setIsCarouselCollapsed(!isCarouselCollapsed)}
              variant="ghost"
              size="sm"
              rounded="full"
              label={isCarouselCollapsed ? "Expand carousel" : "Collapse carousel"}
              icon={
                isCarouselCollapsed ? (
                  <Icon name="chevron-down" className="h-4 w-4" />
                ) : (
                  <Icon name="chevron-up" className="h-4 w-4" />
                )
              }
            />
          </Box>
        </Box>

        <Box
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isCarouselCollapsed ? "max-h-0" : "max-h-[45vh]"
          }`}
        >
          <Box className="py-3">
            <PropertyCarousel
              items={activeTab === "results" ? filteredSearchResults : savedHomes}
              currentPage={currentPage}
              onViewDetails={onViewPropertyDetails}
              onNavigateToProperty={onNavigateToProperty}
              onSlideChange={(index) => setCurrentPage(index)}
              infiniteLoop={false}
              activeTab={activeTab}
              isHomeSaved={isHomeSaved}
              saveHome={saveHomeAdapter}
              removeSavedHome={removeSavedHome}
            />
          </Box>
        </Box>
      </Box>

      <Box className="relative flex-1">
        <SearchPageMapContainer
          mapRef={mobileMapRef}
          isLoading={isLoading}
          loadingMessage={searchStage ?? "Searching properties..."}
          loadingVariant="gray"
          showLoadingWrapper={false}
          page={currentPage}
          total={total}
          perPage={perPage}
          onPrev={() => setCurrentPage(Math.max(0, currentPage - 1))}
          onNext={() => setCurrentPage(Math.min(maxCardStart, currentPage + 1))}
          onZoomIn={mapZoomIn}
          onZoomOut={mapZoomOut}
          disabled={!hasSearched}
          isSearching={isSearching}
        />
      </Box>
    </Box>
  );
}
