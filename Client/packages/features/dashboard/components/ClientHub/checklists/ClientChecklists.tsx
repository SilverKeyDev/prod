import React, { useCallback, useMemo, useState } from "react";

import {
  CHECKLIST_SUBTITLES,
  CHECKLIST_TITLES,
  type ChecklistTab,
  type ChecklistType,
  useChecklistData,
} from "packages/features/checklists";
import { Box, Loading, Pressable, Text } from "packages/ui/components/primitives";

const TAB_TO_CHECKLIST_TYPE: Record<ChecklistTab, ChecklistType> = {
  escrow: "escrow",
  inspections: "insurance",
  financing: "financing",
  closing: "closing",
};

type ClientChecklistsProps = {
  userId: string;
  activeTab: ChecklistTab;
  onTabChange?: (tab: ChecklistTab) => void;
};

export default function ClientChecklists({
  userId: _userId,
  activeTab,
  onTabChange,
}: ClientChecklistsProps) {
  const [internalTab, setInternalTab] = useState<ChecklistTab>(activeTab);
  const currentTab = onTabChange != null ? activeTab : internalTab;
  const setTab = useCallback(
    (tab: ChecklistTab) => {
      if (onTabChange) onTabChange(tab);
      else setInternalTab(tab);
    },
    [onTabChange]
  );

  const checklistType = useMemo<ChecklistType>(
    () => TAB_TO_CHECKLIST_TYPE[currentTab],
    [currentTab]
  );

  const { items, checkedIds, isLoading, error, toggleItem, refreshChecklist } =
    useChecklistData(checklistType);

  const completedCount = checkedIds.length;
  const totalCount = items.length;

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
    <Box className="gap-3">
      <Box className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-gray-900">Client checklists</Text>
        {totalCount > 0 ? (
          <Text className="text-xs text-gray-600">
            {completedCount} of {totalCount} items complete
          </Text>
        ) : null}
      </Box>

      <Text className="text-xs text-gray-600">
        {CHECKLIST_SUBTITLES[currentTab] ?? CHECKLIST_SUBTITLES.escrow}
      </Text>

      {onTabChange == null ? (
        <Box className="mt-2 flex-row rounded-lg bg-gray-100 p-1">
          {(["escrow", "inspections", "financing", "closing"] as const).map((tab) => {
            const isActive = tab === currentTab;
            return (
              <Pressable
                key={tab}
                onPress={() => setTab(tab)}
                className={`flex-1 rounded-md px-2 py-1.5 ${isActive ? "bg-white shadow-sm" : ""}`}
              >
                <Text
                  className={`text-center text-xs font-medium ${
                    isActive ? "text-gray-900" : "text-gray-600"
                  }`}
                  numberOfLines={1}
                >
                  {CHECKLIST_TITLES[tab]}
                </Text>
              </Pressable>
            );
          })}
        </Box>
      ) : null}

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
