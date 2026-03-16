import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Icon } from "@ui/icons";

import {
  type ChecklistType,
  useChecklistData,
  useChecklistProgress,
} from "packages/features/checklists";
import {
  CHECKLIST_SUBTITLES,
  CHECKLIST_TITLES,
  type ChecklistTab,
} from "packages/features/checklists";
import { useViewStore, type ViewState } from "packages/store";
import ClientSelector from "packages/ui/components/button/ClientSelector";
import Card from "packages/ui/components/cards/Card";
import { Box, Loading, Pressable, Text } from "packages/ui/components/primitives";

import DashboardChecklistsHeader from "./DashboardChecklistsHeader";

const CHECKLIST_TABS: ChecklistTab[] = [
  "search",
  "offer",
  "escrow",
  "inspections",
  "financing",
  "closing",
];

const TAB_TO_CHECKLIST_TYPE: Record<ChecklistTab, ChecklistType> = {
  search: "search",
  offer: "offer",
  escrow: "escrow",
  inspections: "insurance",
  financing: "financing",
  closing: "closing",
};

export default function DashboardChecklists() {
  const { currentSection, isSectionUnlocked, isItemCheckable } = useChecklistProgress();
  const persistedTab = useViewStore(
    (s: ViewState) => s.dropdownSelections["buyerChecklists.activeTab"] as ChecklistTab | undefined
  );
  const setDropdownSelection = useViewStore((s: ViewState) => s.setDropdownSelection);

  const initialTab = useMemo<ChecklistTab>(() => {
    if (persistedTab && CHECKLIST_TABS.includes(persistedTab)) {
      return persistedTab;
    }
    return currentSection;
  }, [persistedTab, currentSection]);

  const [activeTab, setActiveTab] = useState<ChecklistTab>(initialTab);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  useEffect(() => {
    setDropdownSelection("buyerChecklists.activeTab", activeTab as string);
  }, [activeTab, setDropdownSelection]);

  const checklistType = useMemo<ChecklistType>(() => TAB_TO_CHECKLIST_TYPE[activeTab], [activeTab]);

  const { items, checkedIds, isLoading, error, toggleItem, refreshChecklist } =
    useChecklistData(checklistType);

  const sortedItems = useMemo(() => {
    const indexMap = new Map(items.map((it, i) => [it.id, i]));
    return [...items].sort((a, b) => {
      const orderA = a.order ?? indexMap.get(a.id) ?? 0;
      const orderB = b.order ?? indexMap.get(b.id) ?? 0;
      return orderA - orderB;
    });
  }, [items]);

  const completedCount = checkedIds.length;
  const totalCount = items.length;
  const isSectionLocked = !isSectionUnlocked(activeTab);

  const handleTabChange = useCallback((tab: ChecklistTab) => {
    setActiveTab(tab);
  }, []);

  const handleToggleItem = useCallback(
    async (id: number) => {
      if (!isItemCheckable(activeTab, id)) return;
      await toggleItem(id);
    },
    [toggleItem, isItemCheckable, activeTab]
  );

  const handleRefresh = useCallback(async () => {
    await refreshChecklist();
  }, [refreshChecklist]);

  return (
    <Box className="flex w-full flex-row flex-col gap-3">
      <Box className="mb-2">
        <ClientSelector selectedClientId={selectedClientId} onClientChange={setSelectedClientId} />
      </Box>

      <DashboardChecklistsHeader
        title={CHECKLIST_TITLES[activeTab]}
        subtitle={CHECKLIST_SUBTITLES[activeTab] ?? CHECKLIST_SUBTITLES.search}
        completedCount={completedCount}
        totalCount={totalCount}
        loading={isLoading}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isSectionUnlocked={isSectionUnlocked}
      />

      <Card className="bg-gray-50" padding="md" hover={false}>
        {isLoading ? (
          <Box className="flex flex-row items-center justify-center py-12">
            <Loading />
          </Box>
        ) : error ? (
          <Box className="flex flex-row flex-col gap-3">
            <Text className="text-sm text-red-500">{error}</Text>
            <Pressable
              onPress={handleRefresh}
              className="bg-brand-accent self-start rounded-lg px-4 py-2"
            >
              <Text className="text-sm font-medium text-white">Retry</Text>
            </Pressable>
          </Box>
        ) : items.length === 0 ? (
          <Box className="flex flex-row items-center justify-center py-12">
            <Text className="text-warm-stone text-base">No checklist items yet.</Text>
          </Box>
        ) : (
          <Box className="flex flex-row flex-col gap-4">
            {isSectionLocked && (
              <Box className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <Text className="text-sm text-amber-800">
                  Complete all items in the previous section to unlock this section.
                </Text>
              </Box>
            )}
            {sortedItems.map((item) => {
              const checked = checkedIds.includes(item.id);
              const checkable = isItemCheckable(activeTab, item.id);
              return (
                <Box key={item.id} className="m-3 w-full">
                  <Pressable
                    onPress={() => {
                      void handleToggleItem(item.id);
                    }}
                    disabled={!checkable}
                    // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
                    className={`flex w-full flex-row items-stretch rounded-lg border border-gray-200 shadow-sm ${checkable ? "bg-white hover:shadow-md active:opacity-90 active:shadow-lg" : "cursor-not-allowed bg-gray-50 opacity-75"}`}
                  >
                    <Box className="flex min-w-0 flex-1 flex-row items-start gap-4 px-4 py-3">
                      <Box
                        // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
                        className={`mt-0.5 flex h-6 w-6 flex-row items-center justify-center rounded-md border-2 ${checked ? "border-brand-accent bg-brand-accent" : checkable ? "border-gray-300 bg-white hover:border-gray-400 active:border-gray-500 active:opacity-90" : "border-gray-200 bg-gray-100"}`}
                      >
                        {checked ? (
                          <Text className="text-sm font-bold text-white">✓</Text>
                        ) : !checkable ? (
                          <Icon name="lock" className="h-3 w-3 text-gray-400" />
                        ) : null}
                      </Box>
                      <Box className="min-w-0 flex-1 text-left">
                        <Text className="text-base font-semibold leading-relaxed text-gray-900">
                          {item.label}
                        </Text>
                        {!checked && (
                          <>
                            {item.explanation ? (
                              <Text className="text-warm-stone mt-1.5 text-sm leading-relaxed">
                                {item.explanation}
                              </Text>
                            ) : null}
                            {item.bullets && item.bullets.length > 0 ? (
                              <Box className="mt-1.5 flex flex-row flex-col gap-1.5">
                                {item.bullets.map((bullet) => (
                                  <Box key={bullet} className="flex flex-row items-start gap-2">
                                    <Text className="text-warm-stone mt-0.5 text-sm leading-none">
                                      •
                                    </Text>
                                    <Text className="text-warm-stone flex-1 text-sm leading-relaxed">
                                      {bullet}
                                    </Text>
                                  </Box>
                                ))}
                              </Box>
                            ) : null}
                            {item.tip ? (
                              <Text className="text-olive-700 mt-1.5 text-sm font-medium leading-relaxed">
                                {item.tip}
                              </Text>
                            ) : null}
                          </>
                        )}
                      </Box>
                    </Box>
                  </Pressable>
                </Box>
              );
            })}
          </Box>
        )}
      </Card>
    </Box>
  );
}
