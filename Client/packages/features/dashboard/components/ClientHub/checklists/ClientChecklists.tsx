import React from "react";

import {
  ClosingMovingIn,
  EscrowLegalLogistics,
  FinancingInsurance,
  InspectionsDueDiligence,
} from "packages/features/checklists";

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
  userId: _userId,
  activeTab,
  onTabChange: _onTabChange,
}: ClientChecklistsProps) {
  const [_closePageHeaderData, setClosePageHeaderDataState] =
    React.useState<ClosePageHeaderData | null>(null);

  // Render the active tab content
  // Note: These components currently work with the authenticated user's data.
  // Backend API needs to support userId parameter to fetch checklists for a specific user
  const renderTabContent = () => {
    switch (activeTab) {
      case "escrow":
        return <EscrowLegalLogistics setClosePageHeaderData={setClosePageHeaderDataState} />;
      case "inspections":
        return <InspectionsDueDiligence setClosePageHeaderData={setClosePageHeaderDataState} />;
      case "financing":
        return <FinancingInsurance setClosePageHeaderData={setClosePageHeaderDataState} />;
      case "closing":
        return <ClosingMovingIn setClosePageHeaderData={setClosePageHeaderDataState} />;
      default:
        return null;
    }
  };

  return (
    <div className={`bg-off-white h-full w-full`}>
      {/* Content */}
      <div className="mx-auto mt-6 w-full max-w-7xl">{renderTabContent()}</div>
    </div>
  );
}
