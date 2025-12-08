import { X, FileText, ExternalLink } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../ui/button/Button";
import { CardHeartSave } from "../../cards/base";
import KeyLogo from "../../ui/asset/KeyLogo";
import MiniLogo from "../../ui/asset/MiniLogo";

import type { PropertyHeaderProps } from "./types";
import { formatAddress, handleZillowOpen } from "./utils";

export const PropertyHeader: React.FC<PropertyHeaderProps> = ({
  property,
  onClose,
  onGenerateReport,
}) => {
  const navigate = useNavigate();

  const propertyAddress = (property as unknown as { address: unknown }).address;

  const handleGenerateFullReport = () => {
    const address = formatAddress(
      propertyAddress as
        | string
        | import("./utils").AddressObject
        | null
        | undefined
    );

    // Save the address to localStorage for the GenerateReportPage
    const generateReportState = {
      address,
      comparisonAddress: "",
      reportType: "detailed",
      selectedClientId: "",
    };

    localStorage.setItem(
      "generateReportState",
      JSON.stringify(generateReportState)
    );

    // Call the optional callback if provided
    if (onGenerateReport) {
      onGenerateReport(address);
    }

    // Navigate to the saved page
    navigate("/saved");
  };

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white p-4">
      {/* Left side - Logo */}
      <div className="flex items-center">
        <MiniLogo size="sm" className="md:hidden" />
        <KeyLogo size="sm" className="hidden md:block" />
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-0.5 md:gap-3">
        <Button
          variant="outline"
          size="md"
          onClick={() => handleZillowOpen(property)}
          icon={<ExternalLink className="h-5 w-5 text-blue-600" />}
          className="group border-blue-600 !text-blue-600 hover:!bg-transparent hover:!text-blue-600 transition-all duration-200"
        >
          Zillow
        </Button>
        {onGenerateReport && (
          <Button
            variant="outline"
            size="md"
            onClick={handleGenerateFullReport}
            icon={<FileText className="h-5 w-5 text-gray-600" />}
            className="border-gray-600 text-gray-600 hover:bg-gray-50"
          >
            Generate Report
          </Button>
        )}

        <CardHeartSave
          property={property}
          size="lg"
          className="text-gray-600 hover:bg-gray-50 rounded-md transition-colors p-2"
        />

        <button
          onClick={onClose}
          className="-ml-1 p-2 hover:bg-gray-50 rounded-md transition-colors md:ml-0"
          aria-label="Close modal"
        >
          <X className="h-6 w-6 text-gray-600" />
        </button>
      </div>
    </div>
  );
};
