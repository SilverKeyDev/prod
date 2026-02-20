import { useMemo } from "react";

import type { SavedPageViewType } from "packages/hooks/store/documents/useSavedPageView";

import type { SavedHomesHeaderProps } from "@/components/saved/SavedHomesHeader";

export type UseSavedPageMobileHeaderParams = {
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
 * Returns props for SavedHomesHeader for use in the mobile top bar.
 * Caller (SavedPage) builds the header node and sets it via setMobileHeaderActions.
 */
export function useSavedPageMobileHeader(
  params: UseSavedPageMobileHeaderParams,
): SavedHomesHeaderProps {
  const {
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
  } = params;

  const isLoading =
    viewType === "homes"
      ? loading
      : viewType === "documents"
        ? documentsLoadingState
        : loading;

  return useMemo<SavedHomesHeaderProps>(
    () => ({
      isMobile: true,
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
    ],
  );
}
