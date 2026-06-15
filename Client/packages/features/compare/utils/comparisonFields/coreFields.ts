import type { CompareHomesComparisonField } from "packages/features/compare/types/compareHomes";
import { formatPrice, formatPropertyType } from "packages/utils/core/format/property";
import { formatLotSize } from "packages/utils/core/format/property/addressFormatting";

export function getCoreFields(): CompareHomesComparisonField[] {
  return [
    {
      key: "price",
      label: "Price",
      getValue: (h) => {
        if (!h.price || h.price === "-") return "-";
        return formatPrice(h.price);
      },
    },
    {
      key: "bedrooms",
      label: "Bedrooms",
      getValue: (h) => String(h.bedrooms ?? "-"),
    },
    {
      key: "bathrooms",
      label: "Bathrooms",
      getValue: (h) => String(h.bathrooms ?? "-"),
    },
    {
      key: "sqft",
      label: "Sqft",
      getValue: (h) => {
        if (!h.sqft || h.sqft === "-") return "-";
        const sqftValue = typeof h.sqft === "number" ? h.sqft : parseFloat(String(h.sqft));
        if (isNaN(sqftValue)) return String(h.sqft);
        return `${sqftValue.toLocaleString()} ft`;
      },
    },
    {
      key: "lotSize",
      label: "Lot Size",
      getValue: (h) => {
        if (!h.lotSize || h.lotSize === "-") return "-";
        const formatted = formatLotSize(String(h.lotSize));
        return formatted === "N/A" ? String(h.lotSize) : formatted;
      },
    },
    {
      key: "yearBuilt",
      label: "Year Built",
      getValue: (h) => String(h.yearBuilt ?? "-"),
    },
    {
      key: "propertyType",
      label: "Property Type",
      getValue: (h) => {
        if (!h.propertyType || h.propertyType === "-") return "-";
        return formatPropertyType(h.propertyType);
      },
    },
  ];
}
