import React from "react";

import { ListingAgentCard } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/info/agent/ListingAgentCard";
import {
  asReactNode,
  getAgentFromProperty,
  getMlsListingId,
  getPropertyBasicFields,
  hasRenderableListingPrice,
} from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/info/helpers/propertyDetailsDisplayHelpers";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { Box } from "packages/ui/components/structure/primitives";
import Card from "packages/ui/components/surfaces/cards/Card";
import { formatStructuredAddress } from "packages/utils/core/format/property/addressFormatting";
import { formatPrice } from "packages/utils/core/format/property/propertyDetailsDisplayFormatters";

import { PropertyDetailsList } from "./PropertyDetailsList";

const ADDRESS_UNAVAILABLE = "Address not available";

function formatPropertyAddress(property: unknown): string {
  const addr = (property as { address?: unknown }).address;
  if (!addr) return ADDRESS_UNAVAILABLE;
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
    return ADDRESS_UNAVAILABLE;
  }
}

export const PropertyBasicInfo: React.FC<PropertyComponentProps & { isLoading?: boolean }> = ({
  property,
  isLoading = false,
}) => {
  const fields = getPropertyBasicFields(property as unknown as Record<string, unknown>);
  const agent = getAgentFromProperty(property);
  const mlsListingId = getMlsListingId(property);
  const addressDisplay = formatPropertyAddress(property);
  const showPriceSkeleton = isLoading && !hasRenderableListingPrice(fields.price);
  const showAddressSkeleton = isLoading && addressDisplay === ADDRESS_UNAVAILABLE;

  return (
    <Box className="p-6">
      <Box className="mb-6 flex items-start justify-between">
        <Box className="flex-1">
          <Box className="text-text-primary mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">
            {showPriceSkeleton ? (
              <Box
                className="bg-background-surface h-9 w-40 max-w-[90%] animate-pulse rounded-md"
                aria-hidden
              />
            ) : (
              asReactNode(formatPrice(fields.price))
            )}
          </Box>
          <Box className="text-text-secondary text-sm sm:text-base md:text-lg">
            {showAddressSkeleton ? (
              <Box className="space-y-2" aria-hidden>
                <Box className="bg-background-surface h-4 w-64 max-w-[95%] animate-pulse rounded" />
                <Box className="bg-background-surface h-4 w-48 max-w-[80%] animate-pulse rounded" />
              </Box>
            ) : (
              addressDisplay
            )}
          </Box>
        </Box>
        <Box className="flex items-center gap-2 sm:gap-4">
          {fields.bedrooms != null && Number(fields.bedrooms) > 0 && (
            <Box className="text-center">
              <Box className="text-text-primary text-xl font-bold sm:text-2xl md:text-3xl">
                {fields.bedrooms}
              </Box>
              <Box className="text-text-secondary text-xs sm:text-sm">Beds</Box>
            </Box>
          )}
          {fields.bathrooms != null && Number(fields.bathrooms) > 0 && (
            <Box className="text-center">
              <Box className="text-text-primary text-xl font-bold sm:text-2xl md:text-3xl">
                {fields.bathrooms}
              </Box>
              <Box className="border-border text-text-secondary border-b border-dashed text-xs sm:text-sm">
                Baths
              </Box>
            </Box>
          )}
          {fields.sqft != null && Number(fields.sqft) > 0 && (
            <Box className="text-center">
              <Box className="text-text-primary text-xl font-bold sm:text-2xl md:text-3xl">
                {Math.round(Number(fields.sqft)).toLocaleString()}
              </Box>
              <Box className="text-text-secondary text-xs sm:text-sm">Sq ft</Box>
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
              propertyPricePerSquareFoot={fields.pricePerSquareFoot ?? undefined}
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
              email={agent.email}
              mlsListingId={mlsListingId}
            />
          )}
        </Box>
      </Card>
    </Box>
  );
};
