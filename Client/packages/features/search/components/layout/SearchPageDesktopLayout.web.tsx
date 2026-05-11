import type { PreciseStreetAddressPayload } from "packages/features/search/components/header/location-bar/SearchLocationBar.web";
import SearchHeader from "packages/features/search/components/header/SearchHeader.web";
import { SidebarList } from "packages/features/search/components/list/SidebarList.web";
import { Tabs } from "packages/features/search/components/list/Tabs.web";
import type { SearchResult } from "packages/features/search/types";
import { Box } from "packages/ui/components/primitives";

import { SearchPageMapContainer } from "./SearchPageMapContainer.web";

export type SearchPageDesktopLayoutProps = {
  activeTab: "results" | "saved";
  onTabChange: (tab: "results" | "saved") => void;
  filteredSearchResults: SearchResult[];
  savedHomes: SearchResult[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  selectedPropertyId: string | undefined;
  onNavigateToProperty: (property: SearchResult) => void;
  onSearchProperties: () => void | Promise<void>;
  onPreferencesApplySearch?: () => void | Promise<void>;
  hasLocations?: boolean;
  onLocationSearchSubmit: () => void | Promise<void>;
  onCancelSearch: () => void;
  isSearching: boolean;
  selectedClientId: string | null;
  onClientChange: (clientId: string | null) => void;
  desktopMapRef: React.RefObject<HTMLDivElement | null>;
  isLoadingPropertyDetails: boolean;
  isHomeSaved: (id: string, address?: string) => boolean;
  saveHome: (p: SearchResult) => Promise<void>;
  removeSavedHome: (id: string, address?: string) => Promise<void>;
  setShowPropertyModals: (show: boolean) => void;
  setHasSearched: (searched: boolean) => void;
  hasSearched: boolean;
  searchResults: SearchResult[];
  searchStage: string | null;
  isLoadingSearchResults: boolean;
  isLoadingIsochrone: boolean;
  isochroneData: unknown;
  mapZoomIn: () => void;
  mapZoomOut: () => void;
  mode?: "map" | "reels";
  onToggleMode?: () => void;
  onBeforeSwitchToReels?: () => void;
  fitMapToBounds: (bounds: google.maps.LatLngBounds) => void;
  mapHomeCardsCount: number;
  onPreciseStreetAddressSelected?: (payload: PreciseStreetAddressPayload) => void;
  agentShareBundle?: {
    isSelected: (propertyId: string) => boolean;
    onToggle: (propertyId: string) => void;
  };
  agentShareDockVisible?: boolean;
};

export function SearchPageDesktopLayout({
  activeTab,
  onTabChange,
  filteredSearchResults,
  savedHomes,
  currentPage,
  setCurrentPage,
  selectedPropertyId,
  onNavigateToProperty,
  onSearchProperties,
  onPreferencesApplySearch,
  hasLocations = true,
  onLocationSearchSubmit,
  onCancelSearch,
  isSearching,
  selectedClientId,
  onClientChange,
  desktopMapRef,
  isLoadingPropertyDetails,
  isHomeSaved,
  saveHome,
  removeSavedHome,
  setShowPropertyModals,
  setHasSearched,
  hasSearched,
  searchResults,
  searchStage,
  isLoadingSearchResults,
  isLoadingIsochrone,
  isochroneData,
  mapZoomIn,
  mapZoomOut,
  mode,
  onToggleMode,
  onBeforeSwitchToReels,
  fitMapToBounds,
  mapHomeCardsCount,
  onPreciseStreetAddressSelected,
  agentShareBundle,
  agentShareDockVisible = false,
}: SearchPageDesktopLayoutProps): JSX.Element {
  const handleTabChangeWithSideEffects = (tab: "results" | "saved") => {
    onTabChange(tab);
    if (tab === "results" && hasSearched && filteredSearchResults.length > 0) {
      setShowPropertyModals(true);
    } else if (tab === "saved" && savedHomes.length > 0) {
      setShowPropertyModals(true);
      setHasSearched(true);
    }
  };

  const total = activeTab === "results" ? filteredSearchResults.length : savedHomes.length;
  const perPage = mapHomeCardsCount;
  const maxCardStart = Math.max(0, total - perPage);
  const isLoading =
    (isSearching && !hasSearched && searchResults.length === 0 && savedHomes.length === 0) ||
    (isLoadingSearchResults && searchResults.length === 0 && savedHomes.length === 0) ||
    (isLoadingIsochrone && !isochroneData && !hasSearched);

  const loadingMessage = isSearching
    ? (searchStage ?? "Searching properties...")
    : "Loading map...";
  const loadingVariant = isSearching ? "gray" : "default";

  return (
    <Box className="gap-responsive-md hidden h-full md:flex">
      <Box className="border-border flex h-full w-64 flex-shrink-0 flex-col overflow-hidden rounded-tr-lg border">
        <Box className="bg-background-surface shrink-0 px-4 pt-4">
          <Box>
            <Tabs
              active={activeTab}
              onChange={handleTabChangeWithSideEffects}
              counts={{
                results: filteredSearchResults.length,
                saved: savedHomes.length,
              }}
            />
          </Box>
        </Box>

        <Box className="border-border bg-background-surface flex min-h-0 flex-1 flex-col border-t p-4">
          <Box className="flex-1 overflow-hidden">
            <SidebarList
              items={activeTab === "results" ? filteredSearchResults : savedHomes}
              selectedId={selectedPropertyId}
              isLoading={isLoadingPropertyDetails}
              onNavigateToProperty={onNavigateToProperty}
              activeTab={activeTab}
              isHomeSaved={isHomeSaved}
              saveHome={saveHome}
              removeSavedHome={removeSavedHome}
              agentShareBundle={agentShareBundle}
              agentShareDockVisible={agentShareDockVisible}
            />
          </Box>
        </Box>
      </Box>

      <Box className="flex flex-1 flex-col">
        <Box className="z-dropdown relative hidden w-full flex-shrink-0 md:block">
          <Box className="mb-4 flex w-full items-center justify-between">
            <SearchHeader
              onSearchProperties={onSearchProperties}
              onPreferencesApplySearch={onPreferencesApplySearch}
              onLocationSearchSubmit={onLocationSearchSubmit}
              onCancelSearch={onCancelSearch}
              isSearching={isSearching}
              hasLocations={hasLocations}
              selectedClientId={selectedClientId}
              onClientChange={onClientChange}
              mode={mode}
              onToggleMode={onToggleMode}
              onBeforeSwitchToReels={onBeforeSwitchToReels}
              hasSearched={hasSearched}
              fitMapToBounds={fitMapToBounds}
              onPreciseStreetAddressSelected={onPreciseStreetAddressSelected}
            />
          </Box>
        </Box>

        <Box className="border-border bg-background-surface relative flex-1 overflow-hidden rounded-tl-lg border">
          <SearchPageMapContainer
            mapRef={desktopMapRef}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
            loadingVariant={loadingVariant}
            showLoadingWrapper
            page={currentPage}
            total={total}
            perPage={perPage}
            onPrev={() => setCurrentPage(Math.max(0, currentPage - 1))}
            onNext={() => setCurrentPage(Math.min(maxCardStart, currentPage + 1))}
            onZoomIn={mapZoomIn}
            onZoomOut={mapZoomOut}
            disabled={!hasSearched}
            isSearching={isSearching}
            containerClassName="relative h-full w-full"
            mapClassName="h-full w-full rounded-tl-lg"
            mapMinHeight="400px"
            loadingOverlayClassName="rounded-tl-lg"
          />
        </Box>
      </Box>
    </Box>
  );
}
