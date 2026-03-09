import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  ClosingMovingIn,
  EscrowLegalLogistics,
  FinancingInsurance,
  InspectionsDueDiligence,
} from "packages/features/checklists";
import { useViewStore, type ViewState } from "packages/store";
import { CHECKLIST_SUBTITLES, CHECKLIST_TITLES, type ChecklistTab } from "packages/types";

import { ClientSelector } from "@/components/ui";

import DashboardChecklistsHeader from "./DashboardChecklistsHeader";

type ClosePageHeaderData = {
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  loading: boolean;
};

const CHECKLIST_TABS: ChecklistTab[] = ["escrow", "inspections", "financing", "closing"];

function ChecklistTabContent({
  activeTab,
  setClosePageHeaderData,
}: {
  activeTab: ChecklistTab;
  setClosePageHeaderData: React.Dispatch<React.SetStateAction<ClosePageHeaderData | null>>;
}) {
  switch (activeTab) {
    case "escrow":
      return <EscrowLegalLogistics setClosePageHeaderData={setClosePageHeaderData} />;
    case "inspections":
      return <InspectionsDueDiligence setClosePageHeaderData={setClosePageHeaderData} />;
    case "financing":
      return <FinancingInsurance setClosePageHeaderData={setClosePageHeaderData} />;
    case "closing":
      return <ClosingMovingIn setClosePageHeaderData={setClosePageHeaderData} />;
    default:
      return null;
  }
}

export default function DashboardChecklists() {
  const [closePageHeaderData, setClosePageHeaderDataState] = useState<ClosePageHeaderData | null>(
    null
  );
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const persistedTab = useViewStore(
    (s: ViewState) => s.dropdownSelections["buyerChecklists.activeTab"] as ChecklistTab | undefined
  );
  const setDropdownSelection = useViewStore((s: ViewState) => s.setDropdownSelection);

  const initialTab = useMemo<ChecklistTab>(() => {
    return persistedTab && CHECKLIST_TABS.includes(persistedTab) ? persistedTab : "escrow";
  }, [persistedTab]);

  const [activeTab, setActiveTab] = useState<ChecklistTab>(initialTab);

  useEffect(() => {
    setDropdownSelection("buyerChecklists.activeTab", activeTab as string);
  }, [activeTab, setDropdownSelection]);

  const handleTabChange = useCallback((tab: ChecklistTab) => {
    setActiveTab(tab);
  }, []);

  const headerData = closePageHeaderData ?? {
    title: CHECKLIST_TITLES[activeTab],
    subtitle: CHECKLIST_SUBTITLES[activeTab],
    completedCount: 0,
    totalCount: 0,
    loading: true,
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <ClientSelector selectedClientId={selectedClientId} onClientChange={setSelectedClientId} />
      </div>

      <div className="mb-4">
        <DashboardChecklistsHeader
          title={headerData.title}
          subtitle={headerData.subtitle}
          completedCount={headerData.completedCount}
          totalCount={headerData.totalCount}
          loading={headerData.loading}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      <div className="w-full">
        <ChecklistTabContent
          activeTab={activeTab}
          setClosePageHeaderData={setClosePageHeaderDataState}
        />
      </div>
    </div>
  );
}
