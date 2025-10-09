import React from "react";

import Card from "../../layout/Card";
import { formatStructuredAddress } from "../../../../../packages/utils/address";

import type { PropertyComponentProps } from "./types";
import { formatPrice, formatPropertyType } from "./utils";

export const PropertyBasicInfo: React.FC<PropertyComponentProps> = ({
  property,
}) => {
  // Type-safe property access with proper type guards
  const propertyPrice = property.price;
  const propertySqft = property.sqft;
  const propertyBedrooms = property.bedrooms;
  const propertyBathrooms = property.bathrooms;
  const propertyYearBuilt =
    "yearBuilt" in property ? property.yearBuilt : undefined;
  const propertyLotSize = "lotSize" in property ? property.lotSize : undefined;
  const propertyHomeType =
    "homeType" in property ? property.homeType : undefined;
  const propertyPropertyType =
    "propertyType" in property ? property.propertyType : undefined;
  const propertyPricePerSquareFoot =
    "pricePerSquareFoot" in property ? property.pricePerSquareFoot : undefined;
  const propertyGarageSpaces =
    "garageSpaces" in property ? property.garageSpaces : undefined;
  const propertyParking = "parking" in property ? property.parking : undefined;
  const propertyDaysOnZillow =
    "daysOnZillow" in property ? property.daysOnZillow : undefined;
  const propertyZestimate =
    "zestimate" in property ? property.zestimate : undefined;
  const propertyRentZestimate =
    "rentZestimate" in property ? property.rentZestimate : undefined;

  return (
    <div className="p-6">
      {/* Main Property Info Section - Zillow Style Layout */}
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

      {/* Estimated Monthly Payment Section */}
      <div className="mb-6 rounded-lg bg-blue-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">Est.: $3,790/mo</div>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-800">
            Get pre-qualified
          </button>
        </div>
      </div>

      <Card className="p-4">
        <h3 className="mb-4 text-lg font-semibold text-brown">
          Property Details
        </h3>
        <div className="space-y-3">
          {propertyYearBuilt && Number(propertyYearBuilt) > 0 ? (
            <div className="flex justify-between">
              Year Built:
              {String(propertyYearBuilt)}
            </div>
          ) : null}
          {propertyLotSize &&
          ((typeof propertyLotSize === "number" && propertyLotSize > 0) ||
            (typeof propertyLotSize === "string" &&
              propertyLotSize !== "0" &&
              propertyLotSize.trim() !== "")) ? (
            <div className="flex justify-between">
              Lot Size:
              {String(propertyLotSize)}
            </div>
          ) : null}
          {(propertyHomeType &&
            propertyHomeType !== "" &&
            propertyHomeType !== "0") ||
          (propertyPropertyType &&
            propertyPropertyType !== "" &&
            propertyPropertyType !== "0") ? (
            <div className="flex justify-between">
              Property Type:
              {formatPropertyType(
                (propertyHomeType as string) ??
                  (propertyPropertyType as string) ??
                  ""
              )}
            </div>
          ) : null}
          {propertyPricePerSquareFoot &&
          ((typeof propertyPricePerSquareFoot === "number" &&
            propertyPricePerSquareFoot > 0) ||
            (typeof propertyPricePerSquareFoot === "string" &&
              propertyPricePerSquareFoot !== "0" &&
              propertyPricePerSquareFoot.trim() !== "")) ? (
            <div className="flex justify-between">
              Price per Sq Ft: $
              {(() => {
                if (typeof propertyPricePerSquareFoot === "string")
                  return propertyPricePerSquareFoot;
                if (typeof propertyPricePerSquareFoot === "number")
                  return String(propertyPricePerSquareFoot);
                return "";
              })()}
            </div>
          ) : null}
          {((typeof propertyGarageSpaces === "number" &&
            propertyGarageSpaces > 0) ||
            (typeof propertyParking === "number" && propertyParking > 0)) && (
            <div className="flex justify-between">
              Parking:
              {typeof propertyGarageSpaces === "number" &&
              propertyGarageSpaces > 0
                ? `${propertyGarageSpaces}-car garage`
                : typeof propertyParking === "number" && propertyParking > 0
                  ? `${propertyParking} spaces`
                  : "N/A"}
            </div>
          )}
          {propertyDaysOnZillow &&
          ((typeof propertyDaysOnZillow === "number" &&
            propertyDaysOnZillow > 0) ||
            (typeof propertyDaysOnZillow === "string" &&
              propertyDaysOnZillow !== "0" &&
              propertyDaysOnZillow.trim() !== "")) ? (
            <div className="flex justify-between">
              Days on Market:
              {String(propertyDaysOnZillow)} days
            </div>
          ) : null}
          {typeof propertyZestimate === "number" && propertyZestimate > 0 && (
            <div className="flex justify-between">
              Estimate: ${propertyZestimate.toLocaleString()}
            </div>
          )}
          {typeof propertyRentZestimate === "number" &&
            propertyRentZestimate > 0 && (
              <div className="flex justify-between">
                Rent Estimate: ${propertyRentZestimate.toLocaleString()}/month
              </div>
            )}
        </div>
      </Card>
    </div>
  );
};
