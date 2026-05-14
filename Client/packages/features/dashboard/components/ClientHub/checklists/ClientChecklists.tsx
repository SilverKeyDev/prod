import React, { useCallback, useMemo, useState } from "react";

import { useLocalization } from "packages/contexts";
import {
  BuyerRoadmapChecklistList,
  CHECKLIST_SUBTITLES,
  CHECKLIST_TITLES,
  ChecklistStepForms,
  type ChecklistTab,
  type ChecklistType,
  sortTaskChecklistItems,
  useChecklistData,
  useChecklistProgress,
} from "packages/features/checklists";
import { useIsAgent } from "packages/features/homeauth";
import { showErrorToast } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import { Box, Pressable, Text } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

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
  const { t } = useLocalization();
  const isAgent = useIsAgent();
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

  const checklistSubjectOptions = useMemo(() => ({ checklistSubjectUserId: userId }), [userId]);

  const { currentSection, isSectionUnlocked, getItemToggleEligibility, sectionProgress } =
    useChecklistProgress(checklistSubjectOptions);
  const {
    items,
    checkedIds,
    activeItemId,
    activeItemIds,
    isLoading,
    error,
    toggleItem,
    refreshChecklist,
    isChecklistUpdatePending,
  } = useChecklistData(checklistType, checklistSubjectOptions);

  const sortedItems = useMemo(() => sortTaskChecklistItems(items), [items]);

  const completedCount = checkedIds.length;
  const totalCount = items.length;
  const isSectionLocked = !isSectionUnlocked(currentTab);

  const handleToggleItem = useCallback(
    async (id: number) => {
      const checked = checkedIds.includes(id);
      const { canUncheck, canMarkChecked } = getItemToggleEligibility(currentTab, id);
      if (checked && !canUncheck) return;
      if (!checked && !canMarkChecked) return;
      try {
        await toggleItem(id);
      } catch (error: unknown) {
        log.error(LOG_CATEGORIES.ERRORS, "Failed to update checklist item", error);
        showErrorToast(
          t("checklists.update_error", {
            defaultValue: "Could not update this step. Please try again.",
          })
        );
      }
    },
    [toggleItem, getItemToggleEligibility, currentTab, checkedIds, t]
  );

  const handleRefresh = useCallback(async () => {
    await refreshChecklist();
  }, [refreshChecklist]);

  return (
    <Box className="gap-3">
      <Box className="flex-row items-center justify-between">
        <Text className="text-text-primary text-sm font-semibold">Client checklists</Text>
        {totalCount > 0 ? (
          <Text className="text-text-tertiary text-xs">
            {completedCount} of {totalCount} items complete
          </Text>
        ) : null}
      </Box>

      {onTabChange == null ? (
        <Box className="bg-primary-muted mt-2 flex-row rounded-lg p-1">
          {(["search", "offer", "escrow", "inspections", "financing", "closing"] as const).map(
            (tab) => {
              const isActive = tab === currentTab;
              const isJourneyPhase = tab === currentSection;
              const locked = !isSectionUnlocked(tab);
              return (
                <Pressable
                  key={tab}
                  onPress={() => setTab(tab)}
                  className={`relative flex-1 rounded-md px-2 py-1.5 ${
                    isActive ? "bg-background-surface shadow-sm" : ""
                  } ${isJourneyPhase ? "bg-brand-accent/10" : ""} ${locked ? "opacity-60" : ""}`}
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
            }
          )}
        </Box>
      ) : null}

      <BuyerRoadmapChecklistList
        currentTab={currentTab}
        sortedItems={sortedItems}
        checkedIds={checkedIds}
        activeItemId={activeItemId}
        activeItemIds={activeItemIds}
        isSectionLocked={isSectionLocked}
        isLoading={isLoading}
        error={error}
        onRefresh={handleRefresh}
        onToggleItem={handleToggleItem}
        getItemToggleEligibility={getItemToggleEligibility}
        sectionProgress={sectionProgress}
        onRoadmapTabNavigate={setTab}
        hideIntegrationComponents={hideIntegrationComponents}
        isChecklistUpdatePending={isChecklistUpdatePending}
        hubClientUserId={isAgent ? userId : null}
        checklistCategory={isAgent ? checklistType : null}
        isAgent={isAgent}
        subtitle={
          <BodyText size="sm" className="text-text-secondary mb-4" as="p">
            {CHECKLIST_SUBTITLES[currentTab] ?? CHECKLIST_SUBTITLES.search}
          </BodyText>
        }
        renderItemAgentFooter={
          isAgent
            ? (item) =>
                activeItemIds.includes(item.id) ? (
                  <ChecklistStepForms
                    transactionId={userId}
                    section={checklistType}
                    itemId={item.id}
                    isAgent
                  />
                ) : null
            : undefined
        }
      />
    </Box>
  );
}
