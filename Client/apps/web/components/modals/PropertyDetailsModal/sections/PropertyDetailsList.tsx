import { formatPropertyType } from "../utils";

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
  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-brown">
        Property Details
      </h3>
      <div className="space-y-3">
        {propertyYearBuilt && Number(propertyYearBuilt) > 0 ? (
          <div className="flex justify-between">
            Year Built:
            {String(propertyYearBuilt)}
          </div>
        ) : null}
        {propertyLotSize &&
        ((typeof propertyLotSize === "number" && propertyLotSize > 0) ||
          (typeof propertyLotSize === "string" &&
            propertyLotSize !== "0" &&
            propertyLotSize.trim() !== "")) ? (
          <div className="flex justify-between">
            Lot Size:
            {String(propertyLotSize)}
          </div>
        ) : null}
        {(propertyHomeType &&
          propertyHomeType !== "" &&
          propertyHomeType !== "0") ||
        (propertyPropertyType &&
          propertyPropertyType !== "" &&
          propertyPropertyType !== "0") ? (
          <div className="flex justify-between">
            Property Type:
            {formatPropertyType(
              (propertyHomeType as string) ??
                (propertyPropertyType as string) ??
                ""
            )}
          </div>
        ) : null}
        {propertyPricePerSquareFoot &&
        ((typeof propertyPricePerSquareFoot === "number" &&
          propertyPricePerSquareFoot > 0) ||
          (typeof propertyPricePerSquareFoot === "string" &&
            propertyPricePerSquareFoot !== "0" &&
            propertyPricePerSquareFoot.trim() !== "")) ? (
          <div className="flex justify-between">
            Price per Sq Ft: $
            {(() => {
              if (typeof propertyPricePerSquareFoot === "string")
                return propertyPricePerSquareFoot;
              if (typeof propertyPricePerSquareFoot === "number")
                return String(propertyPricePerSquareFoot);
              return "";
            })()}
          </div>
        ) : null}
        {((typeof propertyGarageSpaces === "number" &&
          propertyGarageSpaces > 0) ||
          (typeof propertyParking === "number" && propertyParking > 0)) && (
          <div className="flex justify-between">
            Parking:
            {typeof propertyGarageSpaces === "number" &&
            propertyGarageSpaces > 0
              ? `${propertyGarageSpaces}-car garage`
              : typeof propertyParking === "number" && propertyParking > 0
                ? `${propertyParking} spaces`
                : "N/A"}
          </div>
        )}
        {typeof propertyZestimate === "number" && propertyZestimate > 0 && (
          <div className="flex justify-between">
            Estimate: ${propertyZestimate.toLocaleString()}
          </div>
        )}
        {typeof propertyRentZestimate === "number" &&
          propertyRentZestimate > 0 && (
            <div className="flex justify-between">
              Rent Estimate: ${propertyRentZestimate.toLocaleString()}
              /month
            </div>
          )}
      </div>
    </div>
  );
};
