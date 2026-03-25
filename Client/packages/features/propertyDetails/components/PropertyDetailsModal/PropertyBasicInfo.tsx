import React from "react";

import { Box } from "packages/ui/components/primitives";
import { formatStructuredAddress } from "packages/utils/format/property/addressFormatting";

import Card from "@/components/layout/Card.web";
import { BodyText, Title } from "@/components/ui";

import type { PropertyComponentProps } from "./types";
import { formatPrice, formatPropertyType } from "./utils";

export const PropertyBasicInfo: React.FC<PropertyComponentProps> = ({ property }) => {
  const propertyPrice = property.price;
  const propertySqft = property.sqft;
  const propertyBedrooms = property.bedrooms;
  const propertyBathrooms = property.bathrooms;
  const propertyYearBuilt = "yearBuilt" in property ? property.yearBuilt : undefined;
  const propertyLotSize = "lotSize" in property ? property.lotSize : undefined;
  const propertyHomeType = "homeType" in property ? property.homeType : undefined;
  const propertyPropertyType = "propertyType" in property ? property.propertyType : undefined;
  const propertyPricePerSquareFoot =
    "pricePerSquareFoot" in property ? property.pricePerSquareFoot : undefined;
  const propertyGarageSpaces = "garageSpaces" in property ? property.garageSpaces : undefined;
  const propertyParking = "parking" in property ? property.parking : undefined;
  const propertyDaysOnZillow = "daysOnZillow" in property ? property.daysOnZillow : undefined;
  const propertyZestimate = "zestimate" in property ? property.zestimate : undefined;
  const propertyRentZestimate = "rentZestimate" in property ? property.rentZestimate : undefined;

  return (
    <Box className="p-6">
      <Box className="mb-6 flex flex-row items-start justify-between">
        <Box className="flex-1">
          <Title as="h2" size="lg" className="mb-2 font-bold text-gray-900 sm:text-3xl md:text-4xl">
            {formatPrice(propertyPrice)}
          </Title>
          <BodyText as="p" size="sm" className="text-gray-700 sm:text-base md:text-lg">
            {(() => {
              const addr = (property as unknown as { address?: unknown }).address;
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
            })()}
          </BodyText>
        </Box>

        <Box className="flex flex-row items-center gap-2 sm:gap-4">
          {propertyBedrooms && Number(propertyBedrooms) > 0 && (
            <Box className="text-center">
              <Title
                as="h3"
                size="md"
                className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl"
              >
                {propertyBedrooms}
              </Title>
              <BodyText as="p" size="xs" className="text-gray-600 sm:text-sm">
                beds
              </BodyText>
            </Box>
          )}
          {propertyBathrooms && Number(propertyBathrooms) > 0 && (
            <Box className="text-center">
              <Title
                as="h3"
                size="md"
                className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl"
              >
                {propertyBathrooms}
              </Title>
              <BodyText
                as="p"
                size="xs"
                className="border-b border-dashed border-gray-400 text-gray-600 sm:text-sm"
              >
                baths
              </BodyText>
            </Box>
          )}
          {propertySqft && Number(propertySqft) > 0 && (
            <Box className="text-center">
              <Title
                as="h3"
                size="md"
                className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl"
              >
                {Math.round(Number(propertySqft)).toLocaleString()}
              </Title>
              <BodyText as="p" size="xs" className="text-gray-600 sm:text-sm">
                sqft
              </BodyText>
            </Box>
          )}
        </Box>
      </Box>

      <Card className="p-4">
        <Title as="h3" size="sm" className="text-brown mb-4 text-lg font-semibold">
          Property Details
        </Title>
        <Box className="flex flex-col gap-3">
          {propertyYearBuilt && Number(propertyYearBuilt) > 0 ? (
            <Box className="flex flex-row justify-between">
              <BodyText as="span" size="sm">
                Year Built:
              </BodyText>
              <BodyText as="span" size="sm">
                {String(propertyYearBuilt)}
              </BodyText>
            </Box>
          ) : null}
          {propertyLotSize &&
          ((typeof propertyLotSize === "number" && propertyLotSize > 0) ||
            (typeof propertyLotSize === "string" &&
              propertyLotSize !== "0" &&
              propertyLotSize.trim() !== "")) ? (
            <Box className="flex flex-row justify-between">
              <BodyText as="span" size="sm">
                Lot Size:
              </BodyText>
              <BodyText as="span" size="sm">
                {String(propertyLotSize)}
              </BodyText>
            </Box>
          ) : null}
          {(propertyHomeType && propertyHomeType !== "" && propertyHomeType !== "0") ||
          (propertyPropertyType && propertyPropertyType !== "" && propertyPropertyType !== "0") ? (
            <Box className="flex flex-row justify-between">
              <BodyText as="span" size="sm">
                Property Type:
              </BodyText>
              <BodyText as="span" size="sm">
                {formatPropertyType(
                  (propertyHomeType as string) ?? (propertyPropertyType as string) ?? ""
                )}
              </BodyText>
            </Box>
          ) : null}
          {propertyPricePerSquareFoot &&
          ((typeof propertyPricePerSquareFoot === "number" && propertyPricePerSquareFoot > 0) ||
            (typeof propertyPricePerSquareFoot === "string" &&
              propertyPricePerSquareFoot !== "0" &&
              propertyPricePerSquareFoot.trim() !== "")) ? (
            <Box className="flex flex-row justify-between">
              <BodyText as="span" size="sm">
                Price per Sq Ft:
              </BodyText>
              <BodyText as="span" size="sm">
                $
                {(() => {
                  if (typeof propertyPricePerSquareFoot === "string")
                    return propertyPricePerSquareFoot;
                  if (typeof propertyPricePerSquareFoot === "number")
                    return String(propertyPricePerSquareFoot);
                  return "";
                })()}
              </BodyText>
            </Box>
          ) : null}
          {((typeof propertyGarageSpaces === "number" && propertyGarageSpaces > 0) ||
            (typeof propertyParking === "number" && propertyParking > 0)) && (
            <Box className="flex flex-row justify-between">
              <BodyText as="span" size="sm">
                Parking:
              </BodyText>
              <BodyText as="span" size="sm">
                {typeof propertyGarageSpaces === "number" && propertyGarageSpaces > 0
                  ? `${propertyGarageSpaces}-car garage`
                  : typeof propertyParking === "number" && propertyParking > 0
                    ? `${propertyParking} spaces`
                    : "N/A"}
              </BodyText>
            </Box>
          )}
          {propertyDaysOnZillow &&
          ((typeof propertyDaysOnZillow === "number" && propertyDaysOnZillow > 0) ||
            (typeof propertyDaysOnZillow === "string" &&
              propertyDaysOnZillow !== "0" &&
              propertyDaysOnZillow.trim() !== "")) ? (
            <Box className="flex flex-row justify-between">
              <BodyText as="span" size="sm">
                Days on Market:
              </BodyText>
              <BodyText as="span" size="sm">
                {String(propertyDaysOnZillow)} days
              </BodyText>
            </Box>
          ) : null}
          {typeof propertyZestimate === "number" && propertyZestimate > 0 && (
            <Box className="flex flex-row justify-between">
              <BodyText as="span" size="sm">
                Estimate:
              </BodyText>
              <BodyText as="span" size="sm">
                ${propertyZestimate.toLocaleString()}
              </BodyText>
            </Box>
          )}
          {typeof propertyRentZestimate === "number" && propertyRentZestimate > 0 && (
            <Box className="flex flex-row justify-between">
              <BodyText as="span" size="sm">
                Rent Estimate:
              </BodyText>
              <BodyText as="span" size="sm">
                ${propertyRentZestimate.toLocaleString()}/month
              </BodyText>
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
};
