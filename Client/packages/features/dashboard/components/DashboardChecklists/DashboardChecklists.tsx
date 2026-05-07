import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ReactNode } from "react";

import { useLocalization } from "packages/contexts";
import { TodoAgendaRow } from "packages/features/calendar";
import {
  BuyerRoadmapChecklistList,
  CHECKLIST_SUBTITLES,
  CHECKLIST_TITLES,
  type ChecklistTab,
  type ChecklistType,
  sortTaskChecklistItems,
  type TaskChecklistItem,
  useChecklistData,
  useChecklistProgress,
} from "packages/features/checklists";
import { useDocumentsDataIntegration } from "packages/features/documents";
import { useSigningTodos } from "packages/hooks/data/agenda/useSigningTodos";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useViewStore, type ViewState } from "packages/store";
import ClientSelector from "packages/ui/components/button/ClientSelector";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

import DashboardChecklistsHeader from "./DashboardChecklistsHeader";

const DashboardAgreementSigningModals = lazy(() => import("../DashboardAgreementSigningModals"));

const TAB_TO_CHECKLIST_TYPE: Record<ChecklistTab, ChecklistType> = {
  search: "search",
  offer: "offer",
  escrow: "escrow",
  inspections: "insurance",
  financing: "financing",
  closing: "closing",
};

export default function DashboardChecklists() {
  const { t } = useLocalization();
  const {
    currentSection,
    isSectionUnlocked,
    getItemToggleEligibility,
    isLoading: progressLoading,
    overallProgress,
    sectionProgress,
  } = useChecklistProgress();
  const setDropdownSelection = useViewStore((s: ViewState) => s.setDropdownSelection);
  const hasInitializedTabRef = useRef(false);

  const [activeTab, setActiveTab] = useState<ChecklistTab>(currentSection);

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

  const checklistType = useMemo<ChecklistType>(() => TAB_TO_CHECKLIST_TYPE[activeTab], [activeTab]);

  const {
    items,
    checkedIds,
    activeItemId,
    activeItemIds,
    isLoading,
    error,
    toggleItem,
    refreshChecklist,
  } = useChecklistData(checklistType);

  const signingTodos = useSigningTodos(false);
  const {
    documents,
    signAgreementNow,
    agreementSigningSession,
    dismissAgreementSigning,
    onAgreementSigningComplete,
  } = useDocumentsDataIntegration();

  const sortedItems = useMemo(() => sortTaskChecklistItems(items), [items]);

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

  const handleSigningPress = useCallback(
    async (agreementId: string) => {
      const doc = documents.find((d) => d.id === agreementId && d.library_kind === "agreement");
      if (!doc) return;
      try {
        await signAgreementNow(doc);
      } catch (error) {
        log.error(LOG_CATEGORIES.ERRORS, "Checklist step DocuSign signing failed", error);
      }
    },
    [documents, signAgreementNow]
  );

  const renderItemFooter = useCallback(
    (item: TaskChecklistItem): ReactNode => {
      if (!activeItemIds.includes(item.id)) return null;
      const hasForm =
        item.completionType === "signature_based" ||
        (item.suggestedFormIds != null && item.suggestedFormIds.length > 0);
      if (!hasForm || signingTodos.length === 0) return null;
      return (
        <Box className="flex flex-col gap-2">
          {signingTodos.map((todo) => (
            <TodoAgendaRow
              key={todo.id}
              todo={todo}
              onToggleComplete={() => {}}
              onSigningPress={handleSigningPress}
              canEditComplete={false}
            />
          ))}
        </Box>
      );
    },
    [activeItemIds, signingTodos, handleSigningPress]
  );

  return (
    <Box className="flex w-full flex-row flex-col gap-3">
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
        currentPhaseLabel={
          progressLoading
            ? t("checklists.loading")
            : t("checklists.buyer_journey.current_phase", {
                phase: CHECKLIST_TITLES[currentSection],
              })
        }
        overallPercent={overallProgress.percent}
        overallLoading={progressLoading}
        activeTab={activeTab}
        phaseIndicatorId={currentSection}
        onTabChange={handleTabChange}
        isSectionUnlocked={isSectionUnlocked}
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
        getItemToggleEligibility={getItemToggleEligibility}
        sectionProgress={sectionProgress}
        onRoadmapTabNavigate={handleTabChange}
        renderItemFooter={renderItemFooter}
        subtitle={
          <BodyText size="sm" className="text-text-secondary mb-4" as="p">
            {CHECKLIST_SUBTITLES[activeTab] ?? CHECKLIST_SUBTITLES.search}
          </BodyText>
        }
      />
      {agreementSigningSession != null ? (
        <Suspense fallback={null}>
          <DashboardAgreementSigningModals
            agreementSigningSession={agreementSigningSession}
            dismissAgreementSigning={dismissAgreementSigning}
            onAgreementSigningComplete={onAgreementSigningComplete}
          />
        </Suspense>
      ) : null}
    </Box>
  );
}
