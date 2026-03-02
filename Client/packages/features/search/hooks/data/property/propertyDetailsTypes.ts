/**
 * Shared types for property details (used by usePropertyDetails and propertyDetailsStreamHelpers).
 * Kept in a separate file to avoid circular dependency between the hook and helpers.
 */

export type Property = {
  id: string;
  address: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lat: number;
  lng: number;
  latitude: number;
  longitude: number;
  images?: string[];
  [key: string]: unknown;
};
