/// <reference types="google.maps" />
import React from "react";

import Button from "@ui/button/Button";

import { DesktopReelsView } from "packages/features/search";
import type { SearchResult } from "packages/features/search/types";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations";
import { Box, Text } from "packages/ui/components/primitives";
import { HEADER_ROW_HEIGHT } from "packages/ui/constants/layout";

import { SearchDisplaySheetNative } from "./header/display/SearchDisplaySheet.native";
import { SearchFiltersSheet } from "./header/filters/SearchFiltersSheet";
import { SearchPageMapView } from "./layout/SearchPageMapView";

export type SearchScreenBodyProps = {
  mode: "map" | "reels";
  toggleMode: () => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  filtersSheetOpen: boolean;
  setFiltersSheetOpen: (open: boolean) => void;
  displaySheetOpen: boolean;
  setDisplaySheetOpen: (open: boolean) => void;
  headerBtnClass: string;
  criteriaSummary: string;
  isSearching: boolean;
  handleSearchPress: () => void;
  handleCancelSearch: () => void;
  runSearch: () => void | Promise<void>;
  runMapAreaSearch: () => void | Promise<void>;
  activeTab: "results" | "saved";
  handleTabChange: (tab: "results" | "saved") => void;
  filteredSearchResults: SearchResult[];
  savedHomes: SearchResult[];
  currentPage: number;
  setCurrentPage: (n: number) => void;
  handleViewPropertyDetails: (property: SearchResult) => void;
  saveHome: (p: SearchResult) => Promise<void>;
  removeSavedHome: (id: string, address?: string) => Promise<void>;
  isHomeSaved: (id: string, address?: string) => boolean;
  searchResults: SearchResult[];
  searchStage: string | null;
  hasSearched: boolean;
  setHasSearched: (v: boolean) => void;
  isLoadingPropertyDetails: boolean;
  isLoadingSearchResults: boolean;
  isLoadingIsochrone: boolean;
  displayIsochroneData: unknown;
  showCommuteOverlay: boolean;
  mapHomeCardsCount: number;
  hasLocations: boolean;
  fitMapBoundsForNative: (bounds: google.maps.LatLngBounds) => void;
};

export function SearchScreenBody({
  mode,
  toggleMode,
  selectedClientId,
  setSelectedClientId,
  filtersSheetOpen,
  setFiltersSheetOpen,
  displaySheetOpen,
  setDisplaySheetOpen,
  headerBtnClass,
  criteriaSummary,
  isSearching,
  handleSearchPress,
  handleCancelSearch,
  runSearch,
  runMapAreaSearch,
  activeTab,
  handleTabChange,
  filteredSearchResults,
  savedHomes,
  currentPage,
  setCurrentPage,
  handleViewPropertyDetails,
  saveHome,
  removeSavedHome,
  isHomeSaved,
  searchResults,
  searchStage,
  hasSearched,
  setHasSearched,
  isLoadingPropertyDetails,
  isLoadingSearchResults,
  isLoadingIsochrone,
  displayIsochroneData,
  showCommuteOverlay,
  mapHomeCardsCount,
  hasLocations,
  fitMapBoundsForNative,
}: SearchScreenBodyProps): React.ReactElement {
  return (
    <Box className="flex-1">
      <Box className="gap-2 px-4 py-3">
        <Box className={`flex-row flex-wrap items-center gap-2 ${HEADER_ROW_HEIGHT}`}>
          <Button
            variant="cancel"
            size="sm"
            iconName="sliders-horizontal"
            onPress={() => setFiltersSheetOpen(true)}
            className={headerBtnClass}
          >
            {SEARCH_TRANSLATIONS["search.filters"] ?? "Filters"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="grid-3x3"
            onPress={() => setDisplaySheetOpen(true)}
            className={headerBtnClass}
          >
            {SEARCH_TRANSLATIONS["search.display"] ?? "Display"}
          </Button>
          <Button
            variant="tertiary"
            size="sm"
            iconName={isSearching ? undefined : "search"}
            loading={isSearching}
            onPress={handleSearchPress}
            className={headerBtnClass}
          >
            {isSearching
              ? (SEARCH_TRANSLATIONS["search.searching"] ?? "Searching...")
              : (SEARCH_TRANSLATIONS["search.search"] ?? "Search")}
          </Button>
          {isSearching ? (
            <Button
              variant="ghost"
              size="sm"
              onPress={handleCancelSearch}
              className={headerBtnClass}
              iconName="x"
            >
              {SEARCH_TRANSLATIONS["common.cancel"] ?? "Cancel"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              iconName={mode === "map" ? "video" : "map"}
              onPress={toggleMode}
              className={headerBtnClass}
            >
              {mode === "map"
                ? (SEARCH_TRANSLATIONS["search.reels"] ?? "Reels")
                : (SEARCH_TRANSLATIONS["search.map"] ?? "Map")}
            </Button>
          )}
        </Box>
        <Box
          className={`border-border bg-background-surface min-h-0 flex-row items-center gap-2 overflow-hidden rounded-lg border px-3 ${HEADER_ROW_HEIGHT}`}
        >
          <Box className="min-h-0 min-w-0 flex-1 justify-center py-2">
            <Text className="text-text-secondary truncate text-sm" numberOfLines={1}>
              {criteriaSummary || " "}
            </Text>
          </Box>
        </Box>
        <Box className={`flex-row flex-wrap items-center justify-end gap-2 ${HEADER_ROW_HEIGHT}`}>
          <Button
            variant="outline"
            size="sm"
            onPress={() => void runMapAreaSearch()}
            loading={isSearching}
            disabled={isSearching}
            className={headerBtnClass}
            iconName="search"
          >
            {SEARCH_TRANSLATIONS["search.search"] ?? "Search"}
          </Button>
        </Box>
      </Box>
      <SearchFiltersSheet
        open={filtersSheetOpen}
        onClose={() => setFiltersSheetOpen(false)}
        onApply={() => {}}
        selectedClientId={selectedClientId}
        onClientChange={setSelectedClientId}
      />
      <SearchDisplaySheetNative
        open={displaySheetOpen}
        onClose={() => setDisplaySheetOpen(false)}
      />

      {mode === "map" ? (
        <SearchPageMapView
          activeTab={activeTab}
          onTabChange={handleTabChange}
          filteredSearchResults={filteredSearchResults}
          savedHomes={savedHomes}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          onViewPropertyDetails={handleViewPropertyDetails}
          onNavigateToProperty={() => {}}
          isHomeSaved={isHomeSaved}
          saveHome={async (p) => {
            await saveHome(p);
          }}
          removeSavedHome={async (id, address) => {
            await removeSavedHome(id, address);
          }}
          isCarouselCollapsed={false}
          setIsCarouselCollapsed={() => {}}
          isSearching={isSearching}
          hasSearched={hasSearched}
          searchResults={searchResults}
          searchStage={searchStage}
          mapZoomIn={() => {}}
          mapZoomOut={() => {}}
          mobileMapRef={{ current: null }}
          desktopMapRef={{ current: null }}
          setShowPropertyModals={() => {}}
          setHasSearched={setHasSearched}
          selectedPropertyId={undefined}
          hasLocations={hasLocations}
          onSearchProperties={runSearch}
          onLocationSearchSubmit={() => void runMapAreaSearch()}
          onCancelSearch={handleCancelSearch}
          selectedClientId={selectedClientId}
          onClientChange={setSelectedClientId}
          isLoadingPropertyDetails={isLoadingPropertyDetails}
          isLoadingSearchResults={isLoadingSearchResults}
          isLoadingIsochrone={isLoadingIsochrone}
          isochroneData={displayIsochroneData}
          fitMapToBounds={fitMapBoundsForNative}
          showCommuteOverlay={showCommuteOverlay}
          mapHomeCardsCount={mapHomeCardsCount}
        />
      ) : (
        <DesktopReelsView
          filteredSearchResults={filteredSearchResults}
          onRunSearch={runSearch}
          isSearching={isSearching}
        />
      )}
    </Box>
  );
}
