import type { SavedPageViewType } from "packages/features/documents";
import { ClientSelector } from "packages/ui/components/index.web";

import SavedLayout from "./SavedLayout";

export type SavedHomesHeaderProps = {
  isMobile: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  viewType: SavedPageViewType;
  onViewTypeChange: (view: SavedPageViewType) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isLoading: boolean;
  homesCount: number;
  documentsCount: number;
  selectedClientId: string | null;
  onClientChange: (clientId: string | null) => void;
  eventTypeFilter?: "listed" | "price_change" | "sold" | "withdrawn" | "";
  onEventTypeFilterChange?: (
    eventType: "listed" | "price_change" | "sold" | "withdrawn" | ""
  ) => void;
};

export default function SavedHomesHeader({
  isMobile,
  searchTerm,
  onSearchChange,
  viewType,
  onViewTypeChange,
  onRefresh,
  isRefreshing,
  isLoading,
  homesCount,
  documentsCount,
  selectedClientId,
  onClientChange,
  eventTypeFilter = "",
  onEventTypeFilterChange,
}: SavedHomesHeaderProps) {
  const searchPlaceholder =
    viewType === "homes"
      ? "Search saved homes..."
      : viewType === "documents"
        ? "Search documents..."
        : "Filter by address";

  const refreshTitle = viewType === "homes" ? "Refresh saved homes" : "Refresh documents";

  const rightText =
    viewType === "homes"
      ? `${homesCount} saved`
      : viewType === "documents"
        ? `${documentsCount} documents`
        : "";

  if (isMobile) {
    return (
      <div className="flex w-full flex-col justify-center gap-1.5" key={viewType}>
        <div className="flex-shrink-0">
          <ClientSelector selectedClientId={selectedClientId} onClientChange={onClientChange} />
        </div>
        <SavedLayout
          key={`saved-layout-${viewType}`}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          showSearch={true}
          leftContent={null}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          isLoading={isLoading}
          refreshTitle={refreshTitle}
          rightText={rightText}
          viewType={viewType}
          onViewTypeChange={onViewTypeChange}
          eventTypeFilter={viewType === "documents" ? eventTypeFilter : undefined}
          onEventTypeFilterChange={viewType === "documents" ? onEventTypeFilterChange : undefined}
        />
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <ClientSelector selectedClientId={selectedClientId} onClientChange={onClientChange} />
      </div>
      <SavedLayout
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        showSearch={true}
        leftContent={null}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        isLoading={isLoading}
        refreshTitle={refreshTitle}
        rightText={rightText}
        viewType={viewType}
        onViewTypeChange={onViewTypeChange}
        eventTypeFilter={viewType === "documents" ? eventTypeFilter : undefined}
        onEventTypeFilterChange={viewType === "documents" ? onEventTypeFilterChange : undefined}
      />
    </>
  );
}
