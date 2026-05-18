import { useCallback, useEffect, useState } from "react";

export type UseChecklistStepExpansionOptions = {
  /**
   * When true, only the first id in `activeItemIds` is auto-expanded (initial load and when
   * actives refresh). Other parallel “do now” steps stay collapsed until the user opens them.
   */
  expandFirstActiveOnly?: boolean;
};

function seedExpandedIds(
  activeItemIds: readonly number[],
  expandFirstActiveOnly: boolean
): Set<number> {
  if (activeItemIds.length === 0) return new Set();
  if (expandFirstActiveOnly) {
    const first = activeItemIds[0];
    return first === undefined ? new Set() : new Set([first]);
  }
  return new Set(activeItemIds);
}

/**
 * Per-step expand/collapse for checklist rows (details + integration UI).
 * Seeds the active step(s) open so users land with full context; expand/collapse is purely
 * presentational and does not mutate checklist completion state.
 *
 * Completed steps are not auto-collapsed: users should always be able to reopen any step and
 * see the same in-step context (copy, integrations, footers) whether or not that step is
 * currently “active”, so they never lose available context while scanning the list.
 */
export function useChecklistStepExpansion(
  activeItemIds: readonly number[],
  options?: UseChecklistStepExpansionOptions
): {
  expandedIds: ReadonlySet<number>;
  toggleExpand: (id: number) => void;
  isExpanded: (id: number) => boolean;
} {
  const expandFirstActiveOnly = options?.expandFirstActiveOnly === true;
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() =>
    seedExpandedIds(activeItemIds, expandFirstActiveOnly)
  );

  useEffect(() => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (expandFirstActiveOnly) {
        const first = activeItemIds[0];
        if (first !== undefined) next.add(first);
      } else {
        for (const id of activeItemIds) next.add(id);
      }
      return next;
    });
  }, [activeItemIds, expandFirstActiveOnly]);

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
