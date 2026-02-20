import type { SearchResult } from "packages/schemas/search/search";

import SearchHeader from "@/features/search/header/SearchHeader.web";
import { SidebarList } from "@/features/search/list/SidebarList.web";
import { Tabs } from "@/features/search/list/Tabs.web";

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

  const total =
    activeTab === "results" ? filteredSearchResults.length : savedHomes.length;
  const isLoading =
    (isSearching &&
      !hasSearched &&
      searchResults.length === 0 &&
      savedHomes.length === 0) ||
    (isLoadingSearchResults &&
      searchResults.length === 0 &&
      savedHomes.length === 0) ||
    (isLoadingIsochrone && !isochroneData && !hasSearched);

  const loadingMessage = isSearching
    ? (searchStage ?? "Searching properties...")
    : "Loading map...";
  const loadingVariant = isSearching ? "gray" : "default";

  return (
    <div className="gap-responsive-md hidden h-full md:flex">
      <div className="flex w-64 flex-shrink-0 flex-col">
        <div className="flex h-full flex-col rounded-tr-lg border border-gray-200 bg-white p-4">
          <Tabs
            active={activeTab}
            onChange={handleTabChangeWithSideEffects}
            counts={{
              results: filteredSearchResults.length,
              saved: savedHomes.length,
            }}
          />

          <div className="flex-1 overflow-hidden">
            <SidebarList
              items={
                activeTab === "results" ? filteredSearchResults : savedHomes
              }
              selectedId={selectedPropertyId}
              isLoading={isLoadingPropertyDetails}
              onNavigateToProperty={onNavigateToProperty}
              activeTab={activeTab}
              isHomeSaved={isHomeSaved}
              saveHome={saveHome}
              removeSavedHome={removeSavedHome}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="hidden w-full flex-shrink-0 lg:block">
          <div className="mb-4 flex w-full items-center justify-between">
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
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden rounded-tl-lg border border-gray-200 bg-white">
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
        </div>
      </div>
    </div>
  );
}
