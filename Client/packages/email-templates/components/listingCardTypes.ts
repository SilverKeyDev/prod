/**
 * Shared types for ListingCard email components.
 * Kept in a separate file to avoid circular dependencies between
 * ListingCard, ListingCardBody, and ListingCardImageSection.
 */

export type Listing = {
  id: string;
  address: string;
  price: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  score?: number;
  imageUrl?: string;
  propertyUrl?: string;
  isNewListing?: boolean;
  priceCut?: {
    previousPrice: string;
    amount: string;
    percent?: number;
  };
};
