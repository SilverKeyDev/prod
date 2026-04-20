import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useLocalization } from "packages/contexts";
import {
  BuyerRoadmapChecklistList,
  CHECKLIST_SUBTITLES,
  CHECKLIST_TITLES,
  type ChecklistTab,
  type ChecklistType,
  sortTaskChecklistItems,
  useChecklistData,
  useChecklistProgress,
} from "packages/features/checklists";
import { useViewStore, type ViewState } from "packages/store";
import ClientSelector from "packages/ui/components/button/ClientSelector";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

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

  const { items, checkedIds, activeItemId, isLoading, error, toggleItem, refreshChecklist } =
    useChecklistData(checklistType);

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
        isSectionLocked={isSectionLocked}
        isLoading={isLoading}
        error={error}
        onRefresh={handleRefresh}
        onToggleItem={handleToggleItem}
        getItemToggleEligibility={getItemToggleEligibility}
        sectionProgress={sectionProgress}
        onRoadmapTabNavigate={handleTabChange}
        subtitle={
          <BodyText size="sm" className="text-text-secondary mb-4" as="p">
            {CHECKLIST_SUBTITLES[activeTab] ?? CHECKLIST_SUBTITLES.search}
          </BodyText>
        }
      />
    </Box>
  );
}
