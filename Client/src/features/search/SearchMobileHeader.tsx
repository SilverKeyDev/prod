import React from "react";
import SearchActions from "./SearchActions";

interface SearchMobileHeaderProps {
  onPreferences: () => void;
  onSearch: () => void;
  isSearching?: boolean;
}

const SearchMobileHeader: React.FC<SearchMobileHeaderProps> = ({
  onPreferences,
  onSearch,
  isSearching = false,
}) => {
  return (
    <div className="flex gap-2 max-w-sm mx-auto w-full px-4">
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
