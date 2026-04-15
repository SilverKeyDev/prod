import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Icon } from "@ui/icons";

import {
  CHECKLIST_SUBTITLES,
  CHECKLIST_TITLES,
  checklistCheckboxRowClassNames,
  ChecklistIntegrationSlot,
  ChecklistStepForms,
  type ChecklistTab,
  type ChecklistType,
  toChecklistCheckboxItem,
  useChecklistData,
  useChecklistProgress,
} from "packages/features/checklists";
import { useIsAgent } from "packages/features/homeauth";
import { Loading } from "packages/ui/components/asset/loading/Loading";
import IconButton from "packages/ui/components/button/IconButton";
import Card from "packages/ui/components/cards/Card";
import ChecklistCheckbox from "packages/ui/components/form/ChecklistCheckbox";
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
  /** When true (e.g. agent viewing a client), checklist integration UIs are not rendered. */
  hideIntegrationComponents?: boolean;
  onTabChange?: (tab: ChecklistTab) => void;
};

export default function ClientChecklists({
  userId,
  activeTab,
  hideIntegrationComponents = false,
  onTabChange,
}: ClientChecklistsProps) {
  const isAgent = useIsAgent();
  const [internalTab, setInternalTab] = useState<ChecklistTab>(activeTab);
  const currentTab = onTabChange != null ? activeTab : internalTab;
  const setTab = useCallback(
    (tab: ChecklistTab) => {
      if (onTabChange) onTabChange(tab);
      else setInternalTab(tab);
    },
    [onTabChange],
  );

  const checklistType = useMemo<ChecklistType>(
    () => TAB_TO_CHECKLIST_TYPE[currentTab],
    [currentTab],
  );

  const { isSectionUnlocked, isItemCheckable } = useChecklistProgress();
  const {
    items,
    checkedIds,
    activeItemId,
    isLoading,
    error,
    toggleItem,
    refreshChecklist,
  } = useChecklistData(checklistType);

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
    [toggleItem, isItemCheckable, currentTab],
  );

  const handleRefresh = useCallback(async () => {
    await refreshChecklist();
  }, [refreshChecklist]);

  const [expandedIds, setExpandedIds] = useState<Set<number>>(() =>
    activeItemId != null ? new Set([activeItemId]) : new Set(),
  );
  useEffect(() => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (activeItemId != null) next.add(activeItemId);
      return next;
    });
  }, [activeItemId]);
  useEffect(() => {
    setExpandedIds((prev) => {
      if (checkedIds.length === 0) return prev;
      const next = new Set(prev);
      let changed = false;
      checkedIds.forEach((id) => {
        if (next.has(id)) {
          next.delete(id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [checkedIds]);
  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <Box className="gap-3">
      <Box className="flex-row items-center justify-between">
        <Text className="text-text-primary text-sm font-semibold">
          Client checklists
        </Text>
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
        <Box className="bg-primary-muted mt-2 flex-row rounded-lg p-1">
          {(
            [
              "search",
              "offer",
              "escrow",
              "inspections",
              "financing",
              "closing",
            ] as const
          ).map((tab) => {
            const isActive = tab === currentTab;
            const locked = !isSectionUnlocked(tab);
            return (
              <Pressable
                key={tab}
                onPress={() => setTab(tab)}
                className={`flex-1 rounded-md px-2 py-1.5 ${
                  isActive ? "bg-background-surface shadow-sm" : ""
                } ${locked ? "opacity-60" : ""}`}
              >
                <Text
                  className={`text-center text-xs font-medium ${
                    isActive ? "text-text-primary" : "text-text-secondary"
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

      <Card
        border="light"
        className="bg-background-base"
        padding="sm"
        hover={false}
      >
        {isLoading ? (
          <Box className="items-center justify-center py-8">
            <Loading />
          </Box>
        ) : error ? (
          <Box className="gap-2">
            <Text className="text-sm text-red-500">{error}</Text>
            <Pressable
              onPress={handleRefresh}
              className="bg-primary self-start rounded-lg px-3 py-1.5"
            >
              <Text className="text-xs font-medium text-white">Retry</Text>
            </Pressable>
          </Box>
        ) : items.length === 0 ? (
          <Box className="items-center justify-center py-8">
            <Text className="text-warm-stone text-sm">
              No checklist items yet.
            </Text>
          </Box>
        ) : (
          <Box className="flex flex-row flex-col gap-4">
            {isSectionLocked && (
              <Box className="border-border bg-background-base flex flex-row items-center gap-2 rounded-lg border px-4 py-3">
                <Icon
                  name="lock"
                  className="text-text-muted h-3.5 w-3.5 shrink-0"
                />
                <Text className="text-text-muted text-xs">
                  Complete all items in the previous section to unlock this
                  section.
                </Text>
              </Box>
            )}
            {sortedItems.map((item) => {
              const checked = checkedIds.includes(item.id);
              const checkable = isItemCheckable(currentTab, item.id);
              const isExpanded = expandedIds.has(item.id);
              const shouldShowIntegration =
                Boolean(item.component_key) &&
                !isSectionLocked &&
                !hideIntegrationComponents;
              const checkboxItem = toChecklistCheckboxItem(item);

              return (
                <Box key={item.id} className="m-3 w-full">
                  <Box
                    className={`border-border flex w-full flex-row items-stretch rounded-lg border ${
                      activeItemId != null && item.id === activeItemId
                        ? "ring-accent-underline shadow-md ring-2"
                        : ""
                    } ${
                      checkable
                        ? "bg-background-surface"
                        : "bg-background-base opacity-75"
                    }`}
                  >
                    <Box className="flex min-w-0 flex-1 flex-row items-start gap-3 px-3 py-2">
                      <Box className="min-w-0 flex-1">
                        <ChecklistCheckbox
                          item={checkboxItem}
                          checked={checked}
                          onToggle={() => {
                            void handleToggleItem(item.id);
                          }}
                          disabled={!checkable}
                          showDetails={!checked && (checkable || isExpanded)}
                          itemLabelClass={
                            checklistCheckboxRowClassNames.itemLabel
                          }
                          itemExplanationClass={
                            checklistCheckboxRowClassNames.itemExplanation
                          }
                          checkboxContainerClass={
                            checklistCheckboxRowClassNames.checkboxContainer
                          }
                        />
                      </Box>
                      <Box
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        onKeyDown={(e: React.KeyboardEvent) =>
                          e.key === "Enter" && e.stopPropagation()
                        }
                      >
                        <IconButton
                          variant="ghost"
                          size="sm"
                          iconName={
                            isExpanded ? "chevron-down" : "chevron-right"
                          }
                          label={isExpanded ? "Collapse step" : "Expand step"}
                          onPress={() => toggleExpand(item.id)}
                          className="text-text-secondary hover:text-text-primary mt-0.5 flex h-6 w-6 flex-shrink-0"
                        />
                      </Box>
                    </Box>
                  </Box>
                  {activeItemId != null && item.id === activeItemId && (
                    <>
                      <ChecklistIntegrationSlot
                        componentKey={item.component_key}
                        isCurrent={!!shouldShowIntegration}
                        onComplete={() => {
                          if (checkable) void toggleItem(item.id);
                        }}
                      />
                      <Box className="mt-3">
                        <ChecklistStepForms
                          transactionId={userId}
                          section={currentTab}
                          itemId={item.id}
                          isAgent={isAgent}
                        />
                      </Box>
                    </>
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
