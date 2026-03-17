import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { SavedPageViewType } from "packages/features/documents";
import { SAVED_PAGE_SEARCH_INPUT_CLASS } from "packages/features/saved/utils/constants";

import Card from "@/components/layout/Card.web";
import { IconButton, Input } from "@/components/ui";
import { UnderlineTabs } from "@/components/ui";
type SavedPageTabsAndSearchProps = {
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
      ]}
      activeId={viewType}
      onChange={(id) => onViewTypeChange(id as SavedPageViewType)}
      className="mb-3"
    />
  );
}
export default function SavedPageTabsAndSearch({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search...",
  viewType,
  onViewTypeChange,
  eventTypeFilter: _eventTypeFilter = "",
  onEventTypeFilterChange: _onEventTypeFilterChange,
  rightText,
  onUploadClick,
}: SavedPageTabsAndSearchProps) {
  return (
    <div className="mb-6 w-full">
      <SavedPageTabNav viewType={viewType} onViewTypeChange={onViewTypeChange} />
      <Card padding="none" className="w-full p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search input */}
          <div className="flex w-full min-w-0 flex-1 items-center justify-center gap-3 sm:w-auto sm:justify-start">
            <div className="relative min-w-48 flex-1">
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
            </div>

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
              <div className="text-text-secondary mr-2 whitespace-nowrap text-sm">{rightText}</div>
            )}
          </div>

          {/* Upload button - only show when viewing documents */}
          {viewType === "documents" && onUploadClick && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={onUploadClick}
              label="Upload"
              icon={<Icon name="plus" className="h-4 w-4" />}
              className="text-text-disabled hover:bg-transparent focus:ring-black/10 active:bg-transparent"
            />
          )}
        </div>
      </Card>
    </div>
  );
}
