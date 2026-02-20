import type { CompareHomesComparisonField } from "packages/utils/domain/compareHomes/types";
import { formatPropertyType } from "packages/utils/domain/search/property";
import { formatPrice } from "packages/utils/domain/search/propertyDetailsFormatters";

export function getCoreFields(): CompareHomesComparisonField[] {
  return [
    {
      key: "price",
      label: "Price",
      getValue: (h) => {
        if (!h.price || h.price === "—") return "—";
        return formatPrice(h.price);
      },
    },
    {
      key: "bedrooms",
      label: "Bedrooms",
      getValue: (h) => String(h.bedrooms ?? "—"),
    },
    {
      key: "bathrooms",
      label: "Bathrooms",
      getValue: (h) => String(h.bathrooms ?? "—"),
    },
    {
      key: "sqft",
      label: "Sqft",
      getValue: (h) => {
        if (!h.sqft || h.sqft === "—") return "—";
        const sqftValue =
          typeof h.sqft === "number" ? h.sqft : parseFloat(String(h.sqft));
        if (isNaN(sqftValue)) return String(h.sqft);
        return `${sqftValue.toLocaleString()} ft`;
      },
    },
    {
      key: "lotSize",
      label: "Lot Size",
      getValue: (h) => {
        if (!h.lotSize || h.lotSize === "—") return "—";
        const lotSizeStr = String(h.lotSize).toLowerCase();

        if (lotSizeStr.includes("acre")) {
          const acreValue = parseFloat(lotSizeStr.replace(/[^\d.]/g, ""));
          if (!isNaN(acreValue)) {
            return `${acreValue.toFixed(2)} acres`;
          }
        }

        const sqftValue = parseFloat(lotSizeStr.replace(/[^\d.]/g, ""));
        if (!isNaN(sqftValue) && sqftValue > 0) {
          const acres = sqftValue / 43560;
          return `${acres.toFixed(2)} acres`;
        }

        return String(h.lotSize);
      },
    },
    {
      key: "yearBuilt",
      label: "Year Built",
      getValue: (h) => String(h.yearBuilt ?? "—"),
    },
    {
      key: "propertyType",
      label: "Property Type",
      getValue: (h) => {
        if (!h.propertyType || h.propertyType === "—") return "—";
        return formatPropertyType(h.propertyType);
      },
    },
  ];
}
