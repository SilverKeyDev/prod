import { Search, RefreshCw, ChevronDown } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import Card from "../../components/layout/Card.tsx";
import { RefreshButton } from "../../components/ui";
import useMobile from "../../../../packages/hooks/ui/useMobile";

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
  const isMobile = useMobile();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleRefresh = () => {
    if (onRefresh && !isRefreshing && !isLoading) onRefresh();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // const Dropdown = (
  //   <div className="relative" ref={dropdownRef}>
  //     <button
  //       onClick={() => setIsDropdownOpen(!isDropdownOpen)}
  //       className="mobile-input flex h-11 min-w-[100px] max-w-[120px] sm:max-w-none items-center justify-between gap-1 sm:gap-2 px-4 py-2 text-sm font-medium font-sans hover:border-brown/50 focus:border-brown"
  //     >
  //       <span className="capitalize">{viewType}</span>
  //       <ChevronDown
  //         className={`ml-auto h-4 w-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
  //       />
  //     </button>

  //     {isDropdownOpen && (
  //       <div className="absolute right-0 top-full z-50 mt-1 w-full rounded-lg border bg-white shadow-lg">
  //         <button
  //           onClick={() => {
  //             onViewTypeChange?.("homes");
  //             setIsDropdownOpen(false);
  //           }}
  //           className={`w-full px-4 py-3 text-left text-sm hover:bg-brown/5 ${
  //             viewType === "homes"
  //               ? "bg-brown/10 font-medium text-brown"
  //               : "text-black"
  //           }`}
  //         >
  //           Homes
  //         </button>
  //         <button
  //           onClick={() => {
  //             onViewTypeChange?.("reports");
  //             setIsDropdownOpen(false);
  //           }}
  //           className={`w-full border-t px-4 py-3 text-left text-sm hover:bg-brown/5 ${
  //             viewType === "reports"
  //               ? "bg-brown/10 font-medium text-brown"
  //               : "text-black"
  //           }`}
  //         >
  //           Reports
  //         </button>
  //       </div>
  //     )}
  //   </div>
  // );

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

  return (
    <div className="w-full">
      <Card padding="none" className="w-full p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Separate div for chatbot/compare/report buttons (ReportsSubViewNavigation) */}
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
              isMobile && viewType !== "homes" ? "hidden" : ""
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

              {rightText && viewType !== "reports" && (
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

              {!isMobile && rightText && viewType === "reports" && (
                <div className="whitespace-nowrap text-sm text-gray-600">
                  {rightText}
                </div>
              )}

              {/* {onRefresh && viewType === "reports" ? (
                <RefreshButton
                  onClick={handleRefresh}
                  disabled={isRefreshing || isLoading}
                  loading={isRefreshing || isLoading}
                  title={refreshTitle}
                  size="md"
                  variant="default"
                />
              ) : (
                onRefresh && (
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing || isLoading}
                    className={`touch-friendly flex items-center justify-center rounded px-3 py-2.5 ${
                      isRefreshing
                        ? "cursor-not-allowed bg-gray-300 text-gray-600"
                        : "bg-gray-300 text-gray-600 hover:bg-gray-500 hover:text-white"
                    }`}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                    />
                  </button>
                )
              )} */}

              {/* Dropdown for reports view on desktop (when showSearch is false) - appears after reports number and refresh button */}
              {/* {!isMobile && viewType && onViewTypeChange && !showSearch && (
                <div>{Dropdown}</div>
              )} */}

              {/* Dropdown for homes view (when showSearch is true) */}
              {/* {viewType && onViewTypeChange && showSearch && (
                <div className="ml-auto sm:ml-0">{Dropdown}</div>
              )} */}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SavedLayout;
