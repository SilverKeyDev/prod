import React from "react";

import { ClientSelector } from "packages/ui/components/index.web";

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
    <div className="flex h-11 max-h-11 min-h-11 w-full max-w-full items-center gap-2 sm:max-w-lg">
      {selectedClientId !== undefined && onClientChange ? (
        <div className="h-11 max-h-11 min-h-11 shrink-0">
          <ClientSelector selectedClientId={selectedClientId} onClientChange={onClientChange} />
        </div>
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
