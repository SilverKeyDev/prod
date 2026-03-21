import React from "react";

import { useLocalization } from "packages/contexts";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { Box } from "packages/ui/components/primitives";
import Title from "packages/ui/components/text/Title";

import { ListingAgentCard } from "./ListingAgentCard.native";
import { getAgentFromProperty } from "./propertyDetailsDisplayHelpers";
import { PropertyDetailsFields } from "./PropertyDetailsFields";

function hasAnyDetails(
  propertyYearBuilt: number | string | undefined,
  propertyLotSize: number | string | undefined,
  propertyHomeType: string | undefined,
  propertyPropertyType: string | undefined,
  propertyPricePerSquareFoot: number | string | undefined,
  propertyGarageSpaces: number | undefined,
  propertyParking: number | undefined,
  propertyZestimate: number | undefined,
  propertyRentZestimate: number | undefined,
): boolean {
  return !!(
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
    (typeof propertyZestimate === "number" && propertyZestimate > 0) ||
    (typeof propertyRentZestimate === "number" && propertyRentZestimate > 0)
  );
}

export const PropertyDetails: React.FC<PropertyComponentProps> = ({
  property,
}) => {
  const { t } = useLocalization();
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
  const propertyZestimate =
    "zestimate" in property
      ? (property.zestimate as number | undefined)
      : undefined;
  const propertyRentZestimate =
    "rentZestimate" in property
      ? (property.rentZestimate as number | undefined)
      : undefined;

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
    propertyRentZestimate,
  );

  if (!hasDetails && !agent.hasAgent) return null;

  return (
    <Box className="p-6">
      <Box className="border-border bg-background-surface rounded-lg border p-4">
        <Box className="flex-row flex-wrap gap-6">
          <Box className="min-w-0 flex-1">
            <Title
              as="h3"
              size="lg"
              className="text-text-secondary mb-4 font-semibold"
            >
              {t("property_details.heading", {
                defaultValue: "Property Details",
              })}
            </Title>
            <PropertyDetailsFields
              propertyYearBuilt={propertyYearBuilt}
              propertyLotSize={propertyLotSize}
              propertyHomeType={propertyHomeType}
              propertyPropertyType={propertyPropertyType}
              propertyPricePerSquareFoot={propertyPricePerSquareFoot}
              propertyGarageSpaces={propertyGarageSpaces}
              propertyParking={propertyParking}
              propertyZestimate={propertyZestimate}
              propertyRentZestimate={propertyRentZestimate}
            />
          </Box>
          {agent.hasAgent ? (
            <ListingAgentCard
              imageUrl={agent.imageUrl}
              displayName={agent.displayName}
              businessName={agent.businessName}
              phone={agent.phone}
            />
          ) : null}
        </Box>
      </Box>
    </Box>
  );
};
