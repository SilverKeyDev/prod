import { Icon } from "@ui/icons";
import type { ReactNode } from "react";

import { useLocalization } from "packages/contexts";
import type { SavedPageViewType } from "packages/features/documents";
import type { LibraryViewMode } from "packages/features/saved/hooks/ui/useLibraryViewMode";
import { SAVED_PAGE_SEARCH_INPUT_CLASS } from "packages/features/saved/utils/constants";
import { Box } from "packages/ui/components/primitives";
import { UnderlineTabs } from "packages/ui/components/tabs/UnderlineTabs";

import Card from "@/components/layout/Card.web";
import { IconButton, Input } from "@/components/ui";

import { LibrarySortSelect } from "./LibrarySortSelect";
import { LibraryViewModeToggle } from "./LibraryViewModeToggle";

type SavedPageTabsAndSearchProps = {
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
function SavedPageTabNav({
  viewType,
  onViewTypeChange,
}: {
  viewType: SavedPageViewType;
  onViewTypeChange: (type: SavedPageViewType) => void;
}) {
  const { t } = useLocalization();
  return (
    <UnderlineTabs
      items={[
        { id: "homes", label: t("saved.tab_homes") },
        { id: "documents", label: t("saved.tab_documents") },
        {
          id: "agreements",
          label: t("saved.tab_agreements", { defaultValue: "DocuSign" }),
        },
      ]}
      activeId={viewType}
      onChange={(id) => onViewTypeChange(id as SavedPageViewType)}
      size="md"
      className="mb-3"
    />
  );
}
export default function SavedPageTabsAndSearch({
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
  return (
    <Box className="mb-6 w-full">
      <SavedPageTabNav viewType={viewType} onViewTypeChange={onViewTypeChange} />
      <Card border="light" padding="none" className="w-full p-3">
        <Box className="flex flex-wrap items-center justify-between gap-3">
          {toolbarLeading ? (
            <Box className="flex w-full shrink-0 items-center sm:w-auto">{toolbarLeading}</Box>
          ) : null}
          {/* Search + count */}
          <Box className="flex w-full min-w-0 flex-1 flex-wrap items-center gap-3 sm:min-w-48">
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

            {rightText ? (
              <Box className="text-text-secondary whitespace-nowrap text-sm">{rightText}</Box>
            ) : null}
          </Box>

          {/* Sort, view toggle + upload */}
          <Box className="flex shrink-0 flex-wrap items-center justify-end gap-2">
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
        </Box>
      </Card>
    </Box>
  );
}
