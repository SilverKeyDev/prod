import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Icon } from "@ui/icons";

import {
  CHECKLIST_SUBTITLES,
  CHECKLIST_TITLES,
  checklistCheckboxRowClassNames,
  ChecklistIntegrationSlot,
  type ChecklistTab,
  type ChecklistType,
  toChecklistCheckboxItem,
  useChecklistData,
  useChecklistProgress,
} from "packages/features/checklists";
import { useViewStore, type ViewState } from "packages/store";
import { Loading } from "packages/ui/components/asset/loading/Loading";
import ClientSelector from "packages/ui/components/button/ClientSelector";
import IconButton from "packages/ui/components/button/IconButton";
import Card from "packages/ui/components/cards/Card";
import ChecklistCheckbox from "packages/ui/components/form/ChecklistCheckbox";
import { Box, Pressable, Text } from "packages/ui/components/primitives";

import DashboardChecklistsHeader from "./DashboardChecklistsHeader";

const TAB_TO_CHECKLIST_TYPE: Record<ChecklistTab, ChecklistType> = {
  search: "search",
  offer: "offer",
  escrow: "escrow",
  inspections: "insurance",
  financing: "financing",
  closing: "closing",
};

export default function DashboardChecklists() {
  const {
    currentSection,
    isSectionUnlocked,
    isItemCheckable,
    isLoading: progressLoading,
  } = useChecklistProgress();
  const setDropdownSelection = useViewStore(
    (s: ViewState) => s.setDropdownSelection,
  );
  const hasInitializedTabRef = useRef(false);

  // Default tab: the one with the earliest unchecked item (currentSection from useChecklistProgress)
  const [activeTab, setActiveTab] = useState<ChecklistTab>(currentSection);

  // When progress is ready, sync to the tab with the earliest unchecked item (once per mount)
  useEffect(() => {
    if (progressLoading) return;
    if (!hasInitializedTabRef.current) {
      setActiveTab(currentSection);
      hasInitializedTabRef.current = true;
    }
  }, [currentSection, progressLoading]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  useEffect(() => {
    setDropdownSelection("buyerChecklists.activeTab", activeTab as string);
  }, [activeTab, setDropdownSelection]);

  const checklistType = useMemo<ChecklistType>(
    () => TAB_TO_CHECKLIST_TYPE[activeTab],
    [activeTab],
  );

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
  const isSectionLocked = !isSectionUnlocked(activeTab);

  const handleTabChange = useCallback((tab: ChecklistTab) => {
    setActiveTab(tab);
  }, []);

  const handleToggleItem = useCallback(
    async (id: number) => {
      if (!isItemCheckable(activeTab, id)) return;
      await toggleItem(id);
    },
    [toggleItem, isItemCheckable, activeTab],
  );

  const handleRefresh = useCallback(async () => {
    await refreshChecklist();
  }, [refreshChecklist]);

  // Expansion state: active item starts expanded; sync when activeItemId or checkedIds change
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
  // When an item is checked off, collapse it
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
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <Box className="flex w-full flex-row flex-col gap-3">
      <Box className="mb-2">
        <ClientSelector
          selectedClientId={selectedClientId}
          onClientChange={setSelectedClientId}
        />
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

      <Card
        border="light"
        className="bg-background-base"
        padding="md"
        hover={false}
      >
        {isLoading ? (
          <Box className="flex flex-row items-center justify-center py-12">
            <Loading />
          </Box>
        ) : error ? (
          <Box className="flex flex-row flex-col gap-3">
            <Text className="text-sm text-red-500">{error}</Text>
            <Pressable
              onPress={handleRefresh}
              className="bg-primary self-start rounded-lg px-4 py-2"
            >
              <Text className="text-sm font-medium text-white">Retry</Text>
            </Pressable>
          </Box>
        ) : items.length === 0 ? (
          <Box className="flex flex-row items-center justify-center py-12">
            <Text className="text-warm-stone text-base">
              No checklist items yet.
            </Text>
          </Box>
        ) : (
          <Box className="flex flex-row flex-col gap-2">
            {isSectionLocked && (
              <Box className="border-border bg-background-base mt-2 flex flex-row items-center gap-2 rounded-lg border px-4 py-3">
                <Icon
                  name="lock"
                  className="text-text-muted h-4 w-4 shrink-0"
                />
                <Text className="text-text-muted text-sm">
                  Complete all items in the previous section to unlock this
                  section.
                </Text>
              </Box>
            )}
            {sortedItems.map((item) => {
              const checked = checkedIds.includes(item.id);
              const checkable = isItemCheckable(activeTab, item.id);
              const isActive = activeItemId != null && item.id === activeItemId;
              const shouldShowIntegration =
                item.component_key != null && !isSectionLocked;
              const isExpanded = expandedIds.has(item.id);
              const itemBorder = isActive
                ? "none"
                : checked
                  ? "dotted"
                  : "light";
              const checkboxItem = toChecklistCheckboxItem(item);
              return (
                <Card
                  border={itemBorder}
                  key={item.id}
                  padding="none"
                  hover={false}
                  className={`m-1.5 w-full overflow-hidden ${
                    isActive
                      ? "ring-gold shadow-[0_0_3px_rgba(181,168,138,0.6),0_0_10px_rgba(181,168,138,0.35),0_0_20px_rgba(181,168,138,0.15)] ring-1"
                      : ""
                  }`}
                >
                  <Box
                    className={`flex w-full flex-row items-stretch ${
                      checkable
                        ? "bg-background-surface"
                        : "bg-background-base opacity-75"
                    }`}
                  >
                    <Box className="flex min-w-0 flex-1 flex-row items-start gap-4 px-4 py-3">
                      <Box className="min-w-0 flex-1">
                        <ChecklistCheckbox
                          item={checkboxItem}
                          checked={checked}
                          onToggle={() => {
                            void handleToggleItem(item.id);
                          }}
                          disabled={!checkable}
                          showDetails={isExpanded}
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
                        onKeyDown={(e) =>
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
                  {isExpanded && shouldShowIntegration && (
                    <Box className="mt-2 rounded-b-lg px-4 pb-3">
                      <ChecklistIntegrationSlot
                        componentKey={item.component_key}
                        isCurrent={true}
                        onComplete={() => {
                          if (checkable) void handleToggleItem(item.id);
                        }}
                      />
                    </Box>
                  )}
                </Card>
              );
            })}
          </Box>
        )}
      </Card>
    </Box>
  );
}
