import { User, Phone } from "lucide-react";
import React from "react";

import Card from "../../../layout/Card";
import { formatStructuredAddress } from "../../../../../../packages/utils/address";

import type { PropertyComponentProps } from "../types";
import { formatPrice } from "../utils";
import { PropertyDetailsList } from "./PropertyDetailsList";

export const PropertyBasicInfo: React.FC<PropertyComponentProps> = ({
  property,
}) => {
  // Coerce unknown -> ReactNode safely (fixes TS2322 when a formatter returns unknown)
  const asReactNode = (v: unknown): React.ReactNode => {
    if (React.isValidElement(v)) return v;
    if (typeof v === "string" || typeof v === "number") return v;
    if (v === null || v === undefined) return "—";
    if (typeof v === "boolean") return v ? "true" : "false";
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  };

  // Type-safe property access with proper type guards + explicit typing
  const propertyPrice: number | string | undefined =
    "price" in property
      ? (property.price as number | string | undefined)
      : undefined;

  const propertySqft: number | string | undefined =
    "sqft" in property
      ? (property.sqft as number | string | undefined)
      : undefined;

  const propertyBedrooms: number | string | undefined =
    "bedrooms" in property
      ? (property.bedrooms as number | string | undefined)
      : undefined;

  const propertyBathrooms: number | string | undefined =
    "bathrooms" in property
      ? (property.bathrooms as number | string | undefined)
      : undefined;

  const propertyYearBuilt: number | string | undefined =
    "yearBuilt" in property
      ? (property.yearBuilt as number | string | undefined)
      : undefined;

  const propertyLotSize: number | string | undefined =
    "lotSize" in property
      ? (property.lotSize as number | string | undefined)
      : undefined;

  const propertyHomeType: string | undefined =
    "homeType" in property
      ? (property.homeType as string | undefined)
      : undefined;

  const propertyPropertyType: string | undefined =
    "propertyType" in property
      ? (property.propertyType as string | undefined)
      : undefined;

  const propertyPricePerSquareFoot: number | string | undefined =
    "pricePerSquareFoot" in property
      ? (property.pricePerSquareFoot as number | string | undefined)
      : undefined;

  const propertyGarageSpaces: number | undefined =
    "garageSpaces" in property
      ? (property.garageSpaces as number | undefined)
      : undefined;

  const propertyParking: number | undefined =
    "parking" in property
      ? (property.parking as number | undefined)
      : undefined;

  const propertyZestimate: number | undefined =
    "zestimate" in property
      ? (property.zestimate as number | undefined)
      : undefined;

  const propertyRentZestimate: number | undefined =
    "rentZestimate" in property
      ? (property.rentZestimate as number | undefined)
      : undefined;

  // Agent data extraction
  const listedBy = (property as unknown as { listed_by: unknown }).listed_by;
  const hasAgent =
    listedBy && typeof listedBy === "object" && listedBy !== null;
  const agent = hasAgent ? (listedBy as Record<string, unknown>) : null;
  const imageUrl = agent?.image_url as string | undefined;
  const displayName = agent?.display_name as string | undefined;
  const businessName = agent?.business_name as string | undefined;
  const phone = agent?.phone as Record<string, unknown> | undefined;

  // Helper function to format phone number
  const formatPhoneNumber = (
    ph: Record<string, unknown> | undefined,
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
      if (typeof value === "boolean") return String(value);
      if (value === null || value === undefined) return "";
      if (typeof value === "object") {
        try {
          return JSON.stringify(value);
        } catch {
          return "[Object]";
        }
      }
      return "[Unknown]";
    };

    if (areacode && prefix && number) {
      return `(${safeStringify(areacode)}) ${safeStringify(
        prefix,
      )}-${safeStringify(number)}`;
    }

    return (
      (typeof areacode === "string" ? areacode : null) ??
      (typeof prefix === "string" ? prefix : null) ??
      (typeof number === "string" ? number : null) ??
      "Phone available"
    );
  };

  return (
    <div className="p-6">
      {/* Main Property Info Section */}
      <div className="mb-6 flex items-start justify-between">
        {/* Left Side - Price and Address */}
        <div className="flex-1">
          <div className="mb-2 text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            {/* FIX: formatPrice() may be typed as unknown, so coerce to ReactNode */}
            {asReactNode(formatPrice(propertyPrice))}
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

      {/* Property Details Card with Agent Section Inside */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Property Details - Left Column (2/3 width on large screens) */}
          <div className="lg:col-span-2">
            {
              // Ensure PropertyDetailsList always returns ReactNode, even if props might be undefined/unknown
              <PropertyDetailsList
                propertyYearBuilt={propertyYearBuilt ?? undefined}
                propertyLotSize={propertyLotSize ?? undefined}
                propertyHomeType={propertyHomeType ?? undefined}
                propertyPropertyType={propertyPropertyType ?? undefined}
                propertyPricePerSquareFoot={
                  propertyPricePerSquareFoot ?? undefined
                }
                propertyGarageSpaces={propertyGarageSpaces ?? undefined}
                propertyParking={propertyParking ?? undefined}
                propertyZestimate={propertyZestimate ?? undefined}
                propertyRentZestimate={propertyRentZestimate ?? undefined}
              />
            }
          </div>

          {/* Agent Section - Right Column (1/3 width on large screens) */}
          {hasAgent ? (
            <div className="lg:col-span-1">
              <div className="mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-gray-600" />
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
                  <h4 className="text-lg font-medium text-gold">
                    {displayName}
                  </h4>

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
          ) : null}
        </div>
      </Card>
    </div>
  );
};
