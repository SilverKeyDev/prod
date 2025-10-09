import { X, Heart, FileText, ExternalLink } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../ui/button/Button";

import type { PropertyHeaderProps } from "./types";
import { formatAddress, formatPrice, handleZillowOpen } from "./utils";

export const PropertyHeader: React.FC<PropertyHeaderProps> = ({
  property,
  onClose,
  isHomeSaved,
  saveHome,
  removeSavedHome,
  onGenerateReport,
}) => {
  const navigate = useNavigate();
  const isSaved = isHomeSaved(
    (property as unknown as { id: unknown }).id as string
  );
  const propertyId = (property as unknown as { id: unknown }).id as string;
  const propertyAddress = (property as unknown as { address: unknown }).address;
  const propertyPrice = (property as unknown as { price: unknown }).price;

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

    // Navigate to the reports page
    navigate("/saved?view=reports");
  };

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white p-4">
      <div className="flex-1 hidden md:block">
        <h2 className="text-xl font-bold text-gray-900">
          {formatPrice(propertyPrice as string | number)}
        </h2>
        <p className="text-responsive-xs mt-1 truncate text-gray-600">
          {formatAddress(
            propertyAddress as
              | string
              | import("./utils").AddressObject
              | null
              | undefined
          )}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleZillowOpen(property)}
          icon={<ExternalLink className="h-4 w-4 text-gray-600" />}
          className="border-gray-600 text-gray-600 hover:bg-gray-50"
        >
          Zillow
        </Button>
        {onGenerateReport && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateFullReport}
            icon={<FileText className="h-4 w-4 text-olive" />}
            className="border-olive text-olive hover:bg-olive/10"
          >
            Generate Report
          </Button>
        )}

        <button
          onClick={() => {
            if (isSaved) {
              removeSavedHome(propertyId);
            } else {
              void saveHome(property);
            }
          }}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          aria-label={isSaved ? "Remove from saved" : "Save home"}
        >
          <Heart
            className={`h-5 w-5 ${isSaved ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-500"}`}
          />
        </button>

        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
};
