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
    <Box className="w-full gap-3">
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

      <Box className="rounded-xl bg-gray-50 p-3">
        {isLoading ? (
          <Box className="items-center justify-center py-8">
            <Loading />
          </Box>
        ) : error ? (
          <Box className="gap-2">
            <Text className="text-sm text-red-500">{error}</Text>
            <Pressable
              onPress={handleRefresh}
              className="bg-brand-accent self-start rounded-lg px-3 py-1.5"
            >
              <Text className="text-xs font-medium text-white">Retry</Text>
            </Pressable>
          </Box>
        ) : items.length === 0 ? (
          <Box className="items-center justify-center py-8">
            <Text className="text-sm text-gray-600">No checklist items yet.</Text>
          </Box>
        ) : (
          <Box className="gap-2">
            {items.map((item) => {
              const checked = checkedIds.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    void handleToggleItem(item.id);
                  }}
                  className="flex-row items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
                >
                  <Box
                    className={`mt-1 h-5 w-5 items-center justify-center rounded border ${
                      checked ? "border-brand-accent bg-brand-accent" : "border-gray-300 bg-white"
                    }`}
                  >
                    {checked ? <Text className="text-xs font-semibold text-white">✓</Text> : null}
                  </Box>
                  <Box className="flex-1">
                    <Text className="text-sm font-medium text-gray-900">{item.label}</Text>
                    {!checked && (
                      <>
                        {item.explanation ? (
                          <Text className="mt-1 text-xs text-gray-600">{item.explanation}</Text>
                        ) : null}
                        {item.bullets && item.bullets.length > 0 ? (
                          <Box className="mt-1 gap-1">
                            {item.bullets.map((bullet) => (
                              <Box key={bullet} className="flex-row gap-1">
                                <Text className="mt-px text-xs text-gray-500">•</Text>
                                <Text className="flex-1 text-xs text-gray-500">{bullet}</Text>
                              </Box>
                            ))}
                          </Box>
                        ) : null}
                        {item.tip ? (
                          <Text className="text-olive-700 mt-1 text-xs">{item.tip}</Text>
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
