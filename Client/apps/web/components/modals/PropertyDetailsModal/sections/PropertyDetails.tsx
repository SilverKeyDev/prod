import { User, Phone } from "lucide-react";
import React from "react";

import Card from "../../../layout/Card";

import type { PropertyComponentProps } from "../types";
import { formatPropertyType } from "../utils";

export const PropertyDetails: React.FC<PropertyComponentProps> = ({
  property,
}) => {
  const propertyYearBuilt =
    "yearBuilt" in property
      ? (property.yearBuilt as number | string | undefined)
      : undefined;

  const propertyLotSize =
    "lotSize" in property
      ? (property.lotSize as number | string | undefined)
      : undefined;

  const propertyHomeType =
    "homeType" in property
      ? (property.homeType as string | undefined)
      : undefined;

  const propertyPropertyType =
    "propertyType" in property
      ? (property.propertyType as string | undefined)
      : undefined;

  const propertyPricePerSquareFoot =
    "pricePerSquareFoot" in property
      ? (property.pricePerSquareFoot as number | string | undefined)
      : undefined;

  const propertyGarageSpaces =
    "garageSpaces" in property
      ? (property.garageSpaces as number | undefined)
      : undefined;

  const propertyParking =
    "parking" in property
      ? (property.parking as number | undefined)
      : undefined;

  const propertyDaysOnZillow =
    "daysOnZillow" in property
      ? (property.daysOnZillow as number | string | undefined)
      : undefined;

  const propertyZestimate =
    "zestimate" in property
      ? (property.zestimate as number | undefined)
      : undefined;

  const propertyRentZestimate =
    "rentZestimate" in property
      ? (property.rentZestimate as number | undefined)
      : undefined;

  // Agent data extraction
  const listedBy = (property as unknown as { listed_by: unknown }).listed_by;
  const hasAgent: boolean = !!(
    listedBy &&
    typeof listedBy === "object" &&
    listedBy !== null
  );
  const agent = hasAgent ? (listedBy as Record<string, unknown>) : null;
  const imageUrl = agent?.image_url as string | undefined;
  const displayName = agent?.display_name as string | undefined;
  const businessName = agent?.business_name as string | undefined;
  const phone = agent?.phone as Record<string, unknown> | undefined;

  // Helper function to format phone number
  const formatPhoneNumber = (
    ph: Record<string, unknown> | undefined
  ): string => {
    if (!ph) return "Phone available";
    const { areacode, prefix, number } = ph as {
      areacode?: unknown;
      prefix?: unknown;
      number?: unknown;
    };

    const safeStringify = (value: unknown): string => {
      if (typeof value === "string") return value;
      if (typeof value === "number") return String(value);
      if (value === null || value === undefined) return "";
      if (typeof value === "object" && value !== null) {
        try {
          return JSON.stringify(value);
        } catch {
          return "[Object]";
        }
      }
      try {
        if (typeof value === "string") return value;
        if (typeof value === "number") return String(value);
        if (typeof value === "boolean") return String(value);
        if (value === null || value === undefined) return "";
        return "[Unknown]";
      } catch {
        return "[Unknown]";
      }
    };

    if (areacode && prefix && number) {
      return `(${safeStringify(areacode)}) ${safeStringify(
        prefix
      )}-${safeStringify(number)}`;
    }
    return (
      (typeof areacode === "string" ? areacode : null) ??
      (typeof prefix === "string" ? prefix : null) ??
      (typeof number === "string" ? number : null) ??
      "Phone available"
    );
  };

  const hasDetails =
    (propertyYearBuilt && Number(propertyYearBuilt) > 0) ||
    (propertyLotSize &&
      ((typeof propertyLotSize === "number" && propertyLotSize > 0) ||
        (typeof propertyLotSize === "string" &&
          propertyLotSize !== "0" &&
          propertyLotSize.trim() !== ""))) ||
    (propertyHomeType && propertyHomeType !== "" && propertyHomeType !== "0") ||
    (propertyPropertyType &&
      propertyPropertyType !== "" &&
      propertyPropertyType !== "0") ||
    (propertyPricePerSquareFoot &&
      ((typeof propertyPricePerSquareFoot === "number" &&
        propertyPricePerSquareFoot > 0) ||
        (typeof propertyPricePerSquareFoot === "string" &&
          propertyPricePerSquareFoot !== "0" &&
          propertyPricePerSquareFoot.trim() !== ""))) ||
    (typeof propertyGarageSpaces === "number" && propertyGarageSpaces > 0) ||
    (typeof propertyParking === "number" && propertyParking > 0) ||
    (propertyDaysOnZillow &&
      ((typeof propertyDaysOnZillow === "number" && propertyDaysOnZillow > 0) ||
        (typeof propertyDaysOnZillow === "string" &&
          propertyDaysOnZillow !== "0" &&
          propertyDaysOnZillow.trim() !== ""))) ||
    (typeof propertyZestimate === "number" && propertyZestimate > 0) ||
    (typeof propertyRentZestimate === "number" && propertyRentZestimate > 0);

  if (!hasDetails && !hasAgent) {
    return null;
  }

  return (
    <div className="p-6">
      {/* Property Details Card with Agent Section Inside */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Property Details - Left Column (2/3 width on large screens) */}
          <div className="lg:col-span-2">
            <h3 className="mb-4 text-lg font-semibold text-brown">
              Property Details
            </h3>
            <div className="space-y-3 mt-2">
              {propertyYearBuilt && Number(propertyYearBuilt) > 0 && (
                <div className="flex justify-between">
                  Year Built:
                  {String(propertyYearBuilt)}
                </div>
              )}
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
                (typeof propertyParking === "number" &&
                  propertyParking > 0)) && (
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
              {typeof propertyZestimate === "number" &&
                propertyZestimate > 0 && (
                  <div className="flex justify-between">
                    Estimate: ${propertyZestimate.toLocaleString()}
                  </div>
                )}
              {typeof propertyRentZestimate === "number" &&
                propertyRentZestimate > 0 && (
                  <div className="flex justify-between">
                    Rent Estimate: ${propertyRentZestimate.toLocaleString()}
                    /month
                  </div>
                )}
            </div>
          </div>

          {/* Agent Section - Right Column (1/3 width on large screens) */}
          {hasAgent && (
            <div className="lg:col-span-1">
              <div className="mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-brown" />
                <h3 className="text-lg font-semibold text-brown">
                  Listing Agent
                </h3>
              </div>
              <div className="flex items-start space-x-4">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-brown/20 bg-brown/10">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={displayName ?? "Listing Agent"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <User className="h-8 w-8 text-brown/60" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  {displayName && (
                    <h4 className="text-lg font-medium text-gold">
                      {displayName}
                    </h4>
                  )}
                  {businessName && (
                    <p className="text-brown/70">{businessName}</p>
                  )}
                  {phone && (
                    <div className="mt-2 flex items-center text-brown">
                      <Phone className="mr-1 h-4 w-4" />
                      {formatPhoneNumber(phone)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
