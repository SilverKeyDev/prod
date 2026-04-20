/**
 * Shape passed to property-details streaming fetch (usePropertyDetails).
 * Kept in packages/types so features (e.g. propertyDetails) do not import search hook internals.
 */
export type PropertyDetailsStreamProperty = {
  id: string;
  /** When set, preferred Slipstream listing id (often same as public zpid). */
  zpid?: string;
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
