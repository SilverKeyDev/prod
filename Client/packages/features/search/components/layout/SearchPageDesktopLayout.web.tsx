import SearchHeader from "packages/features/search/components/header/SearchHeader.web";
import { SidebarList } from "packages/features/search/components/list/SidebarList.web";
import { Tabs } from "packages/features/search/components/list/Tabs.web";
import type { SearchResult } from "packages/features/search/types";
import { Box } from "packages/ui/components/primitives";

import { SearchPageMapContainer } from "./SearchPageMapContainer.web";
const PROPERTIES_PER_PAGE = 1;

export type SearchPageDesktopLayoutProps = {
  activeTab: "results" | "saved";
  onTabChange: (tab: "results" | "saved") => void;
  filteredSearchResults: SearchResult[];
  savedHomes: SearchResult[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  selectedPropertyId: string | undefined;
  onNavigateToProperty: (property: SearchResult) => void;
  onPreferencesChanged?: () => void | Promise<void>;
  onSearchProperties: () => void | Promise<void>;
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
  onPreferencesChanged,
  onSearchProperties,
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
      <Box className="flex w-64 flex-shrink-0 flex-col">
        <Box className="border-border bg-background-surface flex h-full flex-col rounded-tr-lg border p-4">
          <Tabs
            active={activeTab}
            onChange={handleTabChangeWithSideEffects}
            counts={{
              results: filteredSearchResults.length,
              saved: savedHomes.length,
            }}
          />

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
            />
          </Box>
        </Box>
      </Box>

      <Box className="flex flex-1 flex-col">
        <Box className="hidden w-full flex-shrink-0 md:block">
          <Box className="mb-4 flex w-full items-center justify-between">
            <SearchHeader
              onPreferencesChanged={onPreferencesChanged}
              onSearchProperties={onSearchProperties}
              onCancelSearch={onCancelSearch}
              isSearching={isSearching}
              selectedClientId={selectedClientId}
              onClientChange={onClientChange}
              mode={mode}
              onToggleMode={onToggleMode}
              onBeforeSwitchToReels={onBeforeSwitchToReels}
              hasSearched={hasSearched}
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
            perPage={PROPERTIES_PER_PAGE}
            onPrev={() => setCurrentPage(Math.max(0, currentPage - 1))}
            onNext={() => setCurrentPage(currentPage + 1)}
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
