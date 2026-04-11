import React from "react";

import { Box } from "packages/ui/components/primitives";
import { HEADER_ROW_HEIGHT } from "packages/ui/constants/layout";

import SearchActions from "./SearchActions.web";
export type SearchMobileHeaderProps = {
  onSearch: () => void;
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
  onCancelSearch,
  isSearching = false,
  hasLocations = true,
  selectedClientId,
  onClientChange,
  mode,
  onToggleMode,
  onBeforeSwitchToReels,
}) => {
  return (
    <Box
      className={`flex w-full max-w-full items-center gap-2 sm:max-w-lg ${HEADER_ROW_HEIGHT}`}
    >
      <SearchActions
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
