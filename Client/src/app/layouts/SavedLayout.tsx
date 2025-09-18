import { Search, RefreshCw } from "lucide-react";
import React from "react";

import { Card } from "../../components/format";

export type ViewMode = "grid" | "list";
export type SortBy = "date" | "address";

type SavedLayoutProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  showViewToggle?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isLoading?: boolean;
  refreshTitle?: string;
  rightText?: string;
};

const SavedLayout: React.FC<SavedLayoutProps> = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Filter by address",
  viewMode = "grid",
  onViewModeChange,
  showViewToggle = true,
  onRefresh,
  isRefreshing = false,
  isLoading = false,
  refreshTitle = "Refresh",
  rightText,
}) => {
  const handleRefresh = () => {
    if (onRefresh && !isRefreshing && !isLoading) {
      onRefresh();
    }
  };

  return (
    <div>
      <Card className="mb-4">
        <div className="flex min-h-[44px] items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="relative min-w-[200px] flex-1">
              <Search className="mobile-icon-xs absolute left-3 top-1/2 -translate-y-1/2 transform text-black/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onSearchChange(e.target.value)
                }
                className="mobile-input w-full pl-9 pr-4 sm:pl-10"
                placeholder={searchPlaceholder}
              />
            </div>
            {rightText && (
              <div className="hidden shrink-0 whitespace-nowrap text-sm text-gray-600 sm:block">
                {rightText}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {/* View Toggle Buttons - Desktop Only */}
            {showViewToggle && onViewModeChange && (
              <div className="hidden items-center gap-2 sm:flex">
                <button
                  onClick={() => onViewModeChange("grid")}
                  className={`touch-friendly flex items-center justify-center rounded px-3 py-2.5 ${
                    viewMode === "grid"
                      ? "bg-brown text-white"
                      : "bg-beige text-white hover:bg-brown/80"
                  }`}
                >
                  <div className="mobile-icon-xs grid grid-cols-2 gap-1">
                    <div className="rounded-sm bg-current"></div>
                    <div className="rounded-sm bg-current"></div>
                    <div className="rounded-sm bg-current"></div>
                    <div className="rounded-sm bg-current"></div>
                  </div>
                </button>
                <button
                  onClick={() => onViewModeChange("list")}
                  className={`touch-friendly flex items-center justify-center rounded px-3 py-2.5 ${
                    viewMode === "list"
                      ? "bg-brown text-white"
                      : "bg-beige text-white hover:bg-brown/80"
                  }`}
                >
                  <div className="mobile-icon-xs space-y-1">
                    <div className="h-0.5 rounded-sm bg-current"></div>
                    <div className="h-0.5 rounded-sm bg-current"></div>
                    <div className="h-0.5 rounded-sm bg-current"></div>
                  </div>
                </button>
              </div>
            )}

            {/* Refresh button */}
            {onRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing ?? isLoading}
                className={`touch-friendly flex shrink-0 items-center justify-center rounded px-3 py-2.5 transition-colors duration-200 ${
                  isRefreshing
                    ? "cursor-not-allowed bg-gray-300 text-gray-600"
                    : "bg-gray-300 text-gray-600 hover:bg-gray-500 hover:text-white"
                }`}
                title={
                  (isRefreshing ?? isLoading) ? "Refreshing..." : refreshTitle
                }
              >
                <RefreshCw
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
              </button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SavedLayout;
