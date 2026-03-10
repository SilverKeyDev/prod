import React, { useCallback, useEffect, useMemo, useState } from "react";

import { type ChecklistType, useChecklistData } from "packages/features/checklists";
import {
  CHECKLIST_SUBTITLES,
  CHECKLIST_TITLES,
  type ChecklistTab,
} from "packages/features/checklists";
import { useViewStore, type ViewState } from "packages/store";
import ClientSelector from "packages/ui/components/button/ClientSelector";
import { Box, Loading, Pressable, Text } from "packages/ui/components/primitives";

import DashboardChecklistsHeader from "./DashboardChecklistsHeader";

const CHECKLIST_TABS: ChecklistTab[] = ["escrow", "inspections", "financing", "closing"];

const TAB_TO_CHECKLIST_TYPE: Record<ChecklistTab, ChecklistType> = {
  escrow: "escrow",
  inspections: "insurance",
  financing: "financing",
  closing: "closing",
};

export default function DashboardChecklists() {
  const persistedTab = useViewStore(
    (s: ViewState) => s.dropdownSelections["buyerChecklists.activeTab"] as ChecklistTab | undefined
  );
  const setDropdownSelection = useViewStore((s: ViewState) => s.setDropdownSelection);

  const initialTab = useMemo<ChecklistTab>(() => {
    return persistedTab && CHECKLIST_TABS.includes(persistedTab) ? persistedTab : "escrow";
  }, [persistedTab]);

  const [activeTab, setActiveTab] = useState<ChecklistTab>(initialTab);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  useEffect(() => {
    setDropdownSelection("buyerChecklists.activeTab", activeTab as string);
  }, [activeTab, setDropdownSelection]);

  const checklistType = useMemo<ChecklistType>(() => TAB_TO_CHECKLIST_TYPE[activeTab], [activeTab]);

  const { items, checkedIds, isLoading, error, toggleItem, refreshChecklist } =
    useChecklistData(checklistType);

  const completedCount = checkedIds.length;
  const totalCount = items.length;

  const handleTabChange = useCallback((tab: ChecklistTab) => {
    setActiveTab(tab);
  }, []);

  const handleToggleItem = useCallback(
    async (id: number) => {
      await toggleItem(id);
    },
    [toggleItem]
  );

  const handleRefresh = useCallback(async () => {
    await refreshChecklist();
  }, [refreshChecklist]);

  return (
    <Box className="flex w-full flex-col gap-3">
      <Box className="mb-2">
        <ClientSelector selectedClientId={selectedClientId} onClientChange={setSelectedClientId} />
      </Box>

      <DashboardChecklistsHeader
        title={CHECKLIST_TITLES[activeTab]}
        subtitle={CHECKLIST_SUBTITLES[activeTab] ?? CHECKLIST_SUBTITLES.escrow}
        completedCount={completedCount}
        totalCount={totalCount}
        loading={isLoading}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <Box className="rounded-xl bg-gray-50 p-4">
        {isLoading ? (
          <Box className="flex items-center justify-center py-12">
            <Loading />
          </Box>
        ) : error ? (
          <Box className="flex flex-col gap-3">
            <Text className="text-sm text-red-500">{error}</Text>
            <Pressable
              onPress={handleRefresh}
              className="bg-brand-accent self-start rounded-lg px-4 py-2"
            >
              <Text className="text-sm font-medium text-white">Retry</Text>
            </Pressable>
          </Box>
        ) : items.length === 0 ? (
          <Box className="flex items-center justify-center py-12">
            <Text className="text-base text-gray-600">No checklist items yet.</Text>
          </Box>
        ) : (
          <Box className="flex flex-col gap-3">
            {items.map((item) => {
              const checked = checkedIds.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    void handleToggleItem(item.id);
                  }}
                  className="flex flex-row items-start gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm transition-all hover:shadow-md"
                >
                  <Box
                    className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors ${
                      checked ? "border-brand-accent bg-brand-accent" : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                  >
                    {checked ? <Text className="text-sm font-bold text-white">✓</Text> : null}
                  </Box>
                  <Box className="flex-1 min-w-0">
                    <Text className="text-base font-semibold text-gray-900 leading-relaxed">{item.label}</Text>
                    {!checked && (
                      <>
                        {item.explanation ? (
                          <Text className="mt-2 text-sm leading-relaxed text-gray-600">{item.explanation}</Text>
                        ) : null}
                        {item.bullets && item.bullets.length > 0 ? (
                          <Box className="mt-2 flex flex-col gap-1.5">
                            {item.bullets.map((bullet) => (
                              <Box key={bullet} className="flex flex-row gap-2 items-start">
                                <Text className="mt-0.5 text-sm text-gray-400 leading-none">•</Text>
                                <Text className="flex-1 text-sm text-gray-600 leading-relaxed">{bullet}</Text>
                              </Box>
                            ))}
                          </Box>
                        ) : null}
                        {item.tip ? (
                          <Text className="text-olive-700 mt-3 text-sm font-medium leading-relaxed">{item.tip}</Text>
                        ) : null}
                      </>
                    )}
                  </Box>
                </Pressable>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}
