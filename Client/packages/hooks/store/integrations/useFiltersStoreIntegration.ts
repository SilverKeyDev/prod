import { useConsolidatedSearchStore } from "packages/store";

/**
 * Hook that integrates search pagination/tab state with useConsolidatedSearchStore.
 * This replaces the FiltersProvider functionality for shared search UI state.
 *
 * Map/display filter fields (sort order, commute overlay, etc.) remain on useFiltersStore.
 */
export function useFiltersStoreIntegration() {
  const {
    activeTab,
    currentPage,
    favoriteAddresses,
    searchStage,
    isSearching,
    setActiveTab,
    setCurrentPage,
    setFavoriteAddresses,
    setSearchStage,
    setIsSearching,
    isHomeSaved,
  } = useConsolidatedSearchStore();

  // Expose the store state and actions
  return {
    // State
    activeTab,
    currentPage,
    favoriteAddresses,
    searchStage,
    isSearching,

    // Actions
    setActiveTab,
    setCurrentPage,
    setFavoriteAddresses,
    setSearchStage,
    setIsSearching,
    isHomeSaved,
  };
}
