import React from "react";

import Card from "@/components/layout/Card.web";
import type { PropertyComponentProps } from "@/components/modals/PropertyDetailsModal/types";
import { formatStructuredAddress } from "@/features/search/types/search/address";
import { formatPrice } from "@/features/search/types/search/propertyDetailsFormatters";

import { ListingAgentCard } from "./ListingAgentCard";
import {
  asReactNode,
  getAgentFromProperty,
  getPropertyBasicFields,
} from "./propertyDetailsDisplayHelpers";
import { PropertyDetailsList } from "./PropertyDetailsList";

function formatPropertyAddress(property: unknown): string {
  const addr = (property as { address?: unknown }).address;
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
}

export const PropertyBasicInfo: React.FC<PropertyComponentProps> = ({ property }) => {
  const fields = getPropertyBasicFields(property as unknown as Record<string, unknown>);
  const agent = getAgentFromProperty(property);
  const addressDisplay = formatPropertyAddress(property);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl">
            {asReactNode(formatPrice(fields.price))}
          </div>
          <div className="text-sm text-gray-700 sm:text-base md:text-lg">{addressDisplay}</div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {fields.bedrooms != null && Number(fields.bedrooms) > 0 && (
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">
                {fields.bedrooms}
              </div>
              <div className="text-xs text-gray-600 sm:text-sm">beds</div>
            </div>
          )}
          {fields.bathrooms != null && Number(fields.bathrooms) > 0 && (
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">
                {fields.bathrooms}
              </div>
              <div className="border-b border-dashed border-gray-400 text-xs text-gray-600 sm:text-sm">
                baths
              </div>
            </div>
          )}
          {fields.sqft != null && Number(fields.sqft) > 0 && (
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">
                {Math.round(Number(fields.sqft)).toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 sm:text-sm">sqft</div>
            </div>
          )}
        </div>
      </div>
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PropertyDetailsList
              propertyYearBuilt={fields.yearBuilt ?? undefined}
              propertyLotSize={fields.lotSize ?? undefined}
              propertyHomeType={fields.homeType ?? undefined}
              propertyPropertyType={fields.propertyType ?? undefined}
              propertyPricePerSquareFoot={fields.pricePerSquareFoot ?? undefined}
              propertyGarageSpaces={fields.garageSpaces ?? undefined}
              propertyParking={fields.parking ?? undefined}
              propertyZestimate={fields.zestimate ?? undefined}
              propertyRentZestimate={fields.rentZestimate ?? undefined}
            />
          </div>
          {agent.hasAgent && (
            <ListingAgentCard
              imageUrl={agent.imageUrl}
              displayName={agent.displayName}
              businessName={agent.businessName}
              phone={agent.phone}
            />
          )}
        </div>
      </Card>
    </div>
  );
};
