import React, { type ReactNode } from "react";

import { Icon } from "@ui/icons";

import type { SavedPageViewType } from "packages/features/documents";
import type { LibraryViewMode } from "packages/features/saved/hooks/ui/useLibraryViewMode";
import { SAVED_PAGE_SEARCH_INPUT_CLASS } from "packages/features/saved/utils/constants";
import { useIsMobile } from "packages/hooks/ui";
import { Box } from "packages/ui/components/structure/primitives";

import Card from "@/components/layout/Card.web";
import { BodyText, Input } from "@/components/ui";

import { LibrarySortSelect } from "./LibrarySortSelect";
import { LibraryViewModeToggle } from "./LibraryViewModeToggle";
import { SavedPageViewUnderlineTabs } from "./SavedPageViewUnderlineTabs";

export type { LibraryViewMode as ViewMode } from "packages/features/saved/hooks/ui/useLibraryViewMode";
export type SortBy = "date" | "address";
type SavedLayoutProps = {
  /** When tabs are shown, agents get an extra Forms Library tab on Saved. */
  isAgent?: boolean;
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
  viewType?: SavedPageViewType;
  onViewTypeChange?: (type: SavedPageViewType) => void;
  eventTypeFilter?: "listed" | "price_change" | "sold" | "withdrawn" | "";
  onEventTypeFilterChange?: (
    eventType: "listed" | "price_change" | "sold" | "withdrawn" | ""
  ) => void;
  librarySortKey?: string;
  onLibrarySortChange?: (value: string) => void;
  /** When true (mobile shell header), drop bottom margin so controls stay inside the fixed bar. */
  embeddedInMobileHeader?: boolean;
};
const SavedLayout: React.FC<SavedLayoutProps> = ({
  isAgent = false,
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
  embeddedInMobileHeader = false,
}) => {
  const isMobile = useIsMobile();
  /** Mobile saved header: no search field; keep client, counts, sort, and view mode on one row. */
  const condensedToolbar = isMobile && !showSearch;
  const ViewToggle =
    showViewToggle && onViewModeChange ? (
      <LibraryViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
    ) : null;

  const controlCluster = (
    <Box
      className={`flex min-w-0 items-center justify-end gap-1.5 sm:gap-2 lg:justify-end ${
        condensedToolbar ? "shrink-0 flex-nowrap" : "flex-wrap sm:flex-nowrap"
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
  );

  const tabNavigation =
    viewType && onViewTypeChange ? (
      <SavedPageViewUnderlineTabs
        isAgent={isAgent}
        viewType={viewType}
        onViewTypeChange={onViewTypeChange}
      />
    ) : null;

  const legacyHideMobileAgreementsChrome =
    showSearch && isMobile && viewType !== "documents" && viewType !== "forms-library";

  return (
    <Box className={`w-full ${embeddedInMobileHeader ? "mb-0" : "mb-6"}`}>
      {tabNavigation}
      <Card border="light" padding="none" className="w-full p-3 sm:p-4">
        {condensedToolbar ? (
          <Box
            className={`flex w-full min-w-0 flex-row flex-nowrap items-center gap-2 overflow-x-auto overscroll-x-contain ${
              legacyHideMobileAgreementsChrome ? "hidden" : ""
            }`}
          >
            {leftContent != null ? (
              <Box className="flex shrink-0 items-center">{leftContent}</Box>
            ) : null}
            {toolbarLeading ? <Box className="min-w-0 flex-1 basis-0">{toolbarLeading}</Box> : null}
            {rightText ? (
              <BodyText as="p" size="xs" className="text-text-secondary shrink-0 whitespace-nowrap">
                {rightText}
              </BodyText>
            ) : null}
            <Box className="ms-auto flex shrink-0 items-center">{controlCluster}</Box>
          </Box>
        ) : (
          <Box className="flex flex-col gap-3">
            {(toolbarLeading != null || (leftContent != null && !showSearch)) && (
              <Box className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 lg:w-auto">
                {toolbarLeading ? (
                  <Box className="flex w-full min-w-0 shrink-0 items-center sm:w-auto">
                    {toolbarLeading}
                  </Box>
                ) : null}
                {leftContent != null && !showSearch ? (
                  <Box className="flex shrink-0 items-center">{leftContent}</Box>
                ) : null}
              </Box>
            )}

            <Box
              className={`flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3 ${
                legacyHideMobileAgreementsChrome ? "hidden" : ""
              }`}
            >
              {showSearch ? (
                <Box className="flex w-full min-w-0 flex-1 flex-col gap-1.5">
                  <Box className="w-full min-w-0">
                    <Input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className={SAVED_PAGE_SEARCH_INPUT_CLASS}
                      placeholder={searchPlaceholder}
                      leftIcon={
                        <Icon
                          name="search"
                          className="text-text-secondary pointer-events-none h-4 w-4"
                        />
                      }
                    />
                  </Box>
                  {rightText ? (
                    <BodyText as="p" size="xs" className="text-text-secondary lg:hidden">
                      {rightText}
                    </BodyText>
                  ) : null}
                </Box>
              ) : rightText ? (
                <BodyText as="p" size="xs" className="text-text-secondary w-full lg:w-auto">
                  {rightText}
                </BodyText>
              ) : null}

              <Box className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end lg:w-auto lg:shrink-0 lg:flex-row lg:items-center lg:justify-end lg:gap-3">
                {showSearch && rightText ? (
                  <BodyText
                    as="p"
                    size="xs"
                    className="text-text-secondary hidden shrink-0 whitespace-nowrap lg:block"
                  >
                    {rightText}
                  </BodyText>
                ) : null}
                {controlCluster}
              </Box>
            </Box>
          </Box>
        )}
      </Card>
    </Box>
  );
};
export default SavedLayout;
