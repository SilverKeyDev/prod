import React, { useCallback, useMemo, useState } from "react";

import { useLocalization } from "packages/contexts";
import {
  BuyerRoadmapChecklistList,
  CHECKLIST_SUBTITLES,
  CHECKLIST_TAB_TO_TYPE,
  CHECKLIST_TITLES,
  ChecklistStepForms,
  type ChecklistTab,
  type ChecklistType,
  sortTaskChecklistItems,
  useAutoCompleteChecklistIntegrations,
  useChecklistProgress,
} from "packages/features/checklists";
import { useActiveWorkspace } from "packages/features/homeauth";
import { useTransactionShellConfig } from "packages/hooks/store";
import { showErrorToast } from "packages/hooks/ui";
import { log } from "packages/logger";
import { Box, Pressable, Text } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import type { TransactionShellConfig } from "packages/utils/product/workspace";

const TAB_TO_CHECKLIST_TYPE = CHECKLIST_TAB_TO_TYPE;

type ClientChecklistsProps = {
  userId: string;
  transactionId: string;
  activeTab: ChecklistTab;
  /** When true (e.g. agent viewing a client), checklist integration UIs are not rendered. */
  hideIntegrationComponents?: boolean;
  onTabChange?: (tab: ChecklistTab) => void;
  /** Injected from workspace shells; defaults to active workspace party. */
  transactionShellConfig?: TransactionShellConfig;
};

export default function ClientChecklists({
  userId,
  transactionId,
  activeTab,
  hideIntegrationComponents = false,
  onTabChange,
  transactionShellConfig: transactionShellConfigProp,
}: ClientChecklistsProps) {
  const { t } = useLocalization();
  const isAgentWorkspace = useActiveWorkspace() === "agent";
  const defaultTransactionShellConfig = useTransactionShellConfig();
  const transactionShell = transactionShellConfigProp ?? defaultTransactionShellConfig;
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

  const checklistSubjectOptions = useMemo(
    () => ({ transactionId, isAgentViewer: isAgentWorkspace }),
    [transactionId, isAgentWorkspace]
  );

  const {
    currentSection,
    isSectionUnlocked,
    getItemToggleEligibility,
    sectionProgress,
    items,
    checkedIds,
    activeItemId,
    activeItemIds,
    isLoading,
    error,
    toggleItem,
    refreshChecklist,
    isChecklistUpdatePending,
  } = useChecklistProgress({ ...checklistSubjectOptions, activeSection: currentTab });

  const sortedItems = useMemo(() => sortTaskChecklistItems(items), [items]);

  useAutoCompleteChecklistIntegrations({
    items,
    checkedIds,
    toggleItem,
    getItemToggleEligibility,
    roadmapTab: currentTab,
    enabled: !hideIntegrationComponents,
    isChecklistUpdatePending,
    isChecklistLoading: isLoading,
  });

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
        log.error("ERRORS", "Failed to update checklist item", error);
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
    <Box className="gap-3" data-transaction-party={transactionShell.party}>
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
        commitToggleItem={toggleItem}
        getItemToggleEligibility={getItemToggleEligibility}
        sectionProgress={sectionProgress}
        onRoadmapTabNavigate={setTab}
        hideIntegrationComponents={hideIntegrationComponents}
        isChecklistUpdatePending={isChecklistUpdatePending}
        transactionId={transactionId}
        hubClientUserId={isAgentWorkspace ? userId : null}
        checklistCategory={isAgentWorkspace ? checklistType : null}
        isAgent={isAgentWorkspace}
        subtitle={
          <BodyText size="sm" className="text-text-secondary mb-4" as="p">
            {CHECKLIST_SUBTITLES[currentTab] ?? CHECKLIST_SUBTITLES.search}
          </BodyText>
        }
        renderItemAgentFooter={
          isAgentWorkspace
            ? (item) => {
                const hasSuggestedForms = (item.suggestedFormIds?.length ?? 0) > 0;
                if (!activeItemIds.includes(item.id) || !hasSuggestedForms) {
                  return null;
                }
                return (
                  <ChecklistStepForms
                    transactionId={transactionId}
                    section={checklistType}
                    itemId={item.id}
                    isAgent={isAgentWorkspace}
                  />
                );
              }
            : undefined
        }
      />
    </Box>
  );
}
