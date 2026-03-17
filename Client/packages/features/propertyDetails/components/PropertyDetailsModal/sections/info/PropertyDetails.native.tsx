import React from "react";

import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { Box, Text } from "packages/ui/components/primitives";

import { formatPropertyType } from "@/features/search/types/search/propertyFormatters";

import { ListingAgentCard } from "./ListingAgentCard.native";
import { getAgentFromProperty } from "./propertyDetailsDisplayHelpers";

function hasAnyDetails(
  propertyYearBuilt: number | string | undefined,
  propertyLotSize: number | string | undefined,
  propertyHomeType: string | undefined,
  propertyPropertyType: string | undefined,
  propertyPricePerSquareFoot: number | string | undefined,
  propertyGarageSpaces: number | undefined,
  propertyParking: number | undefined,
  propertyZestimate: number | undefined,
  propertyRentZestimate: number | undefined
): boolean {
  return !!(
    (propertyYearBuilt && Number(propertyYearBuilt) > 0) ||
    (propertyLotSize &&
      ((typeof propertyLotSize === "number" && propertyLotSize > 0) ||
        (typeof propertyLotSize === "string" &&
          propertyLotSize !== "0" &&
          propertyLotSize.trim() !== ""))) ||
    (propertyHomeType && propertyHomeType !== "" && propertyHomeType !== "0") ||
    (propertyPropertyType && propertyPropertyType !== "" && propertyPropertyType !== "0") ||
    (propertyPricePerSquareFoot &&
      ((typeof propertyPricePerSquareFoot === "number" && propertyPricePerSquareFoot > 0) ||
        (typeof propertyPricePerSquareFoot === "string" &&
          propertyPricePerSquareFoot !== "0" &&
          propertyPricePerSquareFoot.trim() !== ""))) ||
    (typeof propertyGarageSpaces === "number" && propertyGarageSpaces > 0) ||
    (typeof propertyParking === "number" && propertyParking > 0) ||
    (typeof propertyZestimate === "number" && propertyZestimate > 0) ||
    (typeof propertyRentZestimate === "number" && propertyRentZestimate > 0)
  );
}

export const PropertyDetails: React.FC<PropertyComponentProps> = ({ property }) => {
  const propertyYearBuilt =
    "yearBuilt" in property ? (property.yearBuilt as number | string | undefined) : undefined;
  const propertyLotSize =
    "lotSize" in property ? (property.lotSize as number | string | undefined) : undefined;
  const propertyHomeType =
    "homeType" in property ? (property.homeType as string | undefined) : undefined;
  const propertyPropertyType =
    "propertyType" in property ? (property.propertyType as string | undefined) : undefined;
  const propertyPricePerSquareFoot =
    "pricePerSquareFoot" in property
      ? (property.pricePerSquareFoot as number | string | undefined)
      : undefined;
  const propertyGarageSpaces =
    "garageSpaces" in property ? (property.garageSpaces as number | undefined) : undefined;
  const propertyParking =
    "parking" in property ? (property.parking as number | undefined) : undefined;
  const propertyZestimate =
    "zestimate" in property ? (property.zestimate as number | undefined) : undefined;
  const propertyRentZestimate =
    "rentZestimate" in property ? (property.rentZestimate as number | undefined) : undefined;

  const agent = getAgentFromProperty(property);
  const hasDetails = hasAnyDetails(
    propertyYearBuilt,
    propertyLotSize,
    propertyHomeType,
    propertyPropertyType,
    propertyPricePerSquareFoot,
    propertyGarageSpaces,
    propertyParking,
    propertyZestimate,
    propertyRentZestimate
  );

  if (!hasDetails && !agent.hasAgent) return null;

  const hasLotSize =
    propertyLotSize &&
    ((typeof propertyLotSize === "number" && propertyLotSize > 0) ||
      (typeof propertyLotSize === "string" &&
        propertyLotSize !== "0" &&
        propertyLotSize.trim() !== ""));
  const hasPropertyType =
    (propertyHomeType && propertyHomeType !== "" && propertyHomeType !== "0") ||
    (propertyPropertyType && propertyPropertyType !== "" && propertyPropertyType !== "0");
  const hasPricePerSqft =
    propertyPricePerSquareFoot &&
    ((typeof propertyPricePerSquareFoot === "number" && propertyPricePerSquareFoot > 0) ||
      (typeof propertyPricePerSquareFoot === "string" &&
        propertyPricePerSquareFoot !== "0" &&
        propertyPricePerSquareFoot.trim() !== ""));
  const hasParking =
    (typeof propertyGarageSpaces === "number" && propertyGarageSpaces > 0) ||
    (typeof propertyParking === "number" && propertyParking > 0);

  return (
    <Box className="p-6">
      <Box className="border-border bg-background-surface rounded-lg border p-4">
        <Box className="flex-row flex-wrap gap-6">
          <Box className="min-w-0 flex-1">
            <Text className="text-text-secondary mb-4 text-lg font-semibold">Property Details</Text>
            <Box className="mt-2 gap-3">
              {propertyYearBuilt && Number(propertyYearBuilt) > 0 && (
                <Box className="flex-row justify-between">
                  <Text className="text-text-secondary">Year Built:</Text>
                  <Text className="text-text-primary">{String(propertyYearBuilt)}</Text>
                </Box>
              )}
              {hasLotSize && (
                <Box className="flex-row justify-between">
                  <Text className="text-text-secondary">Lot Size:</Text>
                  <Text className="text-text-primary">{String(propertyLotSize)}</Text>
                </Box>
              )}
              {hasPropertyType && (
                <Box className="flex-row justify-between">
                  <Text className="text-text-secondary">Property Type:</Text>
                  <Text className="text-text-primary">
                    {formatPropertyType(
                      (propertyHomeType as string) ?? (propertyPropertyType as string) ?? ""
                    )}
                  </Text>
                </Box>
              )}
              {hasPricePerSqft && (
                <Box className="flex-row justify-between">
                  <Text className="text-text-secondary">Price per Sq Ft: $</Text>
                  <Text className="text-text-primary">
                    {typeof propertyPricePerSquareFoot === "string"
                      ? propertyPricePerSquareFoot
                      : typeof propertyPricePerSquareFoot === "number"
                        ? String(propertyPricePerSquareFoot)
                        : ""}
                  </Text>
                </Box>
              )}
              {hasParking && (
                <Box className="flex-row justify-between">
                  <Text className="text-text-secondary">Parking:</Text>
                  <Text className="text-text-primary">
                    {typeof propertyGarageSpaces === "number" && propertyGarageSpaces > 0
                      ? `${propertyGarageSpaces}-car garage`
                      : typeof propertyParking === "number" && propertyParking > 0
                        ? `${propertyParking} spaces`
                        : "N/A"}
                  </Text>
                </Box>
              )}
              {typeof propertyZestimate === "number" && propertyZestimate > 0 && (
                <Box className="flex-row justify-between">
                  <Text className="text-text-secondary">Estimate:</Text>
                  <Text className="text-text-primary">${propertyZestimate.toLocaleString()}</Text>
                </Box>
              )}
              {typeof propertyRentZestimate === "number" && propertyRentZestimate > 0 && (
                <Box className="flex-row justify-between">
                  <Text className="text-text-secondary">Rent Estimate:</Text>
                  <Text className="text-text-primary">
                    ${propertyRentZestimate.toLocaleString()}/month
                  </Text>
                </Box>
              )}
            </Box>
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
      </Box>
    </Box>
  );
};
