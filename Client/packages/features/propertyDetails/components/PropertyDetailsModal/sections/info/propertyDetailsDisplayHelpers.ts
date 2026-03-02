/**
 * Shared display helpers for PropertyDetails and PropertyBasicInfo sections.
 * Extracted to satisfy max-lines-per-function.
 */
import React from "react";

export function asReactNode(v: unknown): React.ReactNode {
  if (React.isValidElement(v)) return v;
  if (typeof v === "string" || typeof v === "number") return v;
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "true" : "false";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function safeStringify(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[Object]";
    }
  }
  return "[Unknown]";
}

export function formatAgentPhoneNumber(ph: Record<string, unknown> | undefined): string {
  if (!ph) return "Phone available";
  const { areacode, prefix, number } = ph as {
    areacode?: unknown;
    prefix?: unknown;
    number?: unknown;
  };
  if (areacode && prefix && number) {
    return `(${safeStringify(areacode)}) ${safeStringify(prefix)}-${safeStringify(number)}`;
  }
  return (
    (typeof areacode === "string" ? areacode : null) ??
    (typeof prefix === "string" ? prefix : null) ??
    (typeof number === "string" ? number : null) ??
    "Phone available"
  );
}

export function getAgentFromProperty(property: unknown): {
  hasAgent: boolean;
  imageUrl: string | undefined;
  displayName: string | undefined;
  businessName: string | undefined;
  phone: Record<string, unknown> | undefined;
} {
  const listedBy = (property as { listed_by: unknown }).listed_by;
  const hasAgent = listedBy && typeof listedBy === "object" && listedBy !== null;
  const agent = hasAgent ? (listedBy as Record<string, unknown>) : null;
  return {
    hasAgent: !!agent,
    imageUrl: agent?.image_url as string | undefined,
    displayName: agent?.display_name as string | undefined,
    businessName: agent?.business_name as string | undefined,
    phone: agent?.phone as Record<string, unknown> | undefined,
  };
}

/** Extract basic display fields from property to reduce branching in components. */
export function getPropertyBasicFields(property: Record<string, unknown>): {
  price: number | string | undefined;
  sqft: number | string | undefined;
  bedrooms: number | string | undefined;
  bathrooms: number | string | undefined;
  yearBuilt: number | string | undefined;
  lotSize: number | string | undefined;
  homeType: string | undefined;
  propertyType: string | undefined;
  pricePerSquareFoot: number | string | undefined;
  garageSpaces: number | undefined;
  parking: number | undefined;
  zestimate: number | undefined;
  rentZestimate: number | undefined;
} {
  return {
    price: property.price as number | string | undefined,
    sqft: property.sqft as number | string | undefined,
    bedrooms: property.bedrooms as number | string | undefined,
    bathrooms: property.bathrooms as number | string | undefined,
    yearBuilt: property.yearBuilt as number | string | undefined,
    lotSize: property.lotSize as number | string | undefined,
    homeType: property.homeType as string | undefined,
    propertyType: property.propertyType as string | undefined,
    pricePerSquareFoot: property.pricePerSquareFoot as number | string | undefined,
    garageSpaces: property.garageSpaces as number | undefined,
    parking: property.parking as number | undefined,
    zestimate: property.zestimate as number | undefined,
    rentZestimate: property.rentZestimate as number | undefined,
  };
}
