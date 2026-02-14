import { useEffect } from "react";
import SavedHomesHeader from "../../../components/saved/SavedHomesHeader";
import type { SavedPageViewType } from "../../../../../packages/hooks/store/documents/useSavedPageView";

type UseSavedPageMobileHeaderProps = {
  isMobile: boolean;
  setMobileHeaderActions?: React.Dispatch<
    React.SetStateAction<React.ReactNode | null>
  >;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  viewType: SavedPageViewType;
  setViewType: (view: SavedPageViewType) => void;
  refresh: () => void;
  refreshing: boolean;
  loading: boolean;
  documentsLoadingState: boolean;
  filteredHomesLength: number;
  documentsLength: number;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  eventTypeFilter?: "listed" | "price_change" | "sold" | "withdrawn" | "";
  setEventTypeFilter?: (
    eventType: "listed" | "price_change" | "sold" | "withdrawn" | "",
  ) => void;
};

/**
 * Hook for managing mobile header actions
 */
export function useSavedPageMobileHeader({
  isMobile,
  setMobileHeaderActions,
  searchTerm,
  setSearchTerm,
  viewType,
  setViewType,
  refresh,
  refreshing,
  loading,
  documentsLoadingState,
  filteredHomesLength,
  documentsLength,
  selectedClientId,
  setSelectedClientId,
  eventTypeFilter = "",
  setEventTypeFilter,
}: UseSavedPageMobileHeaderProps) {
  useEffect(() => {
    if (isMobile && setMobileHeaderActions) {
      setMobileHeaderActions(
        <SavedHomesHeader
          isMobile={true}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          viewType={viewType}
          onViewTypeChange={setViewType}
          onRefresh={refresh}
          isRefreshing={refreshing}
          isLoading={
            viewType === "homes"
              ? loading
              : viewType === "documents"
                ? documentsLoadingState
                : loading
          }
          homesCount={filteredHomesLength}
          documentsCount={documentsLength}
          selectedClientId={selectedClientId}
          onClientChange={setSelectedClientId}
          eventTypeFilter={eventTypeFilter}
          onEventTypeFilterChange={setEventTypeFilter}
        />,
      );
    } else if (setMobileHeaderActions) {
      setMobileHeaderActions(null);
    }
  }, [
    isMobile,
    setMobileHeaderActions,
    searchTerm,
    viewType,
    refreshing,
    loading,
    documentsLoadingState,
    filteredHomesLength,
    documentsLength,
    refresh,
    selectedClientId,
    setSearchTerm,
    setViewType,
    setSelectedClientId,
    eventTypeFilter,
    setEventTypeFilter,
  ]);
}
