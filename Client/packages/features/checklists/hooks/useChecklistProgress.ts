import { useCallback, useMemo } from "react";

import {
  useChecklistData,
  type UseChecklistDataOptions,
  type UseChecklistDataReturn,
} from "packages/features/checklists/hooks/data/useChecklistData";
import { useChecklistProgressSummary } from "packages/features/checklists/hooks/data/useChecklistProgressSummary";
import type { ChecklistTab } from "packages/features/checklists/types/checklists";
import { computeOverallChecklistProgress } from "packages/features/checklists/utils/progress/computeOverallChecklistProgress";
import {
  type ChecklistItemToggleEligibility,
  getChecklistItemToggleEligibility,
} from "packages/features/checklists/utils/rules/checklistRules";
import { CHECKLIST_TAB_TO_TYPE } from "packages/features/checklists/utils/rules/checklistTypeTab";
import {
  SECTION_CONFIG,
  SECTION_ORDER,
} from "packages/features/checklists/utils/rules/sectionConfig";
import { sortTaskChecklistItems } from "packages/features/checklists/utils/sort/sortTaskChecklistItems";

export type UseChecklistProgressOptions = UseChecklistDataOptions & {
  /** When set, loads full checklist data for toggle eligibility and active section UI. */
  activeSection?: ChecklistTab;
};

export type UseChecklistProgressReturn = {
  currentSection: ChecklistTab;
  currentItem: (section: ChecklistTab) => number | null;
  isSectionUnlocked: (section: ChecklistTab) => boolean;
  isItemCheckable: (section: ChecklistTab, itemId: number) => boolean;
  getItemToggleEligibility: (
    section: ChecklistTab,
    itemId: number
  ) => ChecklistItemToggleEligibility;
  sectionProgress: Record<ChecklistTab, { completed: number; total: number; isComplete: boolean }>;
  overallProgress: { completed: number; total: number; percent: number };
  isLoading: boolean;
  /** Present when `activeSection` is set on options. */
  items: UseChecklistDataReturn["items"];
  checkedIds: UseChecklistDataReturn["checkedIds"];
  activeItemId: UseChecklistDataReturn["activeItemId"];
  activeItemIds: UseChecklistDataReturn["activeItemIds"];
  isChecklistUpdatePending: UseChecklistDataReturn["isChecklistUpdatePending"];
  error: string | null;
  toggleItem: UseChecklistDataReturn["toggleItem"];
  refreshChecklist: UseChecklistDataReturn["refreshChecklist"];
};

const EMPTY_TOGGLE_ELIGIBILITY: ChecklistItemToggleEligibility = {
  canCheck: false,
  canUncheck: false,
  canMarkChecked: false,
};

function mapSummaryToSectionProgress(
  apiSections: Record<string, { completed: number; total: number; isComplete: boolean }> | undefined
): Record<ChecklistTab, { completed: number; total: number; isComplete: boolean }> {
  const progress = {} as Record<
    ChecklistTab,
    { completed: number; total: number; isComplete: boolean }
  >;
  for (const tab of SECTION_ORDER) {
    const type = CHECKLIST_TAB_TO_TYPE[tab];
    const slice = apiSections?.[type];
    progress[tab] = slice ?? { completed: 0, total: 0, isComplete: false };
  }
  return progress;
}

export function useChecklistProgress(
  options?: UseChecklistProgressOptions
): UseChecklistProgressReturn {
  const isAgentViewer = options?.isAgentViewer === true;
  const activeSection = options?.activeSection;

  const {
    summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useChecklistProgressSummary(options);

  const activeChecklistType =
    activeSection != null ? CHECKLIST_TAB_TO_TYPE[activeSection] : "search";

  const activeData = useChecklistData(activeChecklistType, {
    ...options,
    enabled: activeSection != null,
  });

  const sectionProgress = useMemo(
    () => mapSummaryToSectionProgress(summary?.sections),
    [summary?.sections]
  );

  const overallProgress = useMemo(
    () =>
      summary?.overall ??
      computeOverallChecklistProgress(
        Object.fromEntries(
          SECTION_ORDER.map((tab) => [
            tab,
            { completed: sectionProgress[tab].completed, total: sectionProgress[tab].total },
          ])
        ) as Record<ChecklistTab, { completed: number; total: number }>
      ),
    [summary?.overall, sectionProgress]
  );

  const isSectionUnlocked = useCallback(
    (section: ChecklistTab): boolean => {
      const config = SECTION_CONFIG[section];
      for (const req of config.unlockRequiresSections) {
        if (!sectionProgress[req]?.isComplete) {
          return false;
        }
      }
      return true;
    },
    [sectionProgress]
  );

  const getItemToggleEligibility = useCallback(
    (section: ChecklistTab, itemId: number): ChecklistItemToggleEligibility => {
      if (activeSection == null || section !== activeSection) {
        return EMPTY_TOGGLE_ELIGIBILITY;
      }
      const items = sortTaskChecklistItems(activeData.items);
      return getChecklistItemToggleEligibility(
        items,
        activeData.checkedIds,
        itemId,
        isSectionUnlocked(section),
        { isAgentViewer }
      );
    },
    [activeSection, activeData.items, activeData.checkedIds, isAgentViewer, isSectionUnlocked]
  );

  const isItemCheckable = useCallback(
    (section: ChecklistTab, itemId: number): boolean =>
      getItemToggleEligibility(section, itemId).canMarkChecked,
    [getItemToggleEligibility]
  );

  const currentSection = useMemo((): ChecklistTab => {
    for (const tab of SECTION_ORDER) {
      if (!sectionProgress[tab]?.isComplete) return tab;
    }
    return SECTION_ORDER[SECTION_ORDER.length - 1];
  }, [sectionProgress]);

  const currentItem = useCallback(
    (section: ChecklistTab): number | null => {
      if (activeSection == null || section !== activeSection) {
        return null;
      }
      const items = sortTaskChecklistItems(activeData.items);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!activeData.checkedIds.includes(item.id) && isItemCheckable(section, item.id)) {
          return item.id;
        }
      }
      return null;
    },
    [activeSection, activeData.items, activeData.checkedIds, isItemCheckable]
  );

  const isLoading = summaryLoading || (activeSection != null && activeData.isLoading);
  const error = summaryError ?? (activeSection != null ? activeData.error : null);

  return {
    currentSection,
    currentItem,
    isSectionUnlocked,
    isItemCheckable,
    getItemToggleEligibility,
    sectionProgress,
    overallProgress,
    isLoading,
    items: activeData.items,
    checkedIds: activeData.checkedIds,
    activeItemId: activeData.activeItemId,
    activeItemIds: activeData.activeItemIds,
    isChecklistUpdatePending: activeData.isChecklistUpdatePending,
    error,
    toggleItem: activeData.toggleItem,
    refreshChecklist: activeData.refreshChecklist,
  };
}
