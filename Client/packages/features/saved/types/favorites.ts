// Favorites API types (list with HomeUniversal; user API has separate shapes in api/user)
import type { HomeUniversal } from "./property";

export type FavoriteHomesResponse = {
  success: boolean;
  favorites?: HomeUniversal[];
  error?: string;
};

export type AddFavoriteHomeRequest = {
  home: {
    id: string;
    address: string;
    price: string;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    lat: number;
    lng: number;
    lotSize?: string;
    propertyType: string;
    listingStatus: string;
    imageUrl?: string;
  };
};

export type RemoveFavoriteHomeRequest = {
  address: string;
};

export type FavoriteHomeResponse = {
  success: boolean;
  favorites?: string[];
  error?: string;
};
