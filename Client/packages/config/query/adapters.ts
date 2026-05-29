import { toConsolidatedQueryParams, useConsolidatedSearchStore } from "packages/store";

/**
 * Hook to derive stable, serializable filter params for query keys.
 * Keeps components from prop-drilling filter state.
 */
export function useFiltersQueryParams() {
  const searchStage = useConsolidatedSearchStore((s) => s.searchStage);
  const favoriteAddresses = useConsolidatedSearchStore((s) => s.favoriteAddresses);
  const currentPage = useConsolidatedSearchStore((s) => s.currentPage);
  const activeTab = useConsolidatedSearchStore((s) => s.activeTab);
  return toConsolidatedQueryParams({ searchStage, favoriteAddresses, currentPage, activeTab });
}
