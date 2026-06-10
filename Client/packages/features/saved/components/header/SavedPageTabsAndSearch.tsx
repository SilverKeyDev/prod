import { Icon } from "@ui/icons";
import type { ReactNode } from "react";

import type { SavedPageViewType } from "packages/features/documents";
import type { LibraryViewMode } from "packages/features/saved/hooks/ui/useLibraryViewMode";
import { SAVED_PAGE_SEARCH_INPUT_CLASS } from "packages/features/saved/utils/constants";
import { Box } from "packages/ui/components/structure/primitives";

import Card from "@/components/layout/Card.web";
import { BodyText, IconButton, Input } from "@/components/ui";

import { LibrarySortSelect } from "./LibrarySortSelect";
import { LibraryViewModeToggle } from "./LibraryViewModeToggle";
import { SavedPageViewUnderlineTabs } from "./SavedPageViewUnderlineTabs";

type SavedPageTabsAndSearchProps = {
  isAgent: boolean;
  /** When false, hides the shared Saved search field. */
  toolbarShowSearch?: boolean;
  /** Renders at the start of the toolbar row (e.g. agent client picker). */
  toolbarLeading?: ReactNode;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  viewType: SavedPageViewType;
  onViewTypeChange: (type: SavedPageViewType) => void;
  eventTypeFilter?: "listed" | "price_change" | "sold" | "withdrawn" | "";
  onEventTypeFilterChange?: (
    eventType: "listed" | "price_change" | "sold" | "withdrawn" | ""
  ) => void;
  rightText?: string;
  onUploadClick?: () => void;
  libraryViewMode: LibraryViewMode;
  onLibraryViewModeChange: (mode: LibraryViewMode) => void;
  showLibraryViewToggle: boolean;
  librarySortKey: string;
  onLibrarySortChange: (value: string) => void;
};
export default function SavedPageTabsAndSearch({
  isAgent,
  toolbarShowSearch = true,
  toolbarLeading,
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search...",
  viewType,
  onViewTypeChange,
  eventTypeFilter: _eventTypeFilter = "",
  onEventTypeFilterChange: _onEventTypeFilterChange,
  rightText,
  onUploadClick,
  libraryViewMode,
  onLibraryViewModeChange,
  showLibraryViewToggle,
  librarySortKey,
  onLibrarySortChange,
}: SavedPageTabsAndSearchProps) {
  const controlCluster = (
    <Box className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:flex-nowrap sm:justify-end">
      <LibrarySortSelect
        viewType={viewType}
        value={librarySortKey}
        onChange={onLibrarySortChange}
      />
      <LibraryViewModeToggle
        viewMode={libraryViewMode}
        onViewModeChange={onLibraryViewModeChange}
        visible={showLibraryViewToggle}
      />
      {viewType === "documents" && onUploadClick ? (
        <IconButton
          variant="ghost"
          size="sm"
          onClick={onUploadClick}
          label="Upload"
          icon={<Icon name="plus" className="h-4 w-4" />}
          className="!text-text-primary hover:bg-transparent focus:ring-black/10 active:bg-transparent"
        />
      ) : null}
    </Box>
  );

  return (
    <Box className="mb-6 w-full">
      <SavedPageViewUnderlineTabs
        isAgent={isAgent}
        viewType={viewType}
        onViewTypeChange={onViewTypeChange}
      />
      <Card border="light" padding="none" className="w-full p-3 sm:p-4">
        {/*
          Below lg: stack (client, search + meta, controls) so controls stay on one baseline.
          lg+: single row.
        */}
        <Box className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
          {toolbarLeading ? (
            <Box className="flex w-full shrink-0 items-center lg:w-auto">{toolbarLeading}</Box>
          ) : null}

          {toolbarShowSearch ? (
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
          ) : null}

          <Box className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end lg:w-auto lg:shrink-0 lg:flex-row lg:items-center lg:justify-end lg:gap-3">
            {!toolbarShowSearch && rightText ? (
              <BodyText as="p" size="xs" className="text-text-secondary lg:hidden">
                {rightText}
              </BodyText>
            ) : null}
            {toolbarShowSearch && rightText ? (
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
      </Card>
    </Box>
  );
}
