import React from "react";

import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { Box, Text } from "packages/ui/components/primitives";

import { formatStructuredAddress } from "@/features/search/types/search/address";
import { formatPrice } from "@/features/search/types/search/propertyDetailsFormatters";

function getDisplayAddress(addr: unknown): string {
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

export const PropertyInfo: React.FC<PropertyComponentProps> = ({ property }) => {
  const propertyPrice =
    "price" in property ? (property.price as number | string | undefined) : undefined;
  const propertySqft =
    "sqft" in property ? (property.sqft as number | string | undefined) : undefined;
  const propertyBedrooms =
    "bedrooms" in property ? (property.bedrooms as number | string | undefined) : undefined;
  const propertyBathrooms =
    "bathrooms" in property ? (property.bathrooms as number | string | undefined) : undefined;
  const addr = (property as unknown as { address?: unknown }).address;
  const displayAddress = getDisplayAddress(addr);

  return (
    <Box className="p-6">
      <Box className="mb-6 flex-row items-start justify-between">
        <Box className="min-w-0 flex-1">
          <Text className="mb-2 text-2xl font-bold text-gray-900">
            {formatPrice(propertyPrice)}
          </Text>
          <Text className="text-sm text-gray-700">{displayAddress}</Text>
        </Box>
        <Box className="flex-row items-center gap-2">
          {propertyBedrooms && Number(propertyBedrooms) > 0 && (
            <Box className="items-center">
              <Text className="text-xl font-bold text-gray-900">{String(propertyBedrooms)}</Text>
              <Text className="text-xs text-gray-600">beds</Text>
            </Box>
          )}
          {propertyBathrooms && Number(propertyBathrooms) > 0 && (
            <Box className="items-center">
              <Text className="text-xl font-bold text-gray-900">{String(propertyBathrooms)}</Text>
              <Text className="border-b border-dashed border-gray-400 text-xs text-gray-600">
                baths
              </Text>
            </Box>
          )}
          {propertySqft && Number(propertySqft) > 0 && (
            <Box className="items-center">
              <Text className="text-xl font-bold text-gray-900">
                {Math.round(Number(propertySqft)).toLocaleString()}
              </Text>
              <Text className="text-xs text-gray-600">sqft</Text>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};
