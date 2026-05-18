import React, { useEffect, useMemo } from "react";

import IconButton from "@ui/button/IconButton";

import SearchMobileHeader from "packages/features/search/components/header/SearchMobileHeader";
import { SearchPageMapView } from "packages/features/search/components/layout/SearchPageMapView";
import { SearchPageModals } from "packages/features/search/components/layout/SearchPageModals";
import { DesktopReelsView } from "packages/features/search/components/reels/DesktopReelsView";
import { useSearchFeatureController } from "packages/features/search/hooks/ui/useSearchFeatureController";
import { MotionView } from "packages/ui/components/adapters/motion";
import { Box } from "packages/ui/components/primitives";

import { SearchFeatureAgentShareMount } from "./SearchFeatureAgentShareMount.web";

type SearchFeatureProps = {
  setMobileHeaderActions: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
  onSearchProperties?: () => Promise<void>;
  searchRef?: React.MutableRefObject<{
    triggerSearch: () => Promise<void>;
  } | null>;
};

export function SearchFeature({
  setMobileHeaderActions,
  onSearchProperties,
  searchRef,
}: SearchFeatureProps) {
  const c = useSearchFeatureController({
    setMobileHeaderActions,
    onSearchProperties,
    searchRef,
  });

  const mobileHeaderNode = useMemo(
    () =>
      c.isCompactHeader && c.searchViewMode === "map" ? (
        <SearchMobileHeader {...c.headerProps} />
      ) : null,
    [c.isCompactHeader, c.headerProps, c.searchViewMode]
  );

  useEffect(() => {
    setMobileHeaderActions(mobileHeaderNode);
    return () => setMobileHeaderActions(null);
  }, [mobileHeaderNode, setMobileHeaderActions]);

  return (
    <Box className="relative h-full">
      {c.searchViewMode === "reels" && (
        <Box className="z-dock absolute right-4 top-4 flex items-center md:flex">
          <IconButton
            variant="ghost"
            size="md"
            iconName="search"
            onClick={c.handleToggleMode}
            label="Back to search"
            className={`bg-black/40 text-white backdrop-blur-sm ${c.FEED_ACTION_INTERACTION_CLASS}`}
          />
        </Box>
      )}

      <Box className="relative h-full">
        <Box
          className={`absolute inset-0 h-full ${
            c.searchViewMode === "map" ? "z-header" : "pointer-events-none invisible z-0"
          }`}
          aria-hidden={c.searchViewMode !== "map"}
        >
          <SearchPageMapView
            onBeforeSwitchToReels={c.handlers.handleBeforeSwitchToReels}
            activeTab={c.activeTab}
            onTabChange={c.handleTabChange}
            filteredSearchResults={c.filteredSearchResults}
            savedHomes={c.savedHomes}
            currentPage={c.currentPage}
            setCurrentPage={c.setCurrentPage}
            onViewPropertyDetails={c.handleViewPropertyDetails}
            onNavigateToProperty={c.handlers.handleNavigateToProperty}
            isHomeSaved={c.isHomeSaved}
            saveHome={async (p) => {
              await c.saveHome(p);
            }}
            removeSavedHome={async (id, addr) => {
              await c.removeSavedHome(id, addr);
            }}
            isCarouselCollapsed={c.isCarouselCollapsed}
            setIsCarouselCollapsed={c.setIsCarouselCollapsed}
            isSearching={c.isSearching}
            hasSearched={c.hasSearched}
            searchResults={c.searchResults}
            searchStage={c.searchStage}
            mapZoomIn={c.map.mapZoomIn}
            mapZoomOut={c.map.mapZoomOut}
            mobileMapRef={c.map.mobileMapRef}
            desktopMapRef={c.map.desktopMapRef}
            setShowPropertyModals={c.setShowPropertyModals}
            setHasSearched={c.setHasSearched}
            selectedPropertyId={(c.selectedProperty as { id?: string })?.id}
            hasLocations={c.hasLocations}
            onSearchProperties={c.handleSearchUpdated}
            onLocationSearchSubmit={c.handleLocationSearchSubmit}
            onCancelSearch={c.handleCancelSearch}
            selectedClientId={c.selectedClientId}
            onClientChange={c.setSelectedClientId}
            isLoadingPropertyDetails={c.isLoadingPropertyDetails}
            isLoadingSearchResults={c.isLoadingSearchResults}
            isLoadingIsochrone={c.isLoadingIsochrone}
            isochroneData={c.displayIsochroneData}
            fitMapToBounds={c.map.fitMapToBounds}
            showCommuteOverlay={c.showCommuteOverlay}
            mapHomeCardsCount={c.mapHomeCardsCount}
            onPreciseStreetAddressSelected={c.handlePreciseStreetAddressSelected}
            agentShareBundle={
              c.isAgent
                ? {
                    isSelected: (id) => c.agentShareSelection.selectedIds.has(id),
                    onToggle: c.agentShareSelection.toggleId,
                  }
                : undefined
            }
            agentShareDockVisible={c.isAgent && c.agentShareSelection.selectedIds.size > 0}
          />
        </Box>
        <Box
          className={`absolute inset-0 h-full ${
            c.searchViewMode === "reels" ? "z-header" : "pointer-events-none invisible z-0"
          }`}
          aria-hidden={c.searchViewMode !== "reels"}
        >
          <MotionView
            key="reels"
            className="h-full"
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <DesktopReelsView
              virtuosoRef={c.feedScrollRef}
              filteredSearchResults={c.filteredSearchResults}
              onRunSearch={c.handleSearchUpdated}
              isSearching={c.isSearching}
            />
          </MotionView>
        </Box>
      </Box>

      <SearchPageModals
        selectedProperty={c.selectedProperty}
        onClosePropertyDetails={c.clearSelectedProperty}
        isLoadingPropertyDetails={c.isLoadingPropertyDetails}
        commuteSearchOverlay={c.displayIsochroneData}
      />

      <SearchFeatureAgentShareMount
        isAgent={c.isAgent}
        agentShareSelection={c.agentShareSelection}
        selectedClientId={c.selectedClientId}
        setSelectedClientId={c.setSelectedClientId}
      />
    </Box>
  );
}
