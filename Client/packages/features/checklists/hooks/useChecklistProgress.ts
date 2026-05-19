import { useCallback, useMemo } from "react";

import {
  useChecklistData,
  type UseChecklistDataOptions,
} from "packages/features/checklists/hooks/data/useChecklistData";
import type { ChecklistTab } from "packages/features/checklists/types/checklists";
import { computeOverallChecklistProgress } from "packages/features/checklists/utils/progress/computeOverallChecklistProgress";
import {
  type ChecklistItemToggleEligibility,
  getChecklistItemToggleEligibility,
} from "packages/features/checklists/utils/rules/checklistRules";
import {
  SECTION_CONFIG,
  SECTION_ORDER,
} from "packages/features/checklists/utils/rules/sectionConfig";
import { sortTaskChecklistItems } from "packages/features/checklists/utils/sort/sortTaskChecklistItems";

export type UseChecklistProgressReturn = {
  currentSection: ChecklistTab;
  currentItem: (section: ChecklistTab) => number | null;
  isSectionUnlocked: (section: ChecklistTab) => boolean;
  /**
   * Next incomplete step may be completed (checkbox or submit). Prefer getItemToggleEligibility;
   * this mirrors `canMarkChecked` for unchecked items.
   */
  isItemCheckable: (section: ChecklistTab, itemId: number) => boolean;
  getItemToggleEligibility: (
    section: ChecklistTab,
    itemId: number
  ) => ChecklistItemToggleEligibility;
  sectionProgress: Record<ChecklistTab, { completed: number; total: number; isComplete: boolean }>;
  overallProgress: { completed: number; total: number; percent: number };
  isLoading: boolean;
};

export function useChecklistProgress(
  options?: UseChecklistDataOptions
): UseChecklistProgressReturn {
  const isAgentViewer = options?.isAgentViewer === true;
  const searchData = useChecklistData("search", options);
  const offerData = useChecklistData("offer", options);
  const escrowData = useChecklistData("escrow", options);
  const insuranceData = useChecklistData("insurance", options);
  const financingData = useChecklistData("financing", options);
  const closingData = useChecklistData("closing", options);

  const sectionData = useMemo(
    () => ({
      search: searchData,
      offer: offerData,
      escrow: escrowData,
      inspections: insuranceData,
      financing: financingData,
      closing: closingData,
    }),
    [searchData, offerData, escrowData, insuranceData, financingData, closingData]
  );

  const sectionProgress = useMemo(() => {
    const progress: Record<
      ChecklistTab,
      { completed: number; total: number; isComplete: boolean }
    > = {} as Record<ChecklistTab, { completed: number; total: number; isComplete: boolean }>;
    for (const tab of SECTION_ORDER) {
      const data = sectionData[tab];
      const total = data.items.length;
      const completed = data.checkedIds.length;
      progress[tab] = {
        completed,
        total,
        isComplete: total > 0 && completed >= total,
      };
    }
    return progress;
  }, [sectionData]);

  const overallProgress = useMemo(
    () => computeOverallChecklistProgress(sectionProgress),
    [sectionProgress]
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
      const data = sectionData[section];
      const items = sortTaskChecklistItems(data.items);
      return getChecklistItemToggleEligibility(
        items,
        data.checkedIds,
        itemId,
        isSectionUnlocked(section),
        { isAgentViewer }
      );
    },
    [isAgentViewer, sectionData, isSectionUnlocked]
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
      const data = sectionData[section];
      const items = sortTaskChecklistItems(data.items);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!data.checkedIds.includes(item.id) && isItemCheckable(section, item.id)) {
          return item.id;
        }
      }
      return null;
    },
    [sectionData, isItemCheckable]
  );

  const isLoading =
    searchData.isLoading ||
    offerData.isLoading ||
    escrowData.isLoading ||
    insuranceData.isLoading ||
    financingData.isLoading ||
    closingData.isLoading;

  return {
    currentSection,
    currentItem,
    isSectionUnlocked,
    isItemCheckable,
    getItemToggleEligibility,
    sectionProgress,
    overallProgress,
    isLoading,
  };
}
