import React from "react";

import { Box } from "packages/ui/components/primitives";

import { formatPropertyType } from "@/features/search/types/search/propertyDetailsFormatters";
type PropertyDetailsFieldsProps = {
  propertyYearBuilt?: number | string;
  propertyLotSize?: number | string;
  propertyHomeType?: string;
  propertyPropertyType?: string;
  propertyPricePerSquareFoot?: number | string;
  propertyGarageSpaces?: number;
  propertyParking?: number;
  propertyZestimate?: number;
  propertyRentZestimate?: number;
};

export function PropertyDetailsFields({
  propertyYearBuilt,
  propertyLotSize,
  propertyHomeType,
  propertyPropertyType,
  propertyPricePerSquareFoot,
  propertyGarageSpaces,
  propertyParking,
  propertyZestimate,
  propertyRentZestimate,
}: PropertyDetailsFieldsProps) {
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
    <Box className="mt-2 space-y-3">
      {propertyYearBuilt && Number(propertyYearBuilt) > 0 && (
        <Box className="flex justify-between">
          Year Built:
          {String(propertyYearBuilt)}
        </Box>
      )}
      {hasLotSize && (
        <Box className="flex justify-between">
          Lot Size:
          {String(propertyLotSize)}
        </Box>
      )}
      {hasPropertyType && (
        <Box className="flex justify-between">
          Property Type:
          {formatPropertyType(
            (propertyHomeType as string) ?? (propertyPropertyType as string) ?? ""
          )}
        </Box>
      )}
      {hasPricePerSqft && (
        <Box className="flex justify-between">
          Price per Sq Ft: $
          {typeof propertyPricePerSquareFoot === "string"
            ? propertyPricePerSquareFoot
            : typeof propertyPricePerSquareFoot === "number"
              ? String(propertyPricePerSquareFoot)
              : ""}
        </Box>
      )}
      {hasParking && (
        <Box className="flex justify-between">
          Parking:
          {typeof propertyGarageSpaces === "number" && propertyGarageSpaces > 0
            ? `${propertyGarageSpaces}-car garage`
            : typeof propertyParking === "number" && propertyParking > 0
              ? `${propertyParking} spaces`
              : "N/A"}
        </Box>
      )}
      {typeof propertyZestimate === "number" && propertyZestimate > 0 && (
        <Box className="flex justify-between">Estimate: ${propertyZestimate.toLocaleString()}</Box>
      )}
      {typeof propertyRentZestimate === "number" && propertyRentZestimate > 0 && (
        <Box className="flex justify-between">
          Rent Estimate: ${propertyRentZestimate.toLocaleString()}
          /month
        </Box>
      )}
    </Box>
  );
}
