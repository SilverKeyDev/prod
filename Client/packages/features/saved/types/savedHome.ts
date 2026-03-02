export type SavedHome = {
  home_id: string;
  description: string;
  address: string;
  price: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lot_size: string;
  image_url?: string;
  lat?: number;
  lng?: number;
  /** Internal: database id if present from backend */
  _databaseId?: string;
};
