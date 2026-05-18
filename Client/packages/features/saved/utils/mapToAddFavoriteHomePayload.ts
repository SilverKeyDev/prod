import type { AddFavoriteRequest } from "packages/features/homeauth/types/auth/user";

/**
 * Map arbitrary property input to AddFavoriteRequest.home payload (FavoriteHomePayload).
 */
export function mapToAddFavoriteHomePayload(input: unknown): AddFavoriteRequest["home"] {
  const obj = (input ?? {}) as Record<string, unknown>;
  const getString = (v: unknown, fallback = ""): string =>
    typeof v === "string" ? v : typeof v === "number" ? String(v) : fallback;
  const getInt = (v: unknown, fallback = 0): number => {
    if (typeof v === "number") return Math.round(v);
    if (typeof v === "string") {
      const parsed = parseInt(v.replace(/,/g, ""), 10);
      return isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
  };
  const getFloat = (v: unknown, fallback = 0): number => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const parsed = parseFloat(v.replace(/,/g, ""));
      return isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
  };
  const normalizePrice = (v: unknown): string => {
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    if (typeof v === "string" && v.trim() !== "") {
      let stripped = v.replace(/[$\s]/g, "");
      const dots = (stripped.match(/\./g) || []).length;
      if (dots > 1) {
        stripped = stripped.replace(/\./g, "");
      } else if (dots === 1 && /^\d+\.\d{3}$/.test(stripped.replace(/,/g, ""))) {
        stripped = stripped.replace(/\./g, "");
      }
      stripped = stripped.replace(/,/g, "");
      const n = parseFloat(stripped);
      return Number.isFinite(n) ? String(n) : v;
    }
    return "";
  };

  const id = getString(obj.id ?? obj.address ?? obj.home_id);
  const address = getString(obj.address ?? obj.description);
  const price = normalizePrice(obj.price);
  const bedrooms = getInt(obj.bedrooms ?? obj.beds);
  const bathrooms = getInt(obj.bathrooms ?? obj.baths);
  const sqft = getInt(obj.sqft ?? obj.livingArea);
  const lat = getFloat(obj.lat ?? obj.latitude);
  const lng = getFloat(obj.lng ?? obj.longitude);
  const lotSize = obj.lotSize !== undefined ? getString(obj.lotSize) : undefined;
  const propertyType = getString(obj.propertyType ?? obj.property_type);
  const listingStatus = getString(obj.listingStatus ?? obj.listing_status);
  const imageUrl =
    obj.imageUrl !== undefined
      ? getString(obj.imageUrl)
      : getString(obj.image_url, undefined as unknown as string);

  return {
    id,
    address,
    price,
    bedrooms,
    bathrooms,
    sqft,
    lat,
    lng,
    ...(lotSize !== undefined ? { lotSize } : {}),
    propertyType,
    listingStatus,
    ...(imageUrl ? { imageUrl } : {}),
  };
}
