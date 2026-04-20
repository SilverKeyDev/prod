import type { SavedHome } from "packages/types";

export const savedHomesFetchList = [
  {
    id: "home-1",
    address: "123 Main St",
    lat: 37.7749,
    lng: -122.4194,
    price: "$500,000",
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1500,
  },
  {
    id: "home-2",
    address: "456 Oak Ave",
    lat: 37.7849,
    lng: -122.4294,
    price: "$600,000",
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2000,
  },
] as const;

export const clientScopedSavedHomes = [
  {
    id: "home-1",
    address: "123 Main St",
    lat: 37.7749,
    lng: -122.4194,
  },
] as const;

export const existingHomeForDuplicateTest = {
  id: "home-1",
  address: "123 Main St",
  lat: 37.7749,
  lng: -122.4194,
};

export const newHomeForSave = {
  id: "home-123",
  address: "789 Pine St",
  lat: 37.7949,
  lng: -122.4394,
  price: "$700,000",
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1800,
};

export const newHomeMinimalForRollback = {
  id: "home-123",
  address: "789 Pine St",
  lat: 37.7949,
  lng: -122.4394,
};

export const savedHomeMainSt: SavedHome = {
  home_id: "home-1",
  address: "123 Main St",
  description: "123 Main St",
  lat: 37.7749,
  lng: -122.4194,
  price: "$500,000",
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1500,
  lot_size: "",
  image_url: null,
};

export const savedHomeOakAve: SavedHome = {
  home_id: "home-2",
  address: "456 Oak Ave",
  description: "456 Oak Ave",
  lat: 37.7849,
  lng: -122.4294,
  price: "$600,000",
  bedrooms: 4,
  bathrooms: 3,
  sqft: 2000,
  lot_size: "",
  image_url: null,
};

export const twoSavedHomes: SavedHome[] = [savedHomeMainSt, savedHomeOakAve];
