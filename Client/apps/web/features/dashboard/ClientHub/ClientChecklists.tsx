import React, { useEffect } from "react";
import EscrowLegalLogistics from "../../../features/close/subheaders/EscrowLegalLogistics";
import InspectionsDueDiligence from "../../../features/close/subheaders/InspectionsDueDiligence";
import FinancingInsurance from "../../../features/close/subheaders/FinancingInsurance";
import ClosingMovingIn from "../../../features/close/subheaders/ClosingMovingIn";

type ClosePageHeaderData = {
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  loading: boolean;
};

type ChecklistTab = "escrow" | "inspections" | "financing" | "closing";

type ClientChecklistsProps = {
  userId: string;
  activeTab: ChecklistTab;
  onTabChange?: (tab: ChecklistTab) => void;
};

export default function ClientChecklists({
  userId,
  activeTab,
  onTabChange: _onTabChange,
}: ClientChecklistsProps) {
  const [closePageHeaderData, setClosePageHeaderDataState] =
    React.useState<ClosePageHeaderData | null>(null);

  // Render the active tab content
  // Note: These components currently work with the authenticated user's data.
  // Backend API needs to support userId parameter to fetch checklists for a specific user
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
      <div className="mx-auto w-full max-w-7xl mt-6">{renderTabContent()}</div>
    </div>
  );
}
