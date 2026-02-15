import React from "react";

import SearchActions from "./SearchActions";
import ClientSelector from "../../../components/ui/ClientSelector";

type SearchMobileHeaderProps = {
  onPreferences: () => void;
  onSearch: () => void;
  onCancelSearch?: () => void;
  isSearching?: boolean;
  selectedClientId?: string | null;
  onClientChange?: (clientId: string | null) => void;
};

const SearchMobileHeader: React.FC<SearchMobileHeaderProps> = ({
  onPreferences,
  onSearch,
  onCancelSearch,
  isSearching = false,
  selectedClientId,
  onClientChange,
}) => {
  return (
    <div className="mx-auto flex w-full max-w-full items-center gap-2 px-4 sm:max-w-lg">
      {selectedClientId !== undefined && onClientChange ? (
        <ClientSelector
          selectedClientId={selectedClientId}
          onClientChange={onClientChange}
        />
      ) : null}
      <SearchActions
        onUpdatePreferences={onPreferences}
        onSearchProperties={onSearch}
        onCancelSearch={onCancelSearch}
        isSearching={isSearching}
        variant="mobile"
      />
    </div>
  );
};

export default SearchMobileHeader;
