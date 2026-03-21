import React from "react";

import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import { formatStructuredAddress } from "packages/utils/format/property/addressFormatting";
import { formatPrice } from "packages/utils/format/property/propertyDetailsDisplayFormatters";

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
      },
    );
  }
  try {
    return JSON.stringify(addr);
  } catch {
    return "Address not available";
  }
}

export const PropertyBasicInfo: React.FC<PropertyComponentProps> = ({
  property,
}) => {
  const fields = getPropertyBasicFields(
    property as unknown as Record<string, unknown>,
  );
  const agent = getAgentFromProperty(property);
  const addressDisplay = formatPropertyAddress(property);

  return (
    <Box className="p-6">
      <Box className="mb-6 flex items-start justify-between">
        <Box className="flex-1">
          <Box className="text-text-primary mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">
            {asReactNode(formatPrice(fields.price))}
          </Box>
          <Box className="text-text-secondary text-sm sm:text-base md:text-lg">
            {addressDisplay}
          </Box>
        </Box>
        <Box className="flex items-center gap-2 sm:gap-4">
          {fields.bedrooms != null && Number(fields.bedrooms) > 0 && (
            <Box className="text-center">
              <Box className="text-text-primary text-xl font-bold sm:text-2xl md:text-3xl">
                {fields.bedrooms}
              </Box>
              <Box className="text-text-secondary text-xs sm:text-sm">beds</Box>
            </Box>
          )}
          {fields.bathrooms != null && Number(fields.bathrooms) > 0 && (
            <Box className="text-center">
              <Box className="text-text-primary text-xl font-bold sm:text-2xl md:text-3xl">
                {fields.bathrooms}
              </Box>
              <Box className="border-border text-text-secondary border-b border-dashed text-xs sm:text-sm">
                baths
              </Box>
            </Box>
          )}
          {fields.sqft != null && Number(fields.sqft) > 0 && (
            <Box className="text-center">
              <Box className="text-text-primary text-xl font-bold sm:text-2xl md:text-3xl">
                {Math.round(Number(fields.sqft)).toLocaleString()}
              </Box>
              <Box className="text-text-secondary text-xs sm:text-sm">sqft</Box>
            </Box>
          )}
        </Box>
      </Box>
      <Card border="light" className="p-4">
        <Box className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Box className="lg:col-span-2">
            <PropertyDetailsList
              propertyYearBuilt={fields.yearBuilt ?? undefined}
              propertyLotSize={fields.lotSize ?? undefined}
              propertyHomeType={fields.homeType ?? undefined}
              propertyPropertyType={fields.propertyType ?? undefined}
              propertyPricePerSquareFoot={
                fields.pricePerSquareFoot ?? undefined
              }
              propertyGarageSpaces={fields.garageSpaces ?? undefined}
              propertyParking={fields.parking ?? undefined}
              propertyZestimate={fields.zestimate ?? undefined}
              propertyRentZestimate={fields.rentZestimate ?? undefined}
            />
          </Box>
          {agent.hasAgent && (
            <ListingAgentCard
              imageUrl={agent.imageUrl}
              displayName={agent.displayName}
              businessName={agent.businessName}
              phone={agent.phone}
            />
          )}
        </Box>
      </Card>
    </Box>
  );
};
