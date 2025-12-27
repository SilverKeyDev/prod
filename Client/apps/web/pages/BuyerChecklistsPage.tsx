import React, { useEffect } from "react";

import EscrowLegalLogistics from "../features/close/subheaders/EscrowLegalLogistics";
import InspectionsDueDiligence from "../features/close/subheaders/InspectionsDueDiligence";
import FinancingInsurance from "../features/close/subheaders/FinancingInsurance";
import ClosingMovingIn from "../features/close/subheaders/ClosingMovingIn";
import ScheduleButton from "../components/ui/button/ScheduleButton";
// Removed store coupling; tab state is now managed by DashboardLayout

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
  activeTab: ChecklistTab;
  onTabChange?: React.Dispatch<React.SetStateAction<ChecklistTab>>;
};

export default function BuyerChecklists({
  setClosePageHeaderData,
  activeTab,
  onTabChange: _onTabChange,
}: BuyerChecklistsProps) {
  const [closePageHeaderData, setClosePageHeaderDataState] =
    React.useState<ClosePageHeaderData | null>(null);

  // Update the parent component's header data
  useEffect(() => {
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
    <div className={`h-full w-full bg-off-white`}>
      {/* Content */}
      <div className="mx-auto w-full max-w-7xl mt-6">
        {/* Schedule Button - Top Right */}
        <div className="flex justify-end mb-4 px-responsive-md">
          <ScheduleButton variant="primary" size="md">
            Schedule Event
          </ScheduleButton>
        </div>
        {renderTabContent()}
      </div>
    </div>
  );
}
