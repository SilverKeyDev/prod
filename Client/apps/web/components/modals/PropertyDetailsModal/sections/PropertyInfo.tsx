import React from "react";

import { formatStructuredAddress } from "../../../../../../packages/utils/search/address";

import type { PropertyComponentProps } from "../types";
import { formatPrice } from "../utils";

export const PropertyInfo: React.FC<PropertyComponentProps> = ({
  property,
}) => {
  // Type-safe property access with proper type guards + explicit typing
  const propertyPrice =
    "price" in property
      ? (property.price as number | string | undefined)
      : undefined;

  const propertySqft =
    "sqft" in property
      ? (property.sqft as number | string | undefined)
      : undefined;

  const propertyBedrooms =
    "bedrooms" in property
      ? (property.bedrooms as number | string | undefined)
      : undefined;

  const propertyBathrooms =
    "bathrooms" in property
      ? (property.bathrooms as number | string | undefined)
      : undefined;

  return (
    <div className="p-6">
      {/* Main Property Info Section */}
      <div className="mb-6 flex items-start justify-between">
        {/* Left Side - Price and Address */}
        <div className="flex-1">
          <div className="mb-2 text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            {formatPrice(propertyPrice)}
          </div>
          <div className="text-sm sm:text-base md:text-lg text-gray-700">
            {(() => {
              const addr = (property as unknown as { address?: unknown })
                .address;
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
                  },
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
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                {propertyBedrooms}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">beds</div>
            </div>
          )}
          {propertyBathrooms && Number(propertyBathrooms) > 0 && (
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                {propertyBathrooms}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 border-b border-dashed border-gray-400">
                baths
              </div>
            </div>
          )}
          {propertySqft && Number(propertySqft) > 0 && (
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                {Math.round(Number(propertySqft)).toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">sqft</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
