import { useSearchViewStore } from "packages/store";
import { MotionView } from "packages/ui/components/adapters/motion";

import type { SearchResult } from "@/features/search/types";
import type { SavedHome } from "@/features/search/types/property";

import { SearchPageDesktopLayout } from "./SearchPageDesktopLayout.web";
import { SearchPageMobileLayout } from "./SearchPageMobileLayout.web";

export type SearchPageMapViewProps = {
  activeTab: "results" | "saved";
  onTabChange: (tab: "results" | "saved") => void;
  filteredSearchResults: SearchResult[];
  savedHomes: SearchResult[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  onViewPropertyDetails: (property: SearchResult) => void | Promise<void>;
  onNavigateToProperty: (property: SearchResult) => void;
  isHomeSaved: (id: string, address?: string) => boolean;
  saveHome: (p: SearchResult | SavedHome) => Promise<void>;
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
  desktopMapRef: React.RefObject<HTMLDivElement | null>;
  setShowPropertyModals: (show: boolean) => void;
  setHasSearched: (searched: boolean) => void;
  selectedPropertyId: string | undefined;
  onPreferencesChanged?: () => void | Promise<void>;
  onSearchProperties: () => void | Promise<void>;
  onCancelSearch: () => void;
  selectedClientId: string | null;
  onClientChange: (clientId: string | null) => void;
  isLoadingPropertyDetails: boolean;
  isLoadingSearchResults: boolean;
  isLoadingIsochrone: boolean;
  isochroneData: unknown;
  /** Called before switching to Reels - use to set anchor from map selection */
  onBeforeSwitchToReels?: () => void;
};

export function SearchPageMapView({
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
  desktopMapRef,
  setShowPropertyModals,
  setHasSearched,
  selectedPropertyId,
  onPreferencesChanged,
  onSearchProperties,
  onCancelSearch,
  selectedClientId,
  onClientChange,
  isLoadingPropertyDetails,
  isLoadingSearchResults,
  isLoadingIsochrone,
  isochroneData,
  onBeforeSwitchToReels,
}: SearchPageMapViewProps): JSX.Element {
  const mode = useSearchViewStore((s) => s.mode);
  const toggleMode = useSearchViewStore((s) => s.toggleMode);

  const handleToggleMode = () => {
    if (mode === "map") {
      onBeforeSwitchToReels?.();
    }
    toggleMode();
  };

  const saveHomeForSidebar = async (p: SearchResult) => {
    await saveHome(p as SearchResult);
  };

  return (
    <MotionView
      key="map"
      className="h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <SearchPageMobileLayout
        activeTab={activeTab}
        onTabChange={onTabChange}
        filteredSearchResults={filteredSearchResults}
        savedHomes={savedHomes}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onViewPropertyDetails={onViewPropertyDetails}
        isHomeSaved={isHomeSaved}
        saveHome={saveHomeForSidebar}
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
        setShowPropertyModals={setShowPropertyModals}
        setHasSearched={setHasSearched}
      />

      <SearchPageDesktopLayout
        activeTab={activeTab}
        onTabChange={onTabChange}
        filteredSearchResults={filteredSearchResults}
        savedHomes={savedHomes}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        selectedPropertyId={selectedPropertyId}
        onNavigateToProperty={onNavigateToProperty}
        onPreferencesChanged={onPreferencesChanged}
        onSearchProperties={onSearchProperties}
        onCancelSearch={onCancelSearch}
        isSearching={isSearching}
        selectedClientId={selectedClientId}
        onClientChange={onClientChange}
        desktopMapRef={desktopMapRef}
        isLoadingPropertyDetails={isLoadingPropertyDetails}
        isHomeSaved={isHomeSaved}
        saveHome={saveHomeForSidebar}
        removeSavedHome={removeSavedHome}
        setShowPropertyModals={setShowPropertyModals}
        setHasSearched={setHasSearched}
        hasSearched={hasSearched}
        searchResults={searchResults}
        searchStage={searchStage}
        isLoadingSearchResults={isLoadingSearchResults}
        isLoadingIsochrone={isLoadingIsochrone}
        isochroneData={isochroneData}
        mapZoomIn={mapZoomIn}
        mapZoomOut={mapZoomOut}
        mode={mode}
        onToggleMode={handleToggleMode}
        onBeforeSwitchToReels={onBeforeSwitchToReels}
      />
    </MotionView>
  );
}
