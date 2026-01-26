import { Search, Plus } from "lucide-react";
import Card from "../layout/Card";
import IconButton from "../ui/button/IconButton";
import type { SavedPageViewType } from "../../../../packages/hooks/store/documents/useSavedPageView";

type SavedPageTabsAndSearchProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  viewType: SavedPageViewType;
  onViewTypeChange: (type: SavedPageViewType) => void;
  eventTypeFilter?: "listed" | "price_change" | "sold" | "withdrawn" | "";
  onEventTypeFilterChange?: (eventType: "listed" | "price_change" | "sold" | "withdrawn" | "") => void;
  rightText?: string;
  onUploadClick?: () => void;
};

export default function SavedPageTabsAndSearch({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search...",
  viewType,
  onViewTypeChange,
  eventTypeFilter: _eventTypeFilter = "",
  onEventTypeFilterChange: _onEventTypeFilterChange,
  rightText,
  onUploadClick,
}: SavedPageTabsAndSearchProps) {
  // Tab navigation for homes/documents
  const TabNavigation = (
    <div className="flex items-center justify-start gap-2 mb-3 border-b border-gray-200">
      <button
        onClick={() => onViewTypeChange("homes")}
        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
          viewType === "homes"
            ? "border-brown text-brown"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        Homes
      </button>
      <button
        onClick={() => onViewTypeChange("documents")}
        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
          viewType === "documents"
            ? "border-brown text-brown"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        Documents
      </button>
    </div>
  );

  return (
    <div className="w-full mb-6">
      {TabNavigation}
      <Card padding="none" className="w-full p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search input */}
          <div className="flex min-w-0 items-center gap-3 flex-1 w-full sm:w-auto justify-center sm:justify-start">
            <div className="relative min-w-[200px] flex-1">
              <Search className="mobile-icon-xs absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="mobile-input h-11 w-full pl-9 pr-4 sm:pl-10 text-sm font-sans"
                placeholder={searchPlaceholder}
              />
            </div>

            {/* Event type filter - only show when viewing documents */}
            {/* {viewType === "documents" && onEventTypeFilterChange && (
              <div className="w-full sm:w-auto min-w-[150px]">
                <Dropdown
                  options={eventTypeOptions}
                  value={eventTypeFilter}
                  onChange={(value) =>
                    onEventTypeFilterChange(value as "listed" | "price_change" | "sold" | "withdrawn" | "")
                  }
                  placeholder="Filter by event..."
                  variant="mobile"
                />
              </div>
            )} */}

            {rightText && (
              <div className="whitespace-nowrap text-sm text-gray-600 mr-2">
                {rightText}
              </div>
            )}
          </div>

          {/* Upload button - only show when viewing documents */}
          {viewType === "documents" && onUploadClick && (
            <IconButton
              variant="ghost"
              size="md"
              onClick={onUploadClick}
              icon={<Plus className="h-5 w-5 text-gray-600" />}
              className="hover:bg-gray-100/50"
              aria-label="Upload document"
            />
          )}
        </div>
      </Card>
    </div>
  );
}
