import { useFiltersStore, toQueryParams } from '../../store/filters.slice';

/**
 * Hook to derive stable, serializable filter params for query keys.
 * Keeps components from prop-drilling filter state.
 */
export function useFiltersQueryParams() {
  const searchStage = useFiltersStore((s) => s.searchStage);
  const favoriteAddresses = useFiltersStore((s) => s.favoriteAddresses);
  const currentPage = useFiltersStore((s) => s.currentPage);
  return toQueryParams({ searchStage, favoriteAddresses, currentPage });
}
