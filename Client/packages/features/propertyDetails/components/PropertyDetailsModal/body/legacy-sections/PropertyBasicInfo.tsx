import React from "react";

import { useLocalization } from "packages/contexts";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import Title from "packages/ui/components/text/Title";
import {
  formatLotSize,
  formatStructuredAddress,
} from "packages/utils/format/property/addressFormatting";
import {
  formatPrice,
  formatPropertyType,
} from "packages/utils/format/property/propertyDetailsDisplayFormatters";

export const PropertyBasicInfo: React.FC<PropertyComponentProps> = ({
  property,
}) => {
  const { t } = useLocalization();
  // Type-safe property access with proper type guards
  const propertyPrice = property.price;
  const propertySqft = property.sqft;
  const propertyBedrooms = property.bedrooms;
  const propertyBathrooms = property.bathrooms;
  const propertyYearBuilt =
    "yearBuilt" in property ? property.yearBuilt : undefined;
  const propertyLotSize = "lotSize" in property ? property.lotSize : undefined;
  const propertyHomeType =
    "homeType" in property ? property.homeType : undefined;
  const propertyPropertyType =
    "propertyType" in property ? property.propertyType : undefined;
  const propertyPricePerSquareFoot =
    "pricePerSquareFoot" in property ? property.pricePerSquareFoot : undefined;
  const propertyGarageSpaces =
    "garageSpaces" in property ? property.garageSpaces : undefined;
  const propertyParking = "parking" in property ? property.parking : undefined;
  const propertyDaysOnZillow =
    "daysOnZillow" in property ? property.daysOnZillow : undefined;
  const propertyZestimate =
    "zestimate" in property ? property.zestimate : undefined;
  const propertyRentZestimate =
    "rentZestimate" in property ? property.rentZestimate : undefined;

  return (
    <Box className="p-6">
      {/* Main Property Info Section - Zillow Style Layout */}
      <Box className="mb-6 flex items-start justify-between">
        {/* Left Side - Price and Address */}
        <Box className="flex-1">
          <Box className="text-text-primary mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">
            {formatPrice(propertyPrice)}
          </Box>
          <Box className="text-text-secondary text-sm sm:text-base md:text-lg">
            {(() => {
              const addr = (property as unknown as { address?: unknown })
                .address;
              if (!addr) return t("property_details.address_not_available");
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
                return t("property_details.address_not_available");
              }
            })()}
          </Box>
        </Box>

        {/* Right Side - Property Specs */}
        <Box className="flex items-center gap-2 sm:gap-4">
          {propertyBedrooms && Number(propertyBedrooms) > 0 && (
            <Box className="text-center">
              <Box className="text-text-primary text-xl font-bold sm:text-2xl md:text-3xl">
                {propertyBedrooms}
              </Box>
              <Box className="text-text-secondary text-xs sm:text-sm">
                {t("property_details.beds")}
              </Box>
            </Box>
          )}
          {propertyBathrooms && Number(propertyBathrooms) > 0 && (
            <Box className="text-center">
              <Box className="text-text-primary text-xl font-bold sm:text-2xl md:text-3xl">
                {propertyBathrooms}
              </Box>
              <Box className="border-border text-text-secondary border-b border-dashed text-xs sm:text-sm">
                {t("property_details.baths")}
              </Box>
            </Box>
          )}
          {propertySqft && Number(propertySqft) > 0 && (
            <Box className="text-center">
              <Box className="text-text-primary text-xl font-bold sm:text-2xl md:text-3xl">
                {Math.round(Number(propertySqft)).toLocaleString()}
              </Box>
              <Box className="text-text-secondary text-xs sm:text-sm">
                {t("property_details.sqft")}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      <Card border="light" className="p-4">
        <Title
          as="h3"
          size="lg"
          className="text-text-secondary mb-4 font-semibold"
        >
          {t("property_details.heading")}
        </Title>
        <Box className="space-y-3">
          {propertyYearBuilt && Number(propertyYearBuilt) > 0 ? (
            <Box className="flex justify-between">
              {t("property_details.year_built")}
              {String(propertyYearBuilt)}
            </Box>
          ) : null}
          {propertyLotSize &&
          ((typeof propertyLotSize === "number" && propertyLotSize > 0) ||
            (typeof propertyLotSize === "string" &&
              propertyLotSize !== "0" &&
              propertyLotSize.trim() !== "")) ? (
            <Box className="flex justify-between">
              {t("property_details.lot_size")}
              {formatLotSize(
                typeof propertyLotSize === "number"
                  ? propertyLotSize
                  : String(propertyLotSize),
              )}
            </Box>
          ) : null}
          {(propertyHomeType &&
            propertyHomeType !== "" &&
            propertyHomeType !== "0") ||
          (propertyPropertyType &&
            propertyPropertyType !== "" &&
            propertyPropertyType !== "0") ? (
            <Box className="flex justify-between">
              {t("property_details.property_type")}
              {formatPropertyType(
                (propertyHomeType as string) ??
                  (propertyPropertyType as string) ??
                  "",
              )}
            </Box>
          ) : null}
          {propertyPricePerSquareFoot &&
          ((typeof propertyPricePerSquareFoot === "number" &&
            propertyPricePerSquareFoot > 0) ||
            (typeof propertyPricePerSquareFoot === "string" &&
              propertyPricePerSquareFoot !== "0" &&
              propertyPricePerSquareFoot.trim() !== "")) ? (
            <Box className="flex justify-between">
              {t("property_details.price_per_sqft")}
              {(() => {
                if (typeof propertyPricePerSquareFoot === "string")
                  return propertyPricePerSquareFoot;
                if (typeof propertyPricePerSquareFoot === "number")
                  return String(propertyPricePerSquareFoot);
                return "";
              })()}
            </Box>
          ) : null}
          {((typeof propertyGarageSpaces === "number" &&
            propertyGarageSpaces > 0) ||
            (typeof propertyParking === "number" && propertyParking > 0)) && (
            <Box className="flex justify-between">
              {t("property_details.parking")}
              {typeof propertyGarageSpaces === "number" &&
              propertyGarageSpaces > 0
                ? t("property_details.car_garage", {
                    count: propertyGarageSpaces,
                  })
                : typeof propertyParking === "number" && propertyParking > 0
                  ? t("property_details.spaces", { count: propertyParking })
                  : t("house.na")}
            </Box>
          )}
          {propertyDaysOnZillow &&
          ((typeof propertyDaysOnZillow === "number" &&
            propertyDaysOnZillow > 0) ||
            (typeof propertyDaysOnZillow === "string" &&
              propertyDaysOnZillow !== "0" &&
              propertyDaysOnZillow.trim() !== "")) ? (
            <Box className="flex justify-between">
              {t("property_details.days_on_market")}
              {String(propertyDaysOnZillow)} {t("property_details.days")}
            </Box>
          ) : null}
          {typeof propertyZestimate === "number" && propertyZestimate > 0 && (
            <Box className="flex justify-between">
              {t("property_details.estimate")}
              {propertyZestimate.toLocaleString()}
            </Box>
          )}
          {typeof propertyRentZestimate === "number" &&
            propertyRentZestimate > 0 && (
              <Box className="flex justify-between">
                {t("property_details.rent_estimate")}
                {propertyRentZestimate.toLocaleString()}
                {t("property_details.per_month")}
              </Box>
            )}
        </Box>
      </Card>
    </Box>
  );
};
