import React from "react";

import { Title } from "packages/ui/components/index.web";

import Card from "@/components/layout/Card.web";
import type { PropertyComponentProps } from "@/components/modals/PropertyDetailsModal/types";

import { ListingAgentCard } from "./ListingAgentCard";
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

  return (
    <div className="p-6">
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Title as="h3" size="lg" className="text-brown mb-4 font-semibold">
              Property Details
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
