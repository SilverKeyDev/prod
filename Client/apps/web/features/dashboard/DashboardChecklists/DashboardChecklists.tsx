import React, { useState, useMemo, useEffect, useCallback } from "react";
import EscrowLegalLogistics from "../../close/subheaders/EscrowLegalLogistics";
import InspectionsDueDiligence from "../../close/subheaders/InspectionsDueDiligence";
import FinancingInsurance from "../../close/subheaders/FinancingInsurance";
import ClosingMovingIn from "../../close/subheaders/ClosingMovingIn";
import { ClientSelector } from "../../../components/ui";
import DashboardChecklistsHeader from "./DashboardChecklistsHeader";
import {
  CHECKLIST_TITLES,
  CHECKLIST_SUBTITLES,
  type ChecklistTab,
} from "../../../../../packages/schemas";
import { useViewStore, type ViewState } from "../../../../../packages/store/view.slice";

type ClosePageHeaderData = {
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  loading: boolean;
};

const CHECKLIST_TABS: ChecklistTab[] = [
  "escrow",
  "inspections",
  "financing",
  "closing",
];

export default function DashboardChecklists() {
  const [closePageHeaderData, setClosePageHeaderDataState] =
    useState<ClosePageHeaderData | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const persistedTab = useViewStore(
    (s: ViewState) =>
      s.dropdownSelections["buyerChecklists.activeTab"] as
        | ChecklistTab
        | undefined,
  );
  const setDropdownSelection = useViewStore(
    (s: ViewState) => s.setDropdownSelection,
  );

  const initialTab = useMemo<ChecklistTab>(() => {
    return persistedTab && CHECKLIST_TABS.includes(persistedTab)
      ? persistedTab
      : "escrow";
  }, [persistedTab]);

  const [activeTab, setActiveTab] = useState<ChecklistTab>(initialTab);

  useEffect(() => {
    setDropdownSelection("buyerChecklists.activeTab", activeTab as string);
  }, [activeTab, setDropdownSelection]);

  const handleTabChange = useCallback((tab: ChecklistTab) => {
    setActiveTab(tab);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case "escrow":
        return (
          <EscrowLegalLogistics
            setClosePageHeaderData={setClosePageHeaderDataState}
          />
        );
      case "inspections":
        return (
          <InspectionsDueDiligence
            setClosePageHeaderData={setClosePageHeaderDataState}
          />
        );
      case "financing":
        return (
          <FinancingInsurance
            setClosePageHeaderData={setClosePageHeaderDataState}
          />
        );
      case "closing":
        return (
          <ClosingMovingIn
            setClosePageHeaderData={setClosePageHeaderDataState}
          />
        );
      default:
        return null;
    }
  };

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
        <ClientSelector
          selectedClientId={selectedClientId}
          onClientChange={setSelectedClientId}
        />
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

      <div className="w-full">{renderTabContent()}</div>
    </div>
  );
}
