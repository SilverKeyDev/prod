import { useCallback, useEffect, useState } from "react";

/**
 * Per-step expand/collapse for checklist rows (details + integration UI).
 * Seeds the active step(s) open so users land with full context; expand/collapse is purely
 * presentational and does not mutate checklist completion state.
 *
 * Completed steps are not auto-collapsed: users should always be able to reopen any step and
 * see the same in-step context (copy, integrations, footers) whether or not that step is
 * currently “active”, so they never lose available context while scanning the list.
 */
export function useChecklistStepExpansion(activeItemIds: readonly number[]): {
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
