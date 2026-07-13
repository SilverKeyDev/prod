/** Demo brokerage office inventory listing (Market tab fixtures). */
export type BrokerageInventoryListing = {
  id: string;
  address: string;
  /** Raw listing amount — mapped to SearchResult.price as a digit string for card display. */
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lat: number;
  lng: number;
  lotSize?: string;
  propertyType?: string;
  listingStatus?: string;
  imageUrl?: string;
};
