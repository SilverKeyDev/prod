import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { SAVED_PAGE_SEARCH_INPUT_CLASS } from "packages/features/saved/utils/constants";
import { useIsMobile } from "packages/hooks/ui";

import Card from "@/components/layout/Card.web";
import { Button, Input } from "@/components/ui";
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
    eventType: "listed" | "price_change" | "sold" | "withdrawn" | ""
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
  eventTypeFilter: _eventTypeFilter = "",
  onEventTypeFilterChange: _onEventTypeFilterChange,
}) => {
  const { t } = useLocalization();
  const isMobile = useIsMobile();
  const ViewToggle = showViewToggle && onViewModeChange && (
    <div className="hidden items-center gap-2 sm:flex">
      <Button
        variant={viewMode === "grid" ? "primary" : "secondary"}
        size="sm"
        onClick={() => onViewModeChange("grid")}
        className={`touch-friendly rounded px-3 py-2.5 ${viewMode === "grid" ? "bg-olive text-white" : "bg-beige hover:bg-olive/80 text-white"}`}
      >
        <div className="mobile-icon-xs grid grid-cols-2 gap-1">
          <div className="rounded-sm bg-current" />
          <div className="rounded-sm bg-current" />
          <div className="rounded-sm bg-current" />
          <div className="rounded-sm bg-current" />
        </div>
      </Button>
      <Button
        variant={viewMode === "list" ? "primary" : "secondary"}
        size="sm"
        onClick={() => onViewModeChange("list")}
        className={`touch-friendly rounded px-3 py-2.5 ${viewMode === "list" ? "bg-olive text-white" : "bg-beige hover:bg-olive/80 text-white"}`}
      >
        <div className="mobile-icon-xs space-y-1">
          <div className="h-0.5 rounded-sm bg-current" />
          <div className="h-0.5 rounded-sm bg-current" />
          <div className="h-0.5 rounded-sm bg-current" />
        </div>
      </Button>
    </div>
  );
  // Tab navigation for homes/documents
  const TabNavigation = viewType && onViewTypeChange && (
    <div className="mb-3 flex items-center gap-2 border-b border-gray-200">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewTypeChange("homes")}
        className={`-mb-px rounded-none border-b-2 ${
          viewType === "homes"
            ? "border-gold text-base font-semibold text-gray-500"
            : "border-transparent text-sm font-medium text-gray-500 hover:text-gray-700"
        }`}
      >
        {t("saved.tab_homes")}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewTypeChange("documents")}
        className={`-mb-px rounded-none border-b-2 ${
          viewType === "documents"
            ? "border-gold text-base font-semibold text-gray-500"
            : "border-transparent text-sm font-medium text-gray-500 hover:text-gray-700"
        }`}
      >
        {t("saved.tab_documents")}
      </Button>
    </div>
  );
  return (
    <div className="mb-6 w-full">
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
            className={`flex flex-1 flex-wrap items-center justify-between ${isMobile && viewType !== "homes" && viewType !== "documents" ? "hidden" : ""}`}
          >
            {/* Left side: Search input or empty space */}
            <div
              className={`flex min-w-0 items-center gap-3 ${showSearch ? "w-full flex-1 justify-center sm:w-auto sm:justify-start" : "shrink-0"}`}
            >
              {showSearch ? (
                <div className="relative min-w-48 flex-1">
                  <Icon
                    name="search"
                    className="mobile-icon-xs absolute left-3 top-1/2 -translate-y-1/2 text-black/40"
                  />
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className={SAVED_PAGE_SEARCH_INPUT_CLASS}
                    placeholder={searchPlaceholder}
                  />
                </div>
              ) : null}

              {rightText && (
                <div className="mr-2 whitespace-nowrap text-sm text-gray-600">{rightText}</div>
              )}
            </div>

            {/* Right side: View toggle, refresh, dropdown, etc. */}
            <div
              className={`flex shrink-0 items-center justify-end ${viewType === "homes" && isMobile ? "gap-3" : "gap-2"}`}
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
