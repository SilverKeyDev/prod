import React from "react";

import SearchActions from "../SearchActions";
import { useConsolidatedSearchStore } from "../../../../core/store/search";

type SearchMobileHeaderProps = {
  onPreferences: () => void;
  onSearch: () => void;
};

const SearchMobileHeader: React.FC<SearchMobileHeaderProps> = ({
  onPreferences,
  onSearch,
}) => {
  const isSearching = useConsolidatedSearchStore((state) => state.isSearching);

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
