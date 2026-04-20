import type { SavedPageViewType } from "packages/features/documents";
import { Box } from "packages/ui/components/primitives";

import { ClientSelector } from "@/components/ui";

import SavedLayout from "./SavedLayout";
export type SavedHomesHeaderProps = {
  isMobile: boolean;
  isAgent: boolean;
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
  isAgent,
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
      : viewType === "agreements"
        ? "Search agreements..."
        : viewType === "documents"
          ? "Search documents..."
          : "Filter by address";

  const refreshTitle =
    viewType === "homes"
      ? "Refresh saved homes"
      : viewType === "agreements"
        ? "Refresh agreements"
        : "Refresh documents";

  const rightText =
    viewType === "homes"
      ? `${homesCount} saved`
      : viewType === "documents"
        ? `${documentsCount} documents`
        : "";

  const clientToolbar = isAgent ? (
    <ClientSelector selectedClientId={selectedClientId} onClientChange={onClientChange} />
  ) : undefined;

  if (isMobile) {
    return (
      <Box className="flex w-full flex-col justify-center gap-1.5" key={viewType}>
        <SavedLayout
          key={`saved-layout-${viewType}`}
          toolbarLeading={clientToolbar}
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
      </Box>
    );
  }

  return (
    <SavedLayout
      toolbarLeading={clientToolbar}
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
  );
}
