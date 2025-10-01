import { useState } from "react";

import EscrowLegalLogistics from "../features/close/subheaders/EscrowLegalLogistics";
import InspectionsDueDiligence from "../features/close/subheaders/InspectionsDueDiligence";
import FinancingInsurance from "../features/close/subheaders/FinancingInsurance";
import ClosingMovingIn from "../features/close/subheaders/ClosingMovingIn";

type ClosePageHeaderData = {
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  loading: boolean;
};

type ChecklistTab = "escrow" | "inspections" | "financing" | "closing";

const tabs: Array<{ id: ChecklistTab; label: string }> = [
  { id: "escrow", label: "Escrow & Legal" },
  { id: "inspections", label: "Inspections & Due Diligence" },
  { id: "financing", label: "Financing & Insurance" },
  { id: "closing", label: "Closing & Move-In" },
];

type BuyerChecklistsProps = {
  setClosePageHeaderData: React.Dispatch<
    React.SetStateAction<ClosePageHeaderData | null>
  >;
};

export default function BuyerChecklists({
  setClosePageHeaderData,
}: BuyerChecklistsProps) {
  const [activeTab, setActiveTab] = useState<ChecklistTab>("escrow");

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "escrow":
        return (
          <EscrowLegalLogistics
            setClosePageHeaderData={setClosePageHeaderData}
          />
        );
      case "inspections":
        return (
          <InspectionsDueDiligence
            setClosePageHeaderData={setClosePageHeaderData}
          />
        );
      case "financing":
        return (
          <FinancingInsurance setClosePageHeaderData={setClosePageHeaderData} />
        );
      case "closing":
        return (
          <ClosingMovingIn setClosePageHeaderData={setClosePageHeaderData} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full bg-off-white">
      {/* Modern Toggle Bar */}
      <div className="border-b border-gray-200 bg-white px-responsive-md sticky top-0 z-10 shadow-sm">
        <div className="mx-auto w-[95%] max-w-7xl">
          <div className="flex justify-center overflow-x-auto scrollbar-hide">
            {tabs.map((tab, index) => (
              <div
                key={tab.id}
                className="flex items-center flex-1 max-w-[23.75%]"
              >
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full px-responsive-sm py-responsive-xs font-medium transition-all duration-200 rounded-lg mx-1 ${
                    activeTab === tab.id
                      ? "bg-olive text-white shadow-md transform scale-105"
                      : "text-navy/70 hover:bg-olive/10 hover:text-olive hover:shadow-sm"
                  }`}
                >
                  <div className="text-center text-sm font-medium">
                    {tab.label}
                  </div>
                </button>
                {index < tabs.length - 1 && (
                  <div className="h-6 w-px bg-gray-300 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-7xl py-responsive-md">
        {renderTabContent()}
      </div>
    </div>
  );
}
