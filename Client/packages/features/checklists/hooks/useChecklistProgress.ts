import { useCallback, useMemo } from "react";

import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";
import { useChecklistData } from "packages/features/checklists/hooks/data/useChecklistData";
import type { ChecklistTab } from "packages/features/checklists/types/checklists";
import { SECTION_CONFIG, SECTION_ORDER } from "packages/features/checklists/utils/sectionConfig";

function sortItemsByOrder(items: TaskChecklistItem[]): TaskChecklistItem[] {
  return [...items].sort((a, b) => {
    const orderA = a.order ?? items.indexOf(a);
    const orderB = b.order ?? items.indexOf(b);
    return orderA - orderB;
  });
}

export type UseChecklistProgressReturn = {
  currentSection: ChecklistTab;
  currentItem: (section: ChecklistTab) => number | null;
  isSectionUnlocked: (section: ChecklistTab) => boolean;
  isItemCheckable: (section: ChecklistTab, itemId: number) => boolean;
  sectionProgress: Record<ChecklistTab, { completed: number; total: number; isComplete: boolean }>;
  isLoading: boolean;
};

export function useChecklistProgress(): UseChecklistProgressReturn {
  const searchData = useChecklistData("search");
  const offerData = useChecklistData("offer");
  const escrowData = useChecklistData("escrow");
  const insuranceData = useChecklistData("insurance");
  const financingData = useChecklistData("financing");
  const closingData = useChecklistData("closing");

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

  const isItemCheckable = useCallback(
    (section: ChecklistTab, itemId: number): boolean => {
      if (!isSectionUnlocked(section)) return false;
      const data = sectionData[section];
      const items = sortItemsByOrder(data.items);
      const item = items.find((i) => i.id === itemId);
      if (!item) return false;
      if (item.allow_unordered_check) return true;
      const itemIndex = items.findIndex((i) => i.id === itemId);
      for (let i = 0; i < itemIndex; i++) {
        const prevId = items[i].id;
        if (!data.checkedIds.includes(prevId)) return false;
      }
      return true;
    },
    [sectionData, isSectionUnlocked]
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
      const items = sortItemsByOrder(data.items);
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
    sectionProgress,
    isLoading,
  };
}
