import { useState } from "react";

import EscrowLegalLogistics from "./EscrowLegalLogistics";
import InspectionsDueDiligence from "./InspectionsDueDiligence";
import FinancingInsurance from "./FinancingInsurance";
import ClosingMovingIn from "./ClosingMovingIn";

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

export default function BuyerChecklists() {
  const [activeTab, setActiveTab] = useState<ChecklistTab>("escrow");
  const [closePageHeaderData, setClosePageHeaderData] =
    useState<ClosePageHeaderData | null>(null);

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
      {/* Header with progress */}
      <div className="border-b border-gray-200 bg-white px-responsive-md py-responsive-sm">
        <div className="mx-auto w-full max-w-7xl">
          <h1 className="text-responsive-lg font-semibold text-navy">
            {closePageHeaderData?.title || "Buyer Checklists"}
          </h1>
          <p className="text-responsive-xs text-navy/70 mt-1">
            {closePageHeaderData?.subtitle ||
              "Track your progress through the home buying process"}
          </p>
          {closePageHeaderData && !closePageHeaderData.loading && (
            <div className="mt-responsive-xs">
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-brown transition-all duration-300"
                    style={{
                      width: `${
                        (closePageHeaderData.completedCount /
                          closePageHeaderData.totalCount) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-xs text-navy/70 whitespace-nowrap">
                  {closePageHeaderData.completedCount} /{" "}
                  {closePageHeaderData.totalCount}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Bar */}
      <div className="border-b border-gray-200 bg-white px-responsive-md sticky top-0 z-10">
        <div className="mx-auto w-full max-w-7xl">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap border-b-2 px-responsive-sm py-responsive-xs text-responsive-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-brown text-brown"
                    : "border-transparent text-navy/60 hover:border-gray-300 hover:text-navy"
                }`}
              >
                {tab.label}
              </button>
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
