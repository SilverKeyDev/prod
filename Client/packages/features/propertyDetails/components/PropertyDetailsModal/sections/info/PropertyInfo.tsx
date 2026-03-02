import React from "react";

import type { PropertyComponentProps } from "@/components/modals/PropertyDetailsModal/types";
import { formatStructuredAddress } from "@/features/search/types/search/address";
import { formatPrice } from "@/features/search/types/search/propertyDetailsFormatters";

export const PropertyInfo: React.FC<PropertyComponentProps> = ({ property }) => {
  // Type-safe property access with proper type guards + explicit typing
  const propertyPrice =
    "price" in property ? (property.price as number | string | undefined) : undefined;

  const propertySqft =
    "sqft" in property ? (property.sqft as number | string | undefined) : undefined;

  const propertyBedrooms =
    "bedrooms" in property ? (property.bedrooms as number | string | undefined) : undefined;

  const propertyBathrooms =
    "bathrooms" in property ? (property.bathrooms as number | string | undefined) : undefined;

  return (
    <div className="p-6">
      {/* Main Property Info Section */}
      <div className="mb-6 flex items-start justify-between">
        {/* Left Side - Price and Address */}
        <div className="flex-1">
          <div className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl">
            {formatPrice(propertyPrice)}
          </div>
          <div className="text-sm text-gray-700 sm:text-base md:text-lg">
            {(() => {
              const addr = (property as unknown as { address?: unknown }).address;
              if (!addr) return "Address not available";
              if (typeof addr === "string") return addr;
              if (
                typeof addr === "object" &&
                addr !== null &&
                "streetAddress" in addr &&
                "city" in addr &&
                "state" in addr &&
                "zipcode" in addr
              ) {
                return formatStructuredAddress(
                  addr as {
                    streetAddress: string;
                    city: string;
                    state: string;
                    zipcode: string;
                  }
                );
              }
              try {
                return JSON.stringify(addr);
              } catch {
                return "Address not available";
              }
            })()}
          </div>
        </div>

        {/* Right Side - Property Specs */}
        <div className="flex items-center gap-2 sm:gap-4">
          {propertyBedrooms && Number(propertyBedrooms) > 0 && (
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">
                {propertyBedrooms}
              </div>
              <div className="text-xs text-gray-600 sm:text-sm">beds</div>
            </div>
          )}
          {propertyBathrooms && Number(propertyBathrooms) > 0 && (
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">
                {propertyBathrooms}
              </div>
              <div className="border-b border-dashed border-gray-400 text-xs text-gray-600 sm:text-sm">
                baths
              </div>
            </div>
          )}
          {propertySqft && Number(propertySqft) > 0 && (
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">
                {Math.round(Number(propertySqft)).toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 sm:text-sm">sqft</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
