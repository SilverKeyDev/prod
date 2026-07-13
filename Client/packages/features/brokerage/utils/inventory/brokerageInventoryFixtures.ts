import type { BrokerageInventoryListing } from "packages/features/brokerage/types/inventory";

/**
 * Demo office inventory for brokerage Analytics → Market.
 * Prices are numeric fixture values mapped to SearchResult strings in the adapter.
 */
export const BROKERAGE_INVENTORY_FIXTURE: BrokerageInventoryListing[] = [
  {
    id: "brokerage-inv-001",
    address: "1247 Barton Springs Rd, Austin, TX 78704",
    price: 425000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1840,
    lat: 30.2599,
    lng: -97.7705,
    lotSize: "0.18 ac",
    propertyType: "SINGLE_FAMILY",
    listingStatus: "FOR_SALE",
    imageUrl:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "brokerage-inv-002",
    address: "8920 Shoal Creek Blvd, Austin, TX 78757",
    price: 589000,
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2410,
    lat: 30.3672,
    lng: -97.7431,
    lotSize: "0.24 ac",
    propertyType: "SINGLE_FAMILY",
    listingStatus: "FOR_SALE",
    imageUrl:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "brokerage-inv-003",
    address: "4512 Westlake Dr, Austin, TX 78746",
    price: 1250000,
    bedrooms: 5,
    bathrooms: 4,
    sqft: 3680,
    lat: 30.2951,
    lng: -97.8012,
    lotSize: "0.42 ac",
    propertyType: "SINGLE_FAMILY",
    listingStatus: "FOR_SALE",
    imageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "brokerage-inv-004",
    address: "2109 E 6th St Unit 4B, Austin, TX 78702",
    price: 315000,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1120,
    lat: 30.2624,
    lng: -97.7235,
    propertyType: "CONDO",
    listingStatus: "FOR_SALE",
    imageUrl:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "brokerage-inv-005",
    address: "7801 Brodie Ln, Austin, TX 78745",
    price: 478500,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1965,
    lat: 30.2148,
    lng: -97.8201,
    lotSize: "0.21 ac",
    propertyType: "SINGLE_FAMILY",
    listingStatus: "PENDING",
    imageUrl:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "brokerage-inv-006",
    address: "3300 Duval St, Austin, TX 78705",
    price: 725000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1580,
    lat: 30.2987,
    lng: -97.7412,
    lotSize: "0.12 ac",
    propertyType: "TOWNHOUSE",
    listingStatus: "FOR_SALE",
    imageUrl:
      "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=800&q=80",
  },
];
