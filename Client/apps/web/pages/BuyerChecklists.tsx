import React, { useState } from "react";

import EscrowLegalLogistics from "../features/close/subheaders/EscrowLegalLogistics";
import InspectionsDueDiligence from "../features/close/subheaders/InspectionsDueDiligence";
import FinancingInsurance from "../features/close/subheaders/FinancingInsurance";
import ClosingMovingIn from "../features/close/subheaders/ClosingMovingIn";
import ClosePageHeader from "../features/close/ClosePageHeader";

type ClosePageHeaderData = {
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  loading: boolean;
};

type ChecklistTab = "escrow" | "inspections" | "financing" | "closing";

type BuyerChecklistsProps = {
  setClosePageHeaderData: React.Dispatch<
    React.SetStateAction<ClosePageHeaderData | null>
  >;
};

export default function BuyerChecklists({
  setClosePageHeaderData,
}: BuyerChecklistsProps) {
  const [activeTab, setActiveTab] = useState<ChecklistTab>("escrow");
  const [closePageHeaderData, setClosePageHeaderDataState] =
    useState<ClosePageHeaderData | null>(null);

  // Update the parent component's header data
  React.useEffect(() => {
    setClosePageHeaderData(closePageHeaderData);
  }, [closePageHeaderData, setClosePageHeaderData]);

  // Render the active tab content
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

  return (
    <div className="h-full w-full bg-off-white">
      {/* Header with tabs */}
      {closePageHeaderData && (
        <ClosePageHeader
          title={closePageHeaderData.title}
          subtitle={closePageHeaderData.subtitle}
          completedCount={closePageHeaderData.completedCount}
          totalCount={closePageHeaderData.totalCount}
          loading={closePageHeaderData.loading}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      {/* Content */}
      <div className="mx-auto w-full max-w-7xl mt-6">{renderTabContent()}</div>
    </div>
  );
}
