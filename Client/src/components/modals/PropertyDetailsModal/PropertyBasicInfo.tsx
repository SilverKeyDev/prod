import { User, Phone, Home } from "lucide-react";
import React from "react";

import Card from "../../format/Card";

import type { PropertyComponentProps } from "./types";
import { formatPrice, formatPropertyType, formatAddress } from "./utils";

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

  // Agent information
  const listedBy = (property as unknown as { listed_by: unknown }).listed_by;
  const agent =
    listedBy && typeof listedBy === "object"
      ? (listedBy as Record<string, unknown>)
      : null;
  const agentImageUrl = agent?.image_url as string | undefined;
  const agentDisplayName = agent?.display_name as string | undefined;
  const agentBusinessName = agent?.business_name as string | undefined;
  const agentPhone = agent?.phone as Record<string, unknown> | undefined;

  return (
    <div className="px-6 py-6">
      {/* Main Property Info Section - Zillow Style Layout */}
      <div className="mb-6 flex items-start justify-between">
        {/* Left Side - Price and Address */}
        <div className="flex-1">
          <div className="mb-2 text-4xl font-bold text-gray-900">
            {formatPrice(propertyPrice)}
          </div>
          <div className="text-lg text-gray-700">
            {formatAddress(property.address) || "Address not available"}
          </div>
        </div>

        {/* Right Side - Property Specs */}
        <div className="flex items-end space-x-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {propertyBedrooms ?? "—"}
            </div>
            <div className="text-sm text-gray-600">beds</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {propertyBathrooms ?? "—"}
            </div>
            <div className="text-sm text-gray-600 border-b border-dashed border-gray-400">
              baths
            </div>
          </div>
          {propertySqft && Number(propertySqft) > 0 && (
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {Math.round(Number(propertySqft)).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">sqft</div>
            </div>
          )}
        </div>
      </div>

      {/* Estimated Monthly Payment Section */}
      <div className="mb-6 rounded-lg bg-olive/10 p-4">
        <div className="flex items-center">
          <span className="text-lg text-olive border-b border-dashed border-olive/40">
            Est.: $3,790/mo
          </span>
        </div>
      </div>

      {/* Two Column Layout: Property Details and Agent Information */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Property Details Column */}
        <Card className="p-4 border-r-0">
          <div className="mb-4 flex items-center gap-2">
            <Home className="h-5 w-5 text-brown/70" />
            <h3 className="text-lg font-semibold text-brown">
              Property Details
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Year Built:</span>
              <span className="font-medium">
                {propertyYearBuilt != null ? String(propertyYearBuilt) : "N/A"}
              </span>
            </div>
            {(typeof propertyLotSize === "number" ||
              typeof propertyLotSize === "string") && (
              <div className="flex justify-between">
                <span className="text-gray-600">Lot Size:</span>
                <span className="font-medium">{String(propertyLotSize)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Property Type:</span>
              <span className="font-medium">
                {formatPropertyType(
                  (propertyHomeType as string) ??
                    (propertyPropertyType as string) ??
                    ""
                )}
              </span>
            </div>
            {(typeof propertyPricePerSquareFoot === "number" ||
              typeof propertyPricePerSquareFoot === "string") && (
              <div className="flex justify-between">
                <span className="text-gray-600">Price per Sq Ft:</span>
                <span className="font-medium">
                  $
                  {(() => {
                    if (typeof propertyPricePerSquareFoot === "string")
                      return propertyPricePerSquareFoot;
                    if (typeof propertyPricePerSquareFoot === "number")
                      return String(propertyPricePerSquareFoot);
                    return "";
                  })()}
                </span>
              </div>
            )}
            {((typeof propertyGarageSpaces === "number" &&
              propertyGarageSpaces > 0) ||
              (typeof propertyParking === "number" && propertyParking > 0)) && (
              <div className="flex justify-between">
                <span className="text-gray-600">Parking:</span>
                <span className="font-medium">
                  {typeof propertyGarageSpaces === "number" &&
                  propertyGarageSpaces > 0
                    ? `${propertyGarageSpaces}-car garage`
                    : typeof propertyParking === "number" && propertyParking > 0
                      ? `${propertyParking} spaces`
                      : "N/A"}
                </span>
              </div>
            )}
            {(typeof propertyDaysOnZillow === "number" ||
              typeof propertyDaysOnZillow === "string") && (
              <div className="flex justify-between">
                <span className="text-gray-600">Days on Market:</span>
                <span className="font-medium">
                  {String(propertyDaysOnZillow)} days
                </span>
              </div>
            )}
            {typeof propertyZestimate === "number" && propertyZestimate > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Estimate:</span>
                <span className="font-medium">
                  ${propertyZestimate.toLocaleString()}
                </span>
              </div>
            )}
            {typeof propertyRentZestimate === "number" &&
              propertyRentZestimate > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Rent Estimate:</span>
                  <span className="font-medium">
                    ${propertyRentZestimate.toLocaleString()}/month
                  </span>
                </div>
              )}
          </div>
        </Card>

        {/* Agent Information Column */}
        {agent && (
          <Card className="p-4 border-r-0">
            <div className="mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500/70" />
              <h3 className="text-lg font-semibold text-brown">
                Listing Agent
              </h3>
            </div>
            <div className="flex items-start space-x-4">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-brown/20 bg-brown/10">
                {agentImageUrl ? (
                  <img
                    src={agentImageUrl}
                    alt={agentDisplayName ?? "Listing Agent"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="h-8 w-8 text-brown/60" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-medium text-brown">
                  {agentDisplayName}
                </h4>
                {agentBusinessName && (
                  <p className="text-brown/70">{agentBusinessName}</p>
                )}
                {agentPhone && (
                  <div className="mt-2 flex items-center text-brown">
                    <Phone className="mr-1 h-4 w-4" />
                    <span>
                      {(() => {
                        const ph = agentPhone;
                        if (!ph) return "Phone available";
                        const { areacode, prefix, number } = ph;

                        const safeStringify = (value: unknown): string => {
                          if (typeof value === "string") return value;
                          if (typeof value === "number") return String(value);
                          if (value === null || value === undefined) return "";
                          return "[Unknown]";
                        };

                        if (areacode && prefix && number) {
                          return `(${safeStringify(areacode)}) ${safeStringify(prefix)}-${safeStringify(number)}`;
                        }
                        return (
                          (typeof areacode === "string" ? areacode : null) ??
                          (typeof prefix === "string" ? prefix : null) ??
                          (typeof number === "string" ? number : null) ??
                          "Phone available"
                        );
                      })()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
