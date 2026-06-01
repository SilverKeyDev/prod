import { useMemo } from "react";

import type { SavedPageViewType } from "packages/features/documents";
import type { SavedHomesHeaderProps } from "packages/features/saved/components/header/SavedHomesHeader";

export type UseSavedPageMobileHeaderParams = {
  isAgent: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  viewType: SavedPageViewType;
  setViewType: (view: SavedPageViewType) => void;
  refresh: () => void;
  refreshing: boolean;
  documentsLoadingState: boolean;
  filteredHomesLength: number;
  documentsLength: number;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  eventTypeFilter?: "listed" | "price_change" | "sold" | "withdrawn" | "";
  setEventTypeFilter?: (eventType: "listed" | "price_change" | "sold" | "withdrawn" | "") => void;
};

/**
 * Returns props for SavedHomesHeader for use in the mobile top bar.
 * Caller (SavedPage) builds the header node and sets it via setMobileHeaderActions.
 */
export function useSavedPageMobileHeader(
  params: UseSavedPageMobileHeaderParams
): SavedHomesHeaderProps {
  const {
    isAgent,
    searchTerm,
    setSearchTerm,
    viewType,
    setViewType,
    refresh,
    refreshing,
    documentsLoadingState,
    filteredHomesLength,
    documentsLength,
    selectedClientId,
    setSelectedClientId,
    eventTypeFilter = "",
    setEventTypeFilter,
  } = params;

  const isLoading =
    viewType === "documents" || viewType === "agreements" ? documentsLoadingState : false;

  return useMemo<SavedHomesHeaderProps>(
    () => ({
      isMobile: true,
      isAgent,
      searchTerm,
      onSearchChange: setSearchTerm,
      viewType,
      onViewTypeChange: setViewType,
      onRefresh: refresh,
      isRefreshing: refreshing,
      isLoading,
      homesCount: filteredHomesLength,
      documentsCount: documentsLength,
      selectedClientId,
      onClientChange: setSelectedClientId,
      eventTypeFilter,
      onEventTypeFilterChange: setEventTypeFilter,
    }),
    [
      isAgent,
      searchTerm,
      setSearchTerm,
      viewType,
      setViewType,
      refresh,
      refreshing,
      isLoading,
      filteredHomesLength,
      documentsLength,
      selectedClientId,
      setSelectedClientId,
      eventTypeFilter,
      setEventTypeFilter,
    ]
  );
}
