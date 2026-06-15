import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useLocalization } from "packages/contexts";
import {
  BuyerRoadmapChecklistList,
  CHECKLIST_SUBTITLES,
  CHECKLIST_TAB_TO_TYPE,
  type ChecklistTab,
  sortTaskChecklistItems,
  useAutoCompleteChecklistIntegrations,
  useChecklistProgress,
  useResolvedTransactionId,
} from "packages/features/checklists";
import { ChecklistSigningModals } from "packages/features/checklists/components/shared/ChecklistSigningModals";
import { useChecklistStepSigningFooter } from "packages/features/checklists/hooks/useChecklistStepSigningFooter";
import { useIsAgent, useTransactionShellConfig } from "packages/hooks/store";
import { useAuthStore, useViewStore, type ViewState } from "packages/store";
import ClientSelector from "packages/ui/components/actions/button/propertyActions/ClientSelector";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

import DashboardChecklistsHeader from "./DashboardChecklistsHeader";

export default function DashboardChecklists() {
  const { t } = useLocalization();
  const transactionShell = useTransactionShellConfig();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const authUserId = useAuthStore((s) => s.user?.id ?? null);
  const isAgent = useIsAgent();
  const clientUserIdForTx = selectedClientId ?? (!isAgent ? authUserId : null);
  const { transactionId, isLoading: transactionIdLoading } =
    useResolvedTransactionId(clientUserIdForTx);
  const checklistSubjectOptions = useMemo(
    () => ({
      transactionId: transactionId ?? undefined,
      isAgentViewer: isAgent && selectedClientId != null,
      enabled: !transactionIdLoading && (transactionId != null || !isAgent),
    }),
    [transactionId, transactionIdLoading, isAgent, selectedClientId]
  );
  const setDropdownSelection = useViewStore((s: ViewState) => s.setDropdownSelection);
  const hasInitializedTabRef = useRef(false);

  const [activeTab, setActiveTab] = useState<ChecklistTab>("search");

  const {
    currentSection,
    isSectionUnlocked,
    getItemToggleEligibility,
    isLoading: progressLoading,
    overallProgress,
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
  } = useChecklistProgress({ ...checklistSubjectOptions, activeSection: activeTab });

  useEffect(() => {
    if (progressLoading) return;
    if (!hasInitializedTabRef.current) {
      setActiveTab(currentSection);
      hasInitializedTabRef.current = true;
    }
  }, [currentSection, progressLoading]);

  useEffect(() => {
    setDropdownSelection("buyerChecklists.activeTab", activeTab as string);
  }, [activeTab, setDropdownSelection]);

  const checklistType = useMemo(() => CHECKLIST_TAB_TO_TYPE[activeTab], [activeTab]);

  const {
    renderSigningFooter,
    agreementSigningSession,
    dismissAgreementSigning,
    onAgreementSigningComplete,
  } = useChecklistStepSigningFooter({
    checklistType,
    activeItemIds,
    isAgent: false,
  });

  const sortedItems = useMemo(() => sortTaskChecklistItems(items), [items]);

  useAutoCompleteChecklistIntegrations({
    items,
    checkedIds,
    toggleItem,
    getItemToggleEligibility,
    roadmapTab: activeTab,
    isChecklistUpdatePending,
    isChecklistLoading: isLoading,
  });

  const isSectionLocked = !isSectionUnlocked(activeTab);

  const handleTabChange = useCallback((tab: ChecklistTab) => {
    setActiveTab(tab);
  }, []);

  const handleToggleItem = useCallback(
    async (id: number) => {
      const checked = checkedIds.includes(id);
      const { canUncheck, canMarkChecked } = getItemToggleEligibility(activeTab, id);
      if (checked && !canUncheck) return;
      if (!checked && !canMarkChecked) return;
      await toggleItem(id);
    },
    [toggleItem, getItemToggleEligibility, activeTab, checkedIds]
  );

  const handleRefresh = useCallback(async () => {
    await refreshChecklist();
  }, [refreshChecklist]);

  return (
    <Box className="flex w-full flex-col gap-3" data-transaction-party={transactionShell.party}>
      <Box className="mb-2">
        <ClientSelector selectedClientId={selectedClientId} onClientChange={setSelectedClientId} />
      </Box>

      <DashboardChecklistsHeader
        journeyTitle={t("checklists.buyer_journey.title")}
        journeyProgressLabel={
          progressLoading
            ? t("checklists.loading")
            : t("checklists.buyer_journey.progress", {
                completed: overallProgress.completed,
                total: overallProgress.total,
              })
        }
        overallPercent={overallProgress.percent}
        overallLoading={progressLoading}
        activeTab={activeTab}
        currentSection={currentSection}
        onTabChange={handleTabChange}
        isSectionUnlocked={isSectionUnlocked}
        sectionProgress={sectionProgress}
      />

      <BuyerRoadmapChecklistList
        currentTab={activeTab}
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
        onRoadmapTabNavigate={handleTabChange}
        isChecklistUpdatePending={isChecklistUpdatePending}
        transactionId={transactionId}
        renderItemFooter={renderSigningFooter}
        subtitle={
          <BodyText size="sm" className="text-text-secondary mb-4" as="p">
            {CHECKLIST_SUBTITLES[activeTab] ?? CHECKLIST_SUBTITLES.search}
          </BodyText>
        }
      />
      <ChecklistSigningModals
        agreementSigningSession={agreementSigningSession}
        dismissAgreementSigning={dismissAgreementSigning}
        onAgreementSigningComplete={onAgreementSigningComplete}
      />
    </Box>
  );
}
