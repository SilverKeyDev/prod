import type { SavedHome } from "packages/schemas";

/**
 * Returns true if the value is an array of processed SavedHome items (each has home_id and address).
 */
export function isProcessedSavedHomeList(value: unknown): value is SavedHome[] {
  return (
    Array.isArray(value) &&
    value.every(
      (home) =>
        home &&
        typeof home === "object" &&
        "home_id" in home &&
        "address" in home,
    )
  );
}

/**
 * Find a SavedHome by id or by address (normalized).
 */
export function findSavedHomeByIdOrAddress(
  homes: SavedHome[],
  propertyId: string,
  propertyAddress?: string,
): SavedHome | undefined {
  const home = homes.find((h) => h.home_id === propertyId);
  if (home) return home;
  if (propertyAddress && typeof propertyAddress === "string") {
    const normalized = propertyAddress.toLowerCase();
    return homes.find((h) => {
      const addr = typeof h.address === "string" ? h.address.toLowerCase() : "";
      return addr === normalized;
    });
  }
  return undefined;
}

/**
 * Convert SavedHome to Property format for property details hook
 */
export function convertSavedHomeToProperty(home: SavedHome) {
  return {
    id: home.home_id,
    address: String(home.address || home.description || ""),
    price:
      typeof home.price === "string"
        ? home.price.startsWith("$")
          ? home.price
          : `$${home.price}`
        : typeof home.price === "number"
          ? `$${home.price.toLocaleString()}`
          : "Price not available",
    bedrooms: home.bedrooms ?? 0,
    bathrooms: home.bathrooms ?? 0,
    sqft: home.sqft ?? 0,
    lat: home.lat ?? 0,
    lng: home.lng ?? 0,
    latitude: home.lat ?? 0,
    longitude: home.lng ?? 0,
    images: home.image_url ? [home.image_url] : undefined,
  };
}

/**
 * Convert SavedHome to FavoriteHome format for negotiation
 */
export function convertToFavoriteHome(home: SavedHome) {
  return {
    user_id: "",
    address: String(home.address || home.description || ""),
    beds: String(home.bedrooms ?? ""),
    baths: String(home.bathrooms ?? ""),
    sqft: String(home.sqft ?? ""),
    lot_size: typeof home.lot_size === "string" ? home.lot_size : "",
    price:
      typeof home.price === "string"
        ? home.price.startsWith("$")
          ? home.price
          : `$${home.price}`
        : typeof home.price === "number"
          ? `$${home.price.toLocaleString()}`
          : "",
    image_url: home.image_url || "",
    created_at: "",
    updated_at: "",
  };
}

/**
 * Filter homes by search term
 */
export function filterHomesBySearchTerm(
  homes: SavedHome[],
  searchTerm: string,
): SavedHome[] {
  return homes.filter((h: SavedHome) => {
    return (
      h.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.home_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
}
