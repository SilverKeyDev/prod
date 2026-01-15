import React from "react";

import SearchActions from "./SearchActions";
import ClientSelector from "../../../components/ui/ClientSelector";

type SearchMobileHeaderProps = {
  onPreferences: () => void;
  onSearch: () => void;
  isSearching?: boolean;
  selectedClientId?: string | null;
  onClientChange?: (clientId: string | null) => void;
};

const SearchMobileHeader: React.FC<SearchMobileHeaderProps> = ({
  onPreferences,
  onSearch,
  isSearching = false,
  selectedClientId,
  onClientChange,
}) => {
  return (
    <div className="mx-auto flex w-full max-w-sm items-center gap-2 px-4">
      {selectedClientId !== undefined && onClientChange ? (
        <ClientSelector
          selectedClientId={selectedClientId}
          onClientChange={onClientChange}
        />
      ) : null}
      <SearchActions
        onUpdatePreferences={onPreferences}
        onSearchProperties={onSearch}
        isSearching={isSearching}
        variant="mobile"
      />
    </div>
  );
};

export default SearchMobileHeader;
