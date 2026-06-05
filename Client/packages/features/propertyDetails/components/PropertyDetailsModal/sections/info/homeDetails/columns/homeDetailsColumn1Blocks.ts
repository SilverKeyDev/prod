import type { PropertyBasicDisplayFields } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/info/helpers/propertyDetailsDisplayHelpers";
import { formatPropertyType } from "packages/utils/core/format/property";
import { formatLotSize } from "packages/utils/core/format/property/addressFormatting";

import { asStringList, asTrimmedString } from "./homeDetailsColumnHelpers";
import type { HomeDetailsBlock, HomeDetailsTranslate } from "./homeDetailsColumnTypes";

export function buildHomeDetailsColumn1Blocks(
  property: Record<string, unknown>,
  fields: PropertyBasicDisplayFields,
  t: HomeDetailsTranslate
): HomeDetailsBlock[] {
  const col1: HomeDetailsBlock[] = [];

  const homeTypeLine = formatPropertyType(
    (fields.homeType as string) ?? (fields.propertyType as string) ?? ""
  );
  if (homeTypeLine && homeTypeLine !== "N/A") {
    col1.push({
      id: "home-type",
      icon: "building-2",
      title: t("property_details.hd_home_type", { defaultValue: "Home Type" }),
      lines: [homeTypeLine],
    });
  }

  const tax = property.taxAnnualAmount;
  if (typeof tax === "number" && tax > 0) {
    col1.push({
      id: "taxes",
      icon: "receipt",
      title: t("property_details.hd_annual_taxes", {
        defaultValue: "Est. Annual Taxes",
      }),
      lines: [
        t("property_details.hd_tax_amount", {
          amount: tax.toLocaleString(),
          defaultValue: "${{amount}} (estimated)",
        }),
      ],
    });
  }

  if (fields.yearBuilt && Number(fields.yearBuilt) > 0) {
    col1.push({
      id: "year-built",
      icon: "calendar",
      title: t("property_details.hd_year_built", {
        defaultValue: "Year Built",
      }),
      lines: [String(fields.yearBuilt)],
    });
  }

  const lotLines: string[] = [];
  if (
    fields.lotSize &&
    ((typeof fields.lotSize === "number" && fields.lotSize > 0) ||
      (typeof fields.lotSize === "string" &&
        fields.lotSize !== "0" &&
        fields.lotSize.trim() !== ""))
  ) {
    lotLines.push(
      t("property_details.hd_lot_size_line", {
        size: formatLotSize(
          typeof fields.lotSize === "number" ? fields.lotSize : String(fields.lotSize)
        ),
        defaultValue: "{{size}} lot",
      })
    );
  }
  const subdivision =
    asTrimmedString(property.subdivisionName) ?? asTrimmedString(property.subdivision);
  if (subdivision) {
    lotLines.push(
      t("property_details.hd_subdivision_line", {
        name: subdivision,
        defaultValue: "{{name}}",
      })
    );
  }
  const parcel = asTrimmedString(property.parcelNumber);
  if (parcel) {
    lotLines.push(
      t("property_details.hd_parcel_line", {
        id: parcel,
        defaultValue: "Parcel #{{id}}",
      })
    );
  }
  if (lotLines.length > 0) {
    col1.push({
      id: "lot",
      icon: "map-pin",
      title: t("property_details.hd_lot_details", {
        defaultValue: "Lot Details",
      }),
      lines: lotLines,
    });
  }

  const designLines: string[] = [];
  const stories = asTrimmedString(property.stories) ?? asTrimmedString(property.floors);
  if (stories) designLines.push(`${stories} stories`);
  const arch = asTrimmedString(property.architecturalStyle);
  if (arch) designLines.push(arch);
  const styleVal = asTrimmedString(property.style);
  if (styleVal && !arch) designLines.push(styleVal);
  const structure = asTrimmedString(property.structureType);
  if (structure) designLines.push(structure);
  const roof = asTrimmedString(property.roofType) ?? asTrimmedString(property.roof);
  if (roof) designLines.push(`${roof} roof`);
  designLines.push(...asStringList(property.constructionMaterials, 6));
  if (designLines.length > 0) {
    col1.push({
      id: "home-design",
      icon: "grid-3x3",
      title: t("property_details.hd_home_design", {
        defaultValue: "Home Design",
      }),
      lines: designLines,
    });
  }

  const interiorLines: string[] = [];
  const sqftNum =
    fields.sqft != null && Number(fields.sqft) > 0
      ? Math.round(Number(fields.sqft))
      : typeof property.livingAreaValue === "number" && property.livingAreaValue > 0
        ? Math.round(property.livingAreaValue)
        : undefined;
  if (sqftNum !== undefined) {
    interiorLines.push(
      t("property_details.hd_sqft_home", {
        count: sqftNum.toLocaleString(),
        defaultValue: "{{count}} Sq Ft Home",
      })
    );
  }
  const pricePerSqftDisplay =
    fields.pricePerSquareFoot &&
    ((typeof fields.pricePerSquareFoot === "number" && fields.pricePerSquareFoot > 0) ||
      (typeof fields.pricePerSquareFoot === "string" &&
        fields.pricePerSquareFoot !== "0" &&
        fields.pricePerSquareFoot.trim() !== ""))
      ? typeof fields.pricePerSquareFoot === "string"
        ? fields.pricePerSquareFoot
        : String(fields.pricePerSquareFoot)
      : undefined;
  if (pricePerSqftDisplay) {
    interiorLines.push(
      t("property_details.hd_price_per_sqft_line", {
        value: pricePerSqftDisplay,
        defaultValue: "${{value}} per sq ft",
      })
    );
  }
  interiorLines.push(...asStringList(property.interiorFeatures, 10));
  if (interiorLines.length > 0) {
    col1.push({
      id: "interior",
      icon: "home",
      title: t("property_details.hd_interior_spaces", {
        defaultValue: "Interior Spaces",
      }),
      lines: interiorLines,
    });
  }

  const dom = property.daysOnMarket;
  if (typeof dom === "number" && dom >= 0) {
    col1.push({
      id: "days-on-market",
      icon: "clock",
      title: t("property_details.hd_days_on_market", {
        defaultValue: "Days on Market",
      }),
      lines: [String(dom)],
    });
  }

  const condition = asTrimmedString(property.propertyCondition);
  if (condition) {
    col1.push({
      id: "condition",
      icon: "check-circle",
      title: t("property_details.hd_property_condition", {
        defaultValue: "Property Condition",
      }),
      lines: [condition],
    });
  }

  if (typeof fields.zestimate === "number" && fields.zestimate > 0) {
    col1.push({
      id: "zestimate",
      icon: "trending-up",
      title: t("property_details.fact_zestimate", {
        defaultValue: "Zestimate",
      }),
      lines: [`$${fields.zestimate.toLocaleString()}`],
    });
  }
  if (typeof fields.rentZestimate === "number" && fields.rentZestimate > 0) {
    col1.push({
      id: "rent-z",
      icon: "key",
      title: t("property_details.fact_rent_estimate", {
        defaultValue: "Rent estimate",
      }),
      lines: [
        `$${fields.rentZestimate.toLocaleString()}${t("property_details.per_month", {
          defaultValue: "/month",
        })}`,
      ],
    });
  }

  return col1;
}
