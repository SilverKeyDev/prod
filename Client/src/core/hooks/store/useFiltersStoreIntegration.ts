import { useFiltersStore } from '../../store/filters.slice';

/**
 * Hook that integrates filters data with useFiltersStore
 * This replaces the FiltersProvider functionality
 * 
 * Note: Filters don't have a dedicated data hook yet,
 * so this integration hook primarily manages the store state
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
  } = useFiltersStore();

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
