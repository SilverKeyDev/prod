import { useCallback, useEffect, useMemo } from "react";

import type { SearchResult } from "packages/features/search/types/result";
import { useViewStore } from "packages/store";

/** `viewStore.dropdownSelections` key; distinct from saved-page compare (`savedHomes.selectedIds`). */
export const AGENT_SEARCH_SHARE_BUNDLE_SELECTION_KEY = "search.agentShareBundle.selectedIds";

export type UseAgentSearchShareSelectionReturn = {
  selectedIds: Set<string>;
  selectedProperties: SearchResult[];
  toggleId: (propertyId: string) => void;
  removeId: (propertyId: string) => void;
  clear: () => void;
};

/**
 * Persists agent multi-select for “share bundle” on search results (sidebar).
 */
export function useAgentSearchShareSelection(
  results: SearchResult[]
): UseAgentSearchShareSelectionReturn {
  const dropdownSelections = useViewStore((s) => s.dropdownSelections);
  const setDropdownSelection = useViewStore((s) => s.setDropdownSelection);
  const clearDropdownSelection = useViewStore((s) => s.clearDropdownSelection);

  const persistedSelectedIds = useMemo(() => {
    const saved = dropdownSelections[AGENT_SEARCH_SHARE_BUNDLE_SELECTION_KEY];
    if (Array.isArray(saved)) {
      return saved as string[];
    }
    return [];
  }, [dropdownSelections]);

  const selectedIds = useMemo(() => {
    if (results.length === 0) return new Set<string>();
    const valid = new Set(results.map((p) => p.id));
    return new Set(persistedSelectedIds.filter((id) => valid.has(id)));
  }, [results, persistedSelectedIds]);

  useEffect(() => {
    if (results.length > 0 && persistedSelectedIds.length > 0) {
      const valid = new Set(results.map((p) => p.id));
      const next = persistedSelectedIds.filter((id) => valid.has(id));
      if (next.length !== persistedSelectedIds.length) {
        if (next.length > 0) {
          setDropdownSelection(AGENT_SEARCH_SHARE_BUNDLE_SELECTION_KEY, next);
        } else {
          clearDropdownSelection(AGENT_SEARCH_SHARE_BUNDLE_SELECTION_KEY);
        }
      }
    }
  }, [results, persistedSelectedIds, setDropdownSelection, clearDropdownSelection]);

  const toggleId = useCallback(
    (propertyId: string) => {
      const current = Array.from(selectedIds);
      const next = current.includes(propertyId)
        ? current.filter((id) => id !== propertyId)
        : [...current, propertyId];
      if (next.length > 0) {
        setDropdownSelection(AGENT_SEARCH_SHARE_BUNDLE_SELECTION_KEY, next);
      } else {
        clearDropdownSelection(AGENT_SEARCH_SHARE_BUNDLE_SELECTION_KEY);
      }
    },
    [selectedIds, setDropdownSelection, clearDropdownSelection]
  );

  const removeId = useCallback(
    (propertyId: string) => {
      const next = Array.from(selectedIds).filter((id) => id !== propertyId);
      if (next.length > 0) {
        setDropdownSelection(AGENT_SEARCH_SHARE_BUNDLE_SELECTION_KEY, next);
      } else {
        clearDropdownSelection(AGENT_SEARCH_SHARE_BUNDLE_SELECTION_KEY);
      }
    },
    [selectedIds, setDropdownSelection, clearDropdownSelection]
  );

  const clear = useCallback(() => {
    clearDropdownSelection(AGENT_SEARCH_SHARE_BUNDLE_SELECTION_KEY);
  }, [clearDropdownSelection]);

  const selectedProperties = useMemo(
    () => results.filter((p) => selectedIds.has(p.id)),
    [results, selectedIds]
  );

  return {
    selectedIds,
    selectedProperties,
    toggleId,
    removeId,
    clear,
  };
}
