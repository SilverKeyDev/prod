import type { SavedPageViewType } from "packages/features/documents";
import type { LibraryViewMode } from "packages/features/saved/hooks/ui/useLibraryViewMode";
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
  libraryViewMode: LibraryViewMode;
  onLibraryViewModeChange: (mode: LibraryViewMode) => void;
  showLibraryViewToggle: boolean;
  librarySortKey: string;
  onLibrarySortChange: (value: string) => void;
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
  libraryViewMode,
  onLibraryViewModeChange,
  showLibraryViewToggle,
  librarySortKey,
  onLibrarySortChange,
}: SavedHomesHeaderProps) {
  const searchPlaceholder =
    viewType === "homes"
      ? "Search saved homes..."
      : viewType === "agreements"
        ? "Search agreements..."
        : viewType === "documents"
          ? "Search documents..."
          : viewType === "forms-library"
            ? ""
            : "Filter by address";

  const refreshTitle =
    viewType === "homes"
      ? "Refresh saved homes"
      : viewType === "agreements"
        ? "Refresh agreements"
        : viewType === "forms-library"
          ? "Refresh"
          : "Refresh documents";

  const rightText =
    viewType === "homes"
      ? `${homesCount} saved`
      : viewType === "documents"
        ? `${documentsCount} documents`
        : viewType === "agreements"
          ? `${documentsCount} agreements`
          : "";

  const clientToolbar = isAgent ? (
    <ClientSelector selectedClientId={selectedClientId} onClientChange={onClientChange} />
  ) : undefined;

  if (isMobile) {
    return (
      <Box className="flex w-full flex-col justify-center gap-1.5" key={viewType}>
        <SavedLayout
          key={`saved-layout-${viewType}`}
          isAgent={isAgent}
          toolbarLeading={clientToolbar}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          showSearch={false}
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
          viewMode={libraryViewMode}
          onViewModeChange={onLibraryViewModeChange}
          showViewToggle={showLibraryViewToggle}
          librarySortKey={librarySortKey}
          onLibrarySortChange={onLibrarySortChange}
        />
      </Box>
    );
  }

  return (
    <SavedLayout
      isAgent={isAgent}
      toolbarLeading={clientToolbar}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder={searchPlaceholder}
      showSearch={viewType !== "forms-library"}
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
      viewMode={libraryViewMode}
      onViewModeChange={onLibraryViewModeChange}
      showViewToggle={showLibraryViewToggle}
      librarySortKey={librarySortKey}
      onLibrarySortChange={onLibrarySortChange}
    />
  );
}
