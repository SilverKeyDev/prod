import React, { useCallback, useMemo, useState } from "react";

import { Icon } from "@ui/icons";

import {
  CHECKLIST_SUBTITLES,
  CHECKLIST_TITLES,
  ChecklistIntegrationSlot,
  type ChecklistTab,
  type ChecklistType,
  useChecklistData,
  useChecklistProgress,
} from "packages/features/checklists";
import { Loading } from "packages/ui/components/asset/loading/Loading";
import Card from "packages/ui/components/cards/Card";
import { Box, Pressable, Text } from "packages/ui/components/primitives";

const TAB_TO_CHECKLIST_TYPE: Record<ChecklistTab, ChecklistType> = {
  search: "search",
  offer: "offer",
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

  const { isSectionUnlocked, isItemCheckable } = useChecklistProgress();
  const { items, checkedIds, activeItemId, isLoading, error, toggleItem, refreshChecklist } =
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
  const isSectionLocked = !isSectionUnlocked(currentTab);

  const handleToggleItem = useCallback(
    async (id: number) => {
      if (!isItemCheckable(currentTab, id)) return;
      await toggleItem(id);
    },
    [toggleItem, isItemCheckable, currentTab]
  );

  const handleRefresh = useCallback(async () => {
    await refreshChecklist();
  }, [refreshChecklist]);

  return (
    <Box className="gap-3">
      <Box className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-gray-900">Client checklists</Text>
        {totalCount > 0 ? (
          <Text className="text-warm-stone text-xs">
            {completedCount} of {totalCount} items complete
          </Text>
        ) : null}
      </Box>

      <Text className="text-warm-stone text-xs">
        {CHECKLIST_SUBTITLES[currentTab] ?? CHECKLIST_SUBTITLES.search}
      </Text>

      {onTabChange == null ? (
        <Box className="mt-2 flex-row rounded-lg bg-gray-100 p-1">
          {(["search", "offer", "escrow", "inspections", "financing", "closing"] as const).map(
            (tab) => {
              const isActive = tab === currentTab;
              const locked = !isSectionUnlocked(tab);
              return (
                <Pressable
                  key={tab}
                  onPress={() => setTab(tab)}
                  // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
                  className={`flex-1 rounded-md px-2 py-1.5 ${isActive ? "bg-white shadow-sm" : ""} ${locked ? "opacity-60" : ""}`}
                >
                  <Text
                    // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
                    className={`text-center text-xs font-medium ${isActive ? "text-gray-900" : "text-gray-600"}`}
                    numberOfLines={1}
                  >
                    {CHECKLIST_TITLES[tab]}
                  </Text>
                </Pressable>
              );
            }
          )}
        </Box>
      ) : null}

      <Card className="bg-gray-50" padding="sm" hover={false}>
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
            <Text className="text-warm-stone text-sm">No checklist items yet.</Text>
          </Box>
        ) : (
          <Box className="flex flex-row flex-col gap-4">
            {isSectionLocked && (
              <Box className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <Text className="text-xs text-amber-800">
                  Complete all items in the previous section to unlock this section.
                </Text>
              </Box>
            )}
            {sortedItems.map((item) => {
              const checked = checkedIds.includes(item.id);
              const checkable = isItemCheckable(currentTab, item.id);
              const shouldShowIntegration = item.component_key && !isSectionLocked;

              return (
                <Box key={item.id} className="m-3 w-full">
                  <Pressable
                    onPress={() => {
                      void handleToggleItem(item.id);
                    }}
                    disabled={!checkable}
                    // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
                    className={`flex w-full flex-row items-stretch rounded-lg border border-gray-200 ${activeItemId != null && item.id === activeItemId ? "ring-accent-underline shadow-md ring-2" : ""} ${checkable ? "bg-white" : "cursor-not-allowed bg-gray-50 opacity-75"}`}
                  >
                    <Box className="flex min-w-0 flex-1 flex-row items-start gap-3 px-3 py-2">
                      <Box
                        // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
                        className={`mt-1 h-5 w-5 items-center justify-center rounded border ${checked ? "border-brand-accent bg-brand-accent" : checkable ? "border-gray-300 bg-white" : "border-gray-200 bg-gray-100"}`}
                      >
                        {checked ? (
                          <Text className="text-xs font-semibold text-white">✓</Text>
                        ) : !checkable ? (
                          <Icon name="lock" className="h-3 w-3 text-gray-400" />
                        ) : null}
                      </Box>
                      <Box className="flex-1 text-left">
                        <Text className="text-sm font-medium text-gray-900">
                          {item.label}
                          {item.optional ? (
                            <Text className="text-warm-stone font-normal"> (optional)</Text>
                          ) : null}
                        </Text>
                        {!checked && (
                          <>
                            {item.explanation ? (
                              <Text className="text-warm-stone mt-1.5 text-xs">
                                {item.explanation}
                              </Text>
                            ) : null}
                            {item.bullets && item.bullets.length > 0 ? (
                              <Box className="mt-1.5 flex flex-row flex-col gap-1.5">
                                {item.bullets.map((bullet) => (
                                  <Box key={bullet} className="flex-row items-start gap-2">
                                    <Text className="text-warm-stone mt-px text-xs">•</Text>
                                    <Text className="text-warm-stone flex-1 text-xs">{bullet}</Text>
                                  </Box>
                                ))}
                              </Box>
                            ) : null}
                            {item.tip ? (
                              <Text className="text-olive-700 mt-1.5 text-xs">{item.tip}</Text>
                            ) : null}
                          </>
                        )}
                      </Box>
                    </Box>
                  </Pressable>
                  {activeItemId != null && item.id === activeItemId && (
                    <ChecklistIntegrationSlot
                      componentKey={item.component_key}
                      isCurrent={!!shouldShowIntegration}
                      onComplete={() => {
                        if (checkable) void toggleItem(item.id);
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Card>
    </Box>
  );
}
