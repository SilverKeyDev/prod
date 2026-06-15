/// <reference types="google.maps" />
import React from "react";

import { SEARCH_TRANSLATIONS } from "packages/features/search/types/domain/translations";
import { useGoogleMaps } from "packages/hooks/data";
import { Box } from "packages/ui/components/structure/primitives";

import {
  type PreciseStreetAddressPayload,
  SearchLocationBarWeb,
} from "./location-bar/SearchLocationBar.web";
import SearchActions from "./SearchActions.web";

export type SearchMobileHeaderProps = {
  onSearch: () => void;
  onLocationSearchSubmit: () => void | Promise<void>;
  fitMapToBounds: (bounds: google.maps.LatLngBounds) => void;
  onPreciseStreetAddressSelected?: (payload: PreciseStreetAddressPayload) => void;
  onCancelSearch?: () => void;
  isSearching?: boolean;
  /** When false, Search is disabled until user adds a location in Preferences */
  hasLocations?: boolean;
  selectedClientId?: string | null;
  onClientChange?: (clientId: string | null) => void;
  mode?: "map" | "reels";
  onToggleMode?: () => void;
  onBeforeSwitchToReels?: () => void;
};

const SearchMobileHeader: React.FC<SearchMobileHeaderProps> = ({
  onSearch,
  onLocationSearchSubmit,
  fitMapToBounds,
  onPreciseStreetAddressSelected,
  onCancelSearch,
  isSearching = false,
  hasLocations = true,
  selectedClientId,
  onClientChange,
  mode,
  onToggleMode,
  onBeforeSwitchToReels,
}) => {
  const { isLoaded: scriptsReady } = useGoogleMaps();

  return (
    <Box className="z-dropdown relative mt-2 flex w-full min-w-0 max-w-full flex-row flex-nowrap items-center gap-2 pt-0.5">
      <Box className="min-w-0 flex-1">
        <SearchLocationBarWeb
          scriptsReady={scriptsReady}
          fitMapToBounds={fitMapToBounds}
          onSearch={onLocationSearchSubmit}
          onPreciseStreetAddressSelected={onPreciseStreetAddressSelected}
          locationPlaceholder={
            SEARCH_TRANSLATIONS["search.location_bar_placeholder"] ?? "City, neighborhood, or ZIP"
          }
        />
      </Box>
      <SearchActions
        mobileToolbarCluster
        onSearchProperties={onSearch}
        onCancelSearch={onCancelSearch}
        isSearching={isSearching}
        hasLocations={hasLocations}
        variant="mobile"
        showReelsButton={mode === "map"}
        showMapButton={mode === "reels"}
        onToggleMode={onToggleMode}
        onBeforeSwitchToReels={onBeforeSwitchToReels}
        selectedClientId={selectedClientId}
        onClientChange={onClientChange}
      />
    </Box>
  );
};

export default SearchMobileHeader;
