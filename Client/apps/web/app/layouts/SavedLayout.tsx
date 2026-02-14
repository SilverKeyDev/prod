import { Search } from "lucide-react";
import React from "react";
import Card from "../../components/layout/Card.tsx";
import Dropdown from "../../components/ui/form/Dropdown";
import type { DropdownOption } from "../../components/ui/form/Dropdown";
import { useIsMobile } from "../../../../packages/hooks/ui";

export type ViewMode = "grid" | "list";
export type SortBy = "date" | "address";

type SavedLayoutProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  leftContent?: React.ReactNode;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  showViewToggle?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isLoading?: boolean;
  refreshTitle?: string;
  rightText?: string;
  viewType?: "homes" | "documents";
  onViewTypeChange?: (type: "homes" | "documents") => void;
  eventTypeFilter?: "listed" | "price_change" | "sold" | "withdrawn" | "";
  onEventTypeFilterChange?: (
    eventType: "listed" | "price_change" | "sold" | "withdrawn" | "",
  ) => void;
};

const SavedLayout: React.FC<SavedLayoutProps> = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Filter by address",
  showSearch = true,
  leftContent,
  viewMode = "grid",
  onViewModeChange,
  showViewToggle = true,
  rightText,
  viewType,
  onViewTypeChange,
  eventTypeFilter = "",
  onEventTypeFilterChange,
}) => {
  const isMobile = useIsMobile();

  // Event type options for filtering documents
  const eventTypeOptions: DropdownOption<
    "listed" | "price_change" | "sold" | "withdrawn" | ""
  >[] = [
    { value: "", label: "All Events" },
    { value: "listed", label: "Listed" },
    { value: "price_change", label: "Price Change" },
    { value: "sold", label: "Sold" },
    { value: "withdrawn", label: "Withdrawn" },
  ];

  const ViewToggle = showViewToggle && onViewModeChange && (
    <div className="hidden items-center gap-2 sm:flex">
      <button
        onClick={() => onViewModeChange("grid")}
        className={`touch-friendly rounded px-3 py-2.5 ${
          viewMode === "grid"
            ? "bg-brown text-white"
            : "bg-beige text-white hover:bg-brown/80"
        }`}
      >
        <div className="mobile-icon-xs grid grid-cols-2 gap-1">
          <div className="rounded-sm bg-current" />
          <div className="rounded-sm bg-current" />
          <div className="rounded-sm bg-current" />
          <div className="rounded-sm bg-current" />
        </div>
      </button>
      <button
        onClick={() => onViewModeChange("list")}
        className={`touch-friendly rounded px-3 py-2.5 ${
          viewMode === "list"
            ? "bg-brown text-white"
            : "bg-beige text-white hover:bg-brown/80"
        }`}
      >
        <div className="mobile-icon-xs space-y-1">
          <div className="h-0.5 rounded-sm bg-current" />
          <div className="h-0.5 rounded-sm bg-current" />
          <div className="h-0.5 rounded-sm bg-current" />
        </div>
      </button>
    </div>
  );

  // Tab navigation for homes/documents
  const TabNavigation = viewType && onViewTypeChange && (
    <div className="flex items-center gap-2 mb-3 border-b border-gray-200">
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
          {/* Separate div for left content */}
          {leftContent && !showSearch && (
            <div className="flex shrink-0 items-center">
              {leftContent}
              {/* Dropdown for reports view - only show on mobile (desktop shows on right side) */}
              {/* {viewType && onViewTypeChange && isMobile && (
                <div className="ml-2">{Dropdown}</div>
              )} */}
            </div>
          )}

          {/* Separate div for everything else (search, dropdown, refresh, view toggle, etc.) */}
          <div
            className={`flex flex-1 flex-wrap items-center justify-between ${
              isMobile && viewType !== "homes" && viewType !== "documents"
                ? "hidden"
                : ""
            }`}
          >
            {/* Left side: Search input or empty space */}
            <div
              className={`flex min-w-0 items-center gap-3 ${showSearch ? "flex-1 w-full sm:w-auto justify-center sm:justify-start" : "shrink-0"}`}
            >
              {showSearch ? (
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
              ) : null}

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

            {/* Right side: View toggle, refresh, dropdown, etc. */}
            <div
              className={`flex shrink-0 items-center justify-end ${
                viewType === "homes" && isMobile ? "gap-3" : "gap-2"
              }`}
            >
              {ViewToggle}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SavedLayout;
