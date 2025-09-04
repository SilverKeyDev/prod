import { ChevronDown } from "lucide-react";

interface SearchCarouselHeaderProps {
  // Data
  searchResults: any[];
  savedHomes: any[];
  activeTab: "results" | "saved";

  // State
  isCarouselCollapsed: boolean;
  hasSearched: boolean;

  // Functions
  onTabChange: (tab: "results" | "saved") => void;
  onToggleCollapse: () => void;
  setShowPropertyModals: (show: boolean) => void;
  setHasSearched: (searched: boolean) => void;

  // Layout
  isMobile?: boolean;
}

export default function SearchCarouselHeader({
  searchResults,
  savedHomes,
  activeTab,
  isCarouselCollapsed,
  hasSearched,
  onTabChange,
  onToggleCollapse,
  setShowPropertyModals,
  setHasSearched,
  isMobile = false,
}: SearchCarouselHeaderProps) {
  // Calculate counts from actual arrays
  const searchResultsCount = searchResults.length;
  const savedHomesCount = savedHomes.length;

  const handleTabChange = (tab: "results" | "saved") => {
    onTabChange(tab);
    if (tab === "results") {
      if (hasSearched && searchResultsCount > 0) {
        setShowPropertyModals(true);
      }
    } else {
      if (savedHomesCount > 0) {
        setShowPropertyModals(true);
        setHasSearched(true);
      }
    }
  };

  if (isMobile) {
    // Mobile layout - horizontal tabs with collapse button
    return (
      <div className="flex items-center px-4 py-2 border-b border-gray-100 gap-2">
        <div className="flex border-b border-gray-200 flex-1">
          <button
            onClick={() => handleTabChange("results")}
            className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "results"
                ? "border-brown text-brown"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>Search</span>
              {searchResultsCount > 0 && (
                <span className="w-5 h-5 bg-olive text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {searchResultsCount}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => handleTabChange("saved")}
            className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "saved"
                ? "border-brown text-brown"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>Saved</span>
              {savedHomesCount > 0 && (
                <span className="w-5 h-5 bg-olive text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {savedHomesCount}
                </span>
              )}
            </div>
          </button>
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-300 ml-2 flex-shrink-0"
        >
          <ChevronDown 
            size={20} 
            className={`text-gray-600 transition-transform duration-300 ease-in-out ${
              isCarouselCollapsed ? 'rotate-180' : 'rotate-0'
            }`} 
          />
        </button>
      </div>
    );
  }

  // Desktop layout - matches SearchSidebar styling
  return (
    <div className="flex border-b border-gray-200 mb-4 flex-shrink-0">
      <button
        onClick={() => handleTabChange("results")}
        className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
          activeTab === "results"
            ? "border-brown text-brown"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <span>Search</span>
          {searchResultsCount > 0 && (
            <span className="w-5 h-5 bg-olive text-white text-xs rounded-full flex items-center justify-center font-medium">
              {searchResultsCount}
            </span>
          )}
        </div>
      </button>
      <button
        onClick={() => handleTabChange("saved")}
        className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
          activeTab === "saved"
            ? "border-brown text-brown"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <span>Saved</span>
          {savedHomesCount > 0 && (
            <span className="w-5 h-5 bg-olive text-white text-xs rounded-full flex items-center justify-center font-medium">
              {savedHomesCount}
            </span>
          )}
        </div>
      </button>
    </div>
  );
}
