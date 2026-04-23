import React, { type ReactNode } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { LibraryViewMode } from "packages/features/saved/hooks/ui/useLibraryViewMode";
import { SAVED_PAGE_SEARCH_INPUT_CLASS } from "packages/features/saved/utils/constants";
import { useIsMobile } from "packages/hooks/ui";
import { Box } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";
import { Button, Input } from "@/components/ui";

import { LibrarySortSelect } from "./LibrarySortSelect";
import { LibraryViewModeToggle } from "./LibraryViewModeToggle";

export type { LibraryViewMode as ViewMode } from "packages/features/saved/hooks/ui/useLibraryViewMode";
export type SortBy = "date" | "address";
type SavedLayoutProps = {
  /** Start of the toolbar row inside the card (e.g. agent client picker). */
  toolbarLeading?: ReactNode;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  leftContent?: React.ReactNode;
  viewMode?: LibraryViewMode;
  onViewModeChange?: (mode: LibraryViewMode) => void;
  showViewToggle?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isLoading?: boolean;
  refreshTitle?: string;
  rightText?: string;
  viewType?: "homes" | "documents" | "agreements";
  onViewTypeChange?: (type: "homes" | "documents" | "agreements") => void;
  eventTypeFilter?: "listed" | "price_change" | "sold" | "withdrawn" | "";
  onEventTypeFilterChange?: (
    eventType: "listed" | "price_change" | "sold" | "withdrawn" | ""
  ) => void;
  librarySortKey?: string;
  onLibrarySortChange?: (value: string) => void;
};
const SavedLayout: React.FC<SavedLayoutProps> = ({
  toolbarLeading,
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
  librarySortKey = "",
  onLibrarySortChange,
}) => {
  const { t } = useLocalization();
  const isMobile = useIsMobile();
  const ViewToggle =
    showViewToggle && onViewModeChange ? (
      <LibraryViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
    ) : null;
  // Tab navigation for homes/documents
  const TabNavigation = viewType && onViewTypeChange && (
    <Box className="border-border mb-3 flex items-center gap-2 border-b">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewTypeChange("homes")}
        className={`-mb-px rounded-none border-b-2 ${
          viewType === "homes"
            ? "text-text-secondary border-neutral-500 text-base font-semibold"
            : "text-text-secondary hover:text-text-secondary border-transparent text-sm font-medium"
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
            ? "text-text-secondary border-neutral-500 text-base font-semibold"
            : "text-text-secondary hover:text-text-secondary border-transparent text-sm font-medium"
        }`}
      >
        {t("saved.tab_documents")}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewTypeChange("agreements")}
        className={`-mb-px rounded-none border-b-2 ${
          viewType === "agreements"
            ? "text-text-secondary border-neutral-500 text-base font-semibold"
            : "text-text-secondary hover:text-text-secondary border-transparent text-sm font-medium"
        }`}
      >
        {t("saved.tab_agreements", { defaultValue: "DocuSign" })}
      </Button>
    </Box>
  );
  return (
    <Box className="mb-6 w-full">
      {TabNavigation}
      <Card border="light" padding="none" className="w-full p-3">
        <Box className="flex flex-wrap items-center justify-between gap-3">
          {toolbarLeading ? (
            <Box className="flex w-full shrink-0 items-center sm:w-auto">{toolbarLeading}</Box>
          ) : null}
          {/* Separate div for left content */}
          {leftContent && !showSearch && (
            <Box className="flex shrink-0 items-center">
              {leftContent}
              {/* Dropdown for reports view - only show on mobile (desktop shows on right side) */}
              {/* {viewType && onViewTypeChange && isMobile && (
            <Box className="ml-2">{Dropdown}</Box>
          )} */}
            </Box>
          )}

          {/* Separate div for everything else (search, dropdown, refresh, view toggle, etc.) */}
          <Box
            className={`flex flex-1 flex-wrap items-center justify-between ${
              isMobile && viewType !== "homes" && viewType !== "documents" ? "hidden" : ""
            }`}
          >
            {/* Left side: Search input or empty space */}
            <Box
              className={`flex min-w-0 items-center gap-3 ${
                showSearch ? "w-full flex-1 justify-center sm:w-auto sm:justify-start" : "shrink-0"
              }`}
            >
              {showSearch ? (
                <Box className="relative min-w-48 flex-1">
                  <Icon
                    name="search"
                    className="mobile-icon-xs text-text-disabled absolute left-3 top-1/2 -translate-y-1/2"
                  />
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className={SAVED_PAGE_SEARCH_INPUT_CLASS}
                    placeholder={searchPlaceholder}
                  />
                </Box>
              ) : null}

              {rightText && (
                <Box className="text-text-secondary mr-2 whitespace-nowrap text-sm">
                  {rightText}
                </Box>
              )}
            </Box>

            {/* Right side: View toggle, refresh, dropdown, etc. */}
            <Box
              className={`flex shrink-0 flex-wrap items-center justify-end ${
                viewType === "homes" && isMobile ? "gap-3" : "gap-2"
              }`}
            >
              {viewType && onLibrarySortChange ? (
                <LibrarySortSelect
                  viewType={viewType}
                  value={librarySortKey}
                  onChange={onLibrarySortChange}
                />
              ) : null}
              {ViewToggle}
            </Box>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};
export default SavedLayout;
