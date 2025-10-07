import { Search, RefreshCw, ChevronDown } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

import Card from "../../components/layout/Card.tsx";

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
  viewType?: "homes" | "reports";
  onViewTypeChange?: (type: "homes" | "reports") => void;
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
  onRefresh,
  isRefreshing = false,
  isLoading = false,
  refreshTitle = "Refresh",
  rightText,
  viewType,
  onViewTypeChange,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const handleRefresh = () => {
    if (onRefresh && !isRefreshing && !isLoading) {
      onRefresh();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div>
      <Card className="mb-4">
        <div className="flex min-h-[44px] items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {showSearch ? (
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
            ) : (
              leftContent && (
                <div className="min-w-[200px] flex-1">{leftContent}</div>
              )
            )}
            {rightText && (
              <div className="hidden shrink-0 whitespace-nowrap text-sm text-gray-600 sm:block mr-3">
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

            {/* View Type Dropdown - moved to far right after refresh */}
            {viewType && onViewTypeChange && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="mobile-input flex h-11 min-w-[140px] items-center justify-between gap-2 px-4 py-2 text-sm font-medium transition-colors hover:border-brown/50 focus:border-brown focus:ring-brown/20"
                >
                  <span className="capitalize">{viewType}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isDropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[140px] rounded-lg border border-gray-300 bg-white shadow-lg">
                    <button
                      onClick={() => {
                        onViewTypeChange("homes");
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors duration-150 first:rounded-t-lg hover:bg-brown/5 ${
                        viewType === "homes"
                          ? "bg-brown/10 font-medium text-brown"
                          : "text-black"
                      }`}
                    >
                      Homes
                    </button>
                    <button
                      onClick={() => {
                        onViewTypeChange("reports");
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full border-t border-gray-200 px-4 py-3 text-left text-sm transition-colors duration-150 last:rounded-b-lg hover:bg-brown/5 ${
                        viewType === "reports"
                          ? "bg-brown/10 font-medium text-brown"
                          : "text-black"
                      }`}
                    >
                      Reports
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SavedLayout;
