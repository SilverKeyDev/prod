import { useLocalization } from "packages/contexts";
import type { SavedPageViewType } from "packages/features/documents";
import type { LibraryViewMode } from "packages/features/saved/hooks/ui/useLibraryViewMode";
import AgentSelector from "packages/ui/components/actions/button/propertyActions/AgentSelector";
import { Box } from "packages/ui/components/structure/primitives";
import { ClientSelector } from "@/components/ui";
import SavedLayout from "./SavedLayout";

export type SavedHomesHeaderProps = {
  isMobile: boolean;
  isAgent: boolean;
  isBrokerageWorkspace?: boolean;
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
  selectedAgentId?: string | null;
  onAgentChange?: (agentId: string | null) => void;
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
  isBrokerageWorkspace = false,
  searchTerm,
  onSearchChange,
  viewType,
  onViewTypeChange,
  onRefresh,
  isRefreshing,
  isLoading,
  homesCount: _homesCount,
  documentsCount: _documentsCount,
  selectedClientId,
  onClientChange,
  selectedAgentId = null,
  onAgentChange,
  eventTypeFilter = "",
  onEventTypeFilterChange,
  libraryViewMode,
  onLibraryViewModeChange,
  showLibraryViewToggle,
  librarySortKey,
  onLibrarySortChange,
}: SavedHomesHeaderProps) {
  const { t } = useLocalization();
  const searchPlaceholder =
    viewType === "agreements"
      ? "Search agreements..."
      : viewType === "documents"
        ? "Search documents..."
        : "Search...";

  return (
    <SavedLayout
      isMobile={isMobile}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder={searchPlaceholder}
      viewType={viewType}
      onViewTypeChange={onViewTypeChange}
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
      isLoading={isLoading}
      eventTypeFilter={eventTypeFilter}
      onEventTypeFilterChange={onEventTypeFilterChange}
      libraryViewMode={libraryViewMode}
      onLibraryViewModeChange={onLibraryViewModeChange}
      showLibraryViewToggle={showLibraryViewToggle}
      librarySortKey={librarySortKey}
      onLibrarySortChange={onLibrarySortChange}
    >
      {isBrokerageWorkspace && onAgentChange ? (
        <AgentSelector
          selectedAgentId={selectedAgentId}
          onAgentChange={onAgentChange}
        />
      ) : isAgent ? (
        <ClientSelector selectedClientId={selectedClientId} onClientChange={onClientChange} />
      ) : null}
    </SavedLayout>
  );
}