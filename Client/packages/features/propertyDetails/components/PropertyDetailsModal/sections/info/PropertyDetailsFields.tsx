import React from "react";

import { useLocalization } from "packages/contexts";
import { DetailFactTile } from "packages/features/propertyDetails/components/visualizations";
import { Box } from "packages/ui/components/primitives";
import { formatPropertyType } from "packages/utils/format/property";

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
  const { t } = useLocalization();

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

  const parkingValue =
    typeof propertyGarageSpaces === "number" && propertyGarageSpaces > 0
      ? t("property_details.car_garage", {
          count: propertyGarageSpaces,
          defaultValue: "{{count}}-car garage",
        })
      : typeof propertyParking === "number" && propertyParking > 0
        ? t("property_details.spaces", {
            count: propertyParking,
            defaultValue: "{{count}} spaces",
          })
        : "";

  const pricePerSqftDisplay =
    typeof propertyPricePerSquareFoot === "string"
      ? propertyPricePerSquareFoot
      : typeof propertyPricePerSquareFoot === "number"
        ? String(propertyPricePerSquareFoot)
        : "";

  const tiles: React.ReactNode[] = [];

  if (propertyYearBuilt && Number(propertyYearBuilt) > 0) {
    tiles.push(
      <DetailFactTile
        key="year"
        iconName="calendar"
        label={t("property_details.fact_year_built", {
          defaultValue: "Year built",
        })}
        value={String(propertyYearBuilt)}
        emphasized
      />
    );
  }

  if (hasLotSize) {
    tiles.push(
      <DetailFactTile
        key="lot"
        iconName="map-pin"
        label={t("property_details.fact_lot_size", {
          defaultValue: "Lot size",
        })}
        value={String(propertyLotSize)}
      />
    );
  }

  if (hasPropertyType) {
    tiles.push(
      <DetailFactTile
        key="type"
        iconName="building-2"
        label={t("property_details.fact_property_type", {
          defaultValue: "Property type",
        })}
        value={formatPropertyType(
          (propertyHomeType as string) ?? (propertyPropertyType as string) ?? ""
        )}
      />
    );
  }

  if (hasPricePerSqft) {
    tiles.push(
      <DetailFactTile
        key="psf"
        iconName="dollar-sign"
        label={t("property_details.fact_price_per_sqft", {
          defaultValue: "Price / sq ft",
        })}
        value={`$${pricePerSqftDisplay}`}
        emphasized
      />
    );
  }

  if (hasParking && parkingValue) {
    tiles.push(
      <DetailFactTile
        key="parking"
        iconName="square"
        label={t("property_details.fact_parking", { defaultValue: "Parking" })}
        value={parkingValue}
      />
    );
  }

  if (typeof propertyZestimate === "number" && propertyZestimate > 0) {
    tiles.push(
      <DetailFactTile
        key="zestimate"
        iconName="home"
        label={t("property_details.fact_zestimate", {
          defaultValue: "Zestimate",
        })}
        value={`$${propertyZestimate.toLocaleString()}`}
      />
    );
  }

  if (typeof propertyRentZestimate === "number" && propertyRentZestimate > 0) {
    tiles.push(
      <DetailFactTile
        key="rent"
        iconName="key"
        label={t("property_details.fact_rent_estimate", {
          defaultValue: "Rent estimate",
        })}
        value={`$${propertyRentZestimate.toLocaleString()}${t("property_details.per_month", { defaultValue: "/month" })}`}
      />
    );
  }

  if (tiles.length === 0) return null;

  return <Box className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">{tiles}</Box>;
}
