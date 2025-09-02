import React from "react";
import { Search, RefreshCw } from "lucide-react";
import { Card } from "../ui/base";

export type ViewMode = "grid" | "list";
export type SortBy = "date" | "address";

interface SavedLayoutProps {
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
}

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
        <div className="flex items-center justify-between gap-4 min-h-[44px]">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 mobile-icon-xs text-black/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="mobile-input pl-9 sm:pl-10 pr-4 w-full"
                placeholder={searchPlaceholder}
              />
            </div>
            {rightText && (
              <div className="hidden sm:block text-sm text-gray-600 whitespace-nowrap shrink-0">
                {rightText}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* View Toggle Buttons - Desktop Only */}
            {showViewToggle && onViewModeChange && (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => onViewModeChange("grid")}
                  className={`px-3 py-2.5 rounded touch-friendly flex items-center justify-center ${
                    viewMode === "grid"
                      ? "bg-brown text-white"
                      : "bg-beige text-white hover:bg-brown/80"
                  }`}
                >
                  <div className="grid grid-cols-2 gap-1 mobile-icon-xs">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                </button>
                <button
                  onClick={() => onViewModeChange("list")}
                  className={`px-3 py-2.5 rounded touch-friendly flex items-center justify-center ${
                    viewMode === "list"
                      ? "bg-brown text-white"
                      : "bg-beige text-white hover:bg-brown/80"
                  }`}
                >
                  <div className="space-y-1 mobile-icon-xs">
                    <div className="bg-current rounded-sm h-0.5"></div>
                    <div className="bg-current rounded-sm h-0.5"></div>
                    <div className="bg-current rounded-sm h-0.5"></div>
                  </div>
                </button>
              </div>
            )}


            {/* Refresh button */}
            {onRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className={`px-3 py-2.5 rounded touch-friendly flex items-center justify-center transition-colors duration-200 shrink-0 ${
                  isRefreshing
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-gray-300 text-gray-600 hover:bg-gray-500 hover:text-white"
                }`}
                title={
                  isRefreshing || isLoading ? "Refreshing..." : refreshTitle
                }
              >
                <RefreshCw
                  className={`w-4 h-4 transition-transform duration-200 ${
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
