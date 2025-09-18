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
    navigate("/generate-report");
  };

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex-1">
        <h2 className="text-xl font-bold text-gray-900">
          {formatPrice(propertyPrice as string | number)}
        </h2>
        <p className="text-responsive-xs mt-1 truncate text-gray-600">
          {formatAddress(propertyAddress as any)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleZillowOpen(property)}
          icon={<ExternalLink className="h-4 w-4" />}
          className="!text-blue-600 !border-blue-600 hover:!bg-blue-50 hover:!text-blue-600 hover:!border-blue-600"
        >
          Zillow
        </Button>
        {onGenerateReport && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateFullReport}
            icon={<FileText className="h-4 w-4" />}
            className="text-olive border-olive hover:bg-olive/10 hover:border-olive hover:text-olive"
          >
            Generate Report
          </Button>
        )}

        <Button
          variant="ghost"
          size="md"
          onClick={() => {
            if (isSaved) {
              removeSavedHome(propertyId);
            } else {
              void saveHome(property);
            }
          }}
          icon={
            <Heart
              className={`h-5 w-5 ${isSaved ? "fill-red-500 text-red-500" : ""}`}
            />
          }
        />

        <Button
          variant="ghost"
          size="md"
          onClick={onClose}
          icon={<X className="h-5 w-5 text-gray-400" />}
        />
      </div>
    </div>
  );
};
