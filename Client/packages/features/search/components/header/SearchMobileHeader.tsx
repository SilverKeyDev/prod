import React from "react";

import { HEADER_ROW_HEIGHT } from "packages/ui/constants/layout";

import { ClientSelector } from "@/components/ui";

import SearchActions from "./SearchActions.web";

export type SearchMobileHeaderProps = {
  /** Called when filters are changed (e.g. trigger search) */
  onPreferencesChanged?: () => void | Promise<void>;
  onSearch: () => void;
  onCancelSearch?: () => void;
  isSearching?: boolean;
  selectedClientId?: string | null;
  onClientChange?: (clientId: string | null) => void;
  mode?: "map" | "reels";
  onToggleMode?: () => void;
  onBeforeSwitchToReels?: () => void;
};

const SearchMobileHeader: React.FC<SearchMobileHeaderProps> = ({
  onPreferencesChanged,
  onSearch,
  onCancelSearch,
  isSearching = false,
  selectedClientId,
  onClientChange,
  mode,
  onToggleMode,
  onBeforeSwitchToReels,
}) => {
  return (
    <div className={`flex w-full max-w-full items-center gap-2 sm:max-w-lg ${HEADER_ROW_HEIGHT}`}>
      {selectedClientId !== undefined && onClientChange ? (
        <ClientSelector selectedClientId={selectedClientId} onClientChange={onClientChange} />
      ) : null}
      <SearchActions
        onPreferencesChanged={onPreferencesChanged}
        onSearchProperties={onSearch}
        onCancelSearch={onCancelSearch}
        isSearching={isSearching}
        hasLocations={true}
        variant="mobile"
        showReelsButton={mode === "map"}
        showMapButton={mode === "reels"}
        onToggleMode={onToggleMode}
        onBeforeSwitchToReels={onBeforeSwitchToReels}
      />
    </div>
  );
};

export default SearchMobileHeader;
