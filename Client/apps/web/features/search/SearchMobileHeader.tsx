import React from "react";

import SearchActions from "./SearchActions";

type SearchMobileHeaderProps = {
  onPreferences: () => void;
  onSearch: () => void;
  isSearching?: boolean;
};

const SearchMobileHeader: React.FC<SearchMobileHeaderProps> = ({
  onPreferences,
  onSearch,
  isSearching = false,
}) => {
  return (
    <div className="mx-auto flex w-full max-w-sm gap-2 px-4">
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
