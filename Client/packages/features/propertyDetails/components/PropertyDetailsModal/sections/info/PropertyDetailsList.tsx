import { useLocalization } from "packages/contexts";

import { Title } from "@/components/ui";
import { formatPropertyType } from "@/features/search/types/search/propertyDetailsFormatters";

export interface PropertyDetailsListProps {
  propertyYearBuilt?: number | string;
  propertyLotSize?: number | string;
  propertyHomeType?: string;
  propertyPropertyType?: string;
  propertyPricePerSquareFoot?: number | string;
  propertyGarageSpaces?: number;
  propertyParking?: number;
  propertyZestimate?: number;
  propertyRentZestimate?: number;
}

export const PropertyDetailsList = ({
  propertyYearBuilt,
  propertyLotSize,
  propertyHomeType,
  propertyPropertyType,
  propertyPricePerSquareFoot,
  propertyGarageSpaces,
  propertyParking,
  propertyZestimate,
  propertyRentZestimate,
}: PropertyDetailsListProps): JSX.Element => {
  const { t } = useLocalization();
  return (
    <div>
      <Title as="h3" size="lg" className="text-brown mb-4 font-semibold">
        {t("property_details_list.heading")}
      </Title>
      <div className="space-y-3">
        {propertyYearBuilt && Number(propertyYearBuilt) > 0 ? (
          <div className="flex justify-between">
            {t("property_details_list.year_built")}
            {String(propertyYearBuilt)}
          </div>
        ) : null}
        {propertyLotSize &&
        ((typeof propertyLotSize === "number" && propertyLotSize > 0) ||
          (typeof propertyLotSize === "string" &&
            propertyLotSize !== "0" &&
            propertyLotSize.trim() !== "")) ? (
          <div className="flex justify-between">
            {t("property_details_list.lot_size")}
            {String(propertyLotSize)}
          </div>
        ) : null}
        {(propertyHomeType && propertyHomeType !== "" && propertyHomeType !== "0") ||
        (propertyPropertyType && propertyPropertyType !== "" && propertyPropertyType !== "0") ? (
          <div className="flex justify-between">
            {t("property_details_list.property_type")}
            {formatPropertyType(
              (propertyHomeType as string) ?? (propertyPropertyType as string) ?? ""
            )}
          </div>
        ) : null}
        {propertyPricePerSquareFoot &&
        ((typeof propertyPricePerSquareFoot === "number" && propertyPricePerSquareFoot > 0) ||
          (typeof propertyPricePerSquareFoot === "string" &&
            propertyPricePerSquareFoot !== "0" &&
            propertyPricePerSquareFoot.trim() !== "")) ? (
          <div className="flex justify-between">
            {t("property_details_list.price_per_sqft")}
            {(() => {
              if (typeof propertyPricePerSquareFoot === "string") return propertyPricePerSquareFoot;
              if (typeof propertyPricePerSquareFoot === "number")
                return String(propertyPricePerSquareFoot);
              return "";
            })()}
          </div>
        ) : null}
        {((typeof propertyGarageSpaces === "number" && propertyGarageSpaces > 0) ||
          (typeof propertyParking === "number" && propertyParking > 0)) && (
          <div className="flex justify-between">
            {t("property_details_list.parking")}
            {typeof propertyGarageSpaces === "number" && propertyGarageSpaces > 0
              ? t("property_details_list.car_garage", {
                  count: propertyGarageSpaces,
                })
              : typeof propertyParking === "number" && propertyParking > 0
                ? t("property_details_list.spaces", { count: propertyParking })
                : t("house.na")}
          </div>
        )}
        {typeof propertyZestimate === "number" && propertyZestimate > 0 && (
          <div className="flex justify-between">
            {t("property_details_list.estimate")}
            {propertyZestimate.toLocaleString()}
          </div>
        )}
        {typeof propertyRentZestimate === "number" && propertyRentZestimate > 0 && (
          <div className="flex justify-between">
            {t("property_details_list.rent_estimate")}
            {propertyRentZestimate.toLocaleString()}
            {t("property_details_list.per_month")}
          </div>
        )}
      </div>
    </div>
  );
};
