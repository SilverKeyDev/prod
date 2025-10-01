import { X, Heart, FileText, ExternalLink } from "lucide-react";
import React from "react";

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
  const isSaved = isHomeSaved(
    (property as unknown as { id: unknown }).id as string,
  );
  const propertyId = (property as unknown as { id: unknown }).id as string;
  const propertyAddress = (property as unknown as { address: unknown }).address;
  const propertyPrice = (property as unknown as { price: unknown }).price;

  const handleGenerateFullReport = () => {
    if (onGenerateReport) {
      onGenerateReport(
        formatAddress(
          propertyAddress as
            | string
            | import("./utils").AddressObject
            | null
            | undefined,
        ),
      );
    }
  };

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white p-4">
      <div className="flex-1">
        <h2 className="text-xl font-bold text-gray-900">
          {formatPrice(propertyPrice as string | number)}
        </h2>
        <p className="text-responsive-xs mt-1 truncate text-gray-600">
          {formatAddress(
            propertyAddress as
              | string
              | import("./utils").AddressObject
              | null
              | undefined,
          )}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleZillowOpen(property)}
          icon={<ExternalLink className="h-4 w-4" />}
        >
          Zillow
        </Button>
        {onGenerateReport && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateFullReport}
            icon={<FileText className="h-4 w-4" />}
          >
            Generate Report
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (isSaved) {
              removeSavedHome(propertyId);
            } else {
              void saveHome(property);
            }
          }}
          icon={
            <Heart
              className={`h-4 w-4 ${isSaved ? "fill-red-500 text-red-500" : ""}`}
            />
          }
        >
          {isSaved ? "Saved" : "Save"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          icon={<X className="h-4 w-4" />}
        >
          Close
        </Button>
      </div>
    </div>
  );
};
