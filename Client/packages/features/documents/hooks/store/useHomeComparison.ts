import { useCallback, useEffect, useMemo } from "react";

import { useViewStore } from "packages/store";
import type { SavedHome } from "packages/types";
import { getWindow } from "packages/utils";

type UseHomeComparisonReturn = {
  selectedHomesForComparison: Set<string>;
  selectedHomesData: SavedHome[];
  handleToggleHomeSelection: (homeId: string) => void;
  handleRemoveFromComparison: (homeId: string) => void;
  handleClearComparison: () => void;
};

const SELECTION_KEY = "savedHomes.selectedIds";

/**
 * Hook for managing home comparison state with Zustand persistence
 * Uses viewStore.dropdownSelections (same pattern as checklists)
 */
export function useHomeComparison(homes: SavedHome[]): UseHomeComparisonReturn {
  const dropdownSelections = useViewStore((s) => s.dropdownSelections);
  const setDropdownSelection = useViewStore((s) => s.setDropdownSelection);
  const clearDropdownSelection = useViewStore((s) => s.clearDropdownSelection);

  // Get persisted selected IDs from Zustand store
  const persistedSelectedIds = useMemo(() => {
    const saved = dropdownSelections[SELECTION_KEY];
    if (Array.isArray(saved)) {
      return saved as string[];
    }
    return [];
  }, [dropdownSelections]);

  // Filter to only valid home IDs that exist in current homes list
  const selectedHomesForComparison = useMemo(() => {
    if (homes.length === 0) return new Set<string>();

    const validHomeIds = new Set(homes.map((h) => h.home_id));
    const validSelections = persistedSelectedIds.filter((id) => validHomeIds.has(id));

    return new Set(validSelections);
  }, [homes, persistedSelectedIds]);

  // Migrate from old localStorage key on first load (one-time migration). Web-only; RN-safe via getWindow.
  useEffect(() => {
    const win = getWindow();
    const loc = win?.localStorage;
    if (persistedSelectedIds.length === 0 && homes.length > 0 && loc) {
      try {
        const oldData = loc.getItem("compareHomesState");
        if (oldData) {
          const parsed = JSON.parse(oldData) as { selectedIds?: string[] };
          if (parsed.selectedIds && Array.isArray(parsed.selectedIds)) {
            const validHomeIds = new Set(homes.map((h) => h.home_id));
            const validSelections = parsed.selectedIds.filter((id) => validHomeIds.has(id));
            if (validSelections.length > 0) {
              setDropdownSelection(SELECTION_KEY, validSelections);
              loc.removeItem("compareHomesState");
            }
          }
        }
      } catch {
        try {
          loc.removeItem("compareHomesState");
        } catch {
          // ignore
        }
      }
    }
  }, [homes, persistedSelectedIds, setDropdownSelection]);

  // Sync store when homes change (clean up invalid selections)
  useEffect(() => {
    if (homes.length > 0 && persistedSelectedIds.length > 0) {
      const validHomeIds = new Set(homes.map((h) => h.home_id));
      const validSelections = persistedSelectedIds.filter((id) => validHomeIds.has(id));

      if (validSelections.length !== persistedSelectedIds.length) {
        if (validSelections.length > 0) {
          setDropdownSelection(SELECTION_KEY, validSelections);
        } else {
          clearDropdownSelection(SELECTION_KEY);
        }
      }
    }
  }, [homes, persistedSelectedIds, setDropdownSelection, clearDropdownSelection]);

  const handleToggleHomeSelection = useCallback(
    (homeId: string) => {
      const currentIds = Array.from(selectedHomesForComparison);
      const newIds = currentIds.includes(homeId)
        ? currentIds.filter((id) => id !== homeId)
        : [...currentIds, homeId];

      if (newIds.length > 0) {
        setDropdownSelection(SELECTION_KEY, newIds);
      } else {
        clearDropdownSelection(SELECTION_KEY);
      }
    },
    [selectedHomesForComparison, setDropdownSelection, clearDropdownSelection]
  );

  const handleRemoveFromComparison = useCallback(
    (homeId: string) => {
      const currentIds = Array.from(selectedHomesForComparison);
      const newIds = currentIds.filter((id) => id !== homeId);

      if (newIds.length > 0) {
        setDropdownSelection(SELECTION_KEY, newIds);
      } else {
        clearDropdownSelection(SELECTION_KEY);
      }
    },
    [selectedHomesForComparison, setDropdownSelection, clearDropdownSelection]
  );

  const handleClearComparison = useCallback(() => {
    clearDropdownSelection(SELECTION_KEY);
  }, [clearDropdownSelection]);

  // Get selected homes data
  const selectedHomesData = useMemo(
    () => homes.filter((home) => selectedHomesForComparison.has(home.home_id)),
    [homes, selectedHomesForComparison]
  );

  return {
    selectedHomesForComparison,
    selectedHomesData,
    handleToggleHomeSelection,
    handleRemoveFromComparison,
    handleClearComparison,
  };
}
