import { useCallback, useEffect, useState } from "react";

/**
 * Per-step expand/collapse for checklist rows (details + integration).
 * Keeps active step(s) expanded; drops checked steps from the expanded set.
 */
export function useChecklistStepExpansion(
  activeItemIds: readonly number[],
  checkedIds: number[]
): {
  expandedIds: ReadonlySet<number>;
  toggleExpand: (id: number) => void;
  isExpanded: (id: number) => boolean;
} {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set(activeItemIds));

  useEffect(() => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      for (const id of activeItemIds) next.add(id);
      return next;
    });
  }, [activeItemIds]);

  useEffect(() => {
    setExpandedIds((prev) => {
      if (checkedIds.length === 0) return prev;
      const next = new Set(prev);
      let changed = false;
      for (const id of checkedIds) {
        if (next.has(id)) {
          next.delete(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [checkedIds]);

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isExpanded = useCallback((id: number) => expandedIds.has(id), [expandedIds]);

  return { expandedIds, toggleExpand, isExpanded };
}
