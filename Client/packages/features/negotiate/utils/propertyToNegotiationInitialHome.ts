import type { NegotiationInitialHome } from "packages/features/negotiate/types/negotiationInitialHome";
import {
  formatLotSize,
  formatStructuredAddress,
} from "packages/utils/core/format/property/addressFormatting";

import { getAddressFromHome } from "./addressUtils";

function formatPriceForNegotiation(price: unknown): string {
  if (price === undefined || price === null) return "";
  if (typeof price === "string") {
    const trimmed = price.trim();
    if (!trimmed) return "";
    return trimmed.startsWith("$") ? trimmed : `$${trimmed}`;
  }
  if (typeof price === "number" && Number.isFinite(price)) {
    return `$${price.toLocaleString()}`;
  }
  return "";
}

function formatAddressFromProperty(property: unknown): string {
  if (!property || typeof property !== "object") return "";
  const p = property as Record<string, unknown>;
  const addrField = p.address;
  if (typeof addrField === "string" && addrField.trim().length > 0) {
    return addrField.trim();
  }
  if (
    typeof addrField === "object" &&
    addrField !== null &&
    "streetAddress" in addrField &&
    "city" in addrField &&
    "state" in addrField &&
    "zipcode" in addrField
  ) {
    return formatStructuredAddress(
      addrField as {
        streetAddress: string;
        city: string;
        state: string;
        zipcode: string;
      }
    );
  }
  if (
    typeof p.streetAddress === "string" &&
    typeof p.city === "string" &&
    typeof p.state === "string"
  ) {
    return [p.streetAddress, p.city, p.state, p.zipcode].filter(Boolean).join(", ");
  }
  const fromHome = getAddressFromHome(property);
  if (typeof fromHome === "string" && fromHome.trim().length > 0) {
    return fromHome.trim();
  }
  return "";
}

function firstImageUrl(property: Record<string, unknown>): string {
  const images = property.images;
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === "string") return first;
    if (
      first &&
      typeof first === "object" &&
      "url" in first &&
      typeof (first as { url: unknown }).url === "string"
    ) {
      return (first as { url: string }).url;
    }
  }
  if (typeof property.imageUrl === "string") return property.imageUrl;
  return "";
}

function lotSizeString(property: Record<string, unknown>): string {
  const lot = property.lotSize ?? property.lot_size;
  if (lot === undefined || lot === null) return "";
  if (typeof lot === "number") {
    const formatted = formatLotSize(lot);
    return formatted === "N/A" ? "" : formatted;
  }
  if (typeof lot === "string" && lot.trim() !== "") {
    const formatted = formatLotSize(lot);
    return formatted === "N/A" ? lot : formatted;
  }
  return "";
}

/**
 * Map a property-details or search listing to NegotiationModal `initialHome`.
 */
export function propertyToNegotiationInitialHome(property: unknown): NegotiationInitialHome {
  const p =
    property && typeof property === "object"
      ? (property as Record<string, unknown>)
      : ({} as Record<string, unknown>);
  const beds = p.bedrooms ?? p.beds;
  const baths = p.bathrooms ?? p.baths;
  const sqft = p.sqft ?? p.livingAreaValue;

  return {
    user_id: "",
    address: formatAddressFromProperty(property),
    beds: beds !== undefined && beds !== null ? String(beds) : "",
    baths: baths !== undefined && baths !== null ? String(baths) : "",
    sqft: sqft !== undefined && sqft !== null ? String(sqft) : "",
    lot_size: lotSizeString(p),
    price: formatPriceForNegotiation(p.price),
    image_url: firstImageUrl(p),
    created_at: "",
    updated_at: "",
  };
}
