import React from "react";
import { Settings, Search } from "lucide-react";

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
      <button
        onClick={onPreferences}
        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors touch-friendly text-sm"
      >
        <Settings size={14} />
        Preferences
      </button>
      <button
        onClick={onSearch}
        disabled={isSearching}
        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-olive text-white rounded-lg hover:bg-olive/80 transition-colors disabled:opacity-50 touch-friendly text-sm"
      >
        <Search size={14} />
        {isSearching ? "Searching..." : "Search"}
      </button>
    </div>
  );
};

export default SearchMobileHeader;
