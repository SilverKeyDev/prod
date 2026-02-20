// Property-related type definitions

import type { Agent } from "packages/schemas/app/auth/user";

export type Property = {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lot_size?: string;
  year_built?: number;
  property_type: string;
  listing_status: string;
  mls_id?: string;
  images?: string[];
  description?: string;
  lat: number;
  lng: number;
  neighborhood?: string;
  school_district?: string;
  hoa_fees?: number;
  property_taxes?: number;
  days_on_market?: number;
  listing_agent?: Agent;
};

export type SavedHome = {
  home_id: string;
  description?: string;
  image_url?: string;
  price?: string | number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lat?: number;
  lng?: number;
  address?: string;
  [key: string]: unknown;
};

export type SearchQuery = {
  id: string;
  name?: string;
  filters: {
    min_price?: number;
    max_price?: number;
    bedrooms?: number;
    bathrooms?: number;
    property_type?: string[];
    location?: string;
    radius?: number;
  };
  created_at: Date;
  results_count?: number;
};

export type SavedSearch = {
  id: string;
  name: string;
  query: SearchQuery;
  email_alerts: boolean;
  created_at: Date;
  last_run?: Date;
};

export type PriceHistory = {
  id: string;
  property_id: string;
  price: number;
  date: Date;
  event_type: "listed" | "price_change" | "sold" | "withdrawn";
  source: string;
};

export type MarketTrend = {
  id: string;
  location: string;
  time_period: string;
  median_price: number;
  price_change_percent: number;
  inventory_levels: number;
  days_on_market: number;
  sale_to_list_ratio: number;
  updated_at: Date;
};

export type NeighborhoodStats = {
  id: string;
  neighborhood: string;
  city: string;
  state: string;
  median_home_value: number;
  median_rent: number;
  population: number;
  median_age: number;
  median_income: number;
  crime_rate: number;
  school_rating: number;
  walkability_score: number;
  updated_at: Date;
};

export type PropertyAnalysis = {
  neighborhood_overview?: {
    description?: string;
    vibe?: string;
  };
  pros?: string[];
  cons?: string[];
  // Allow any additional report sections (commute, schools, safety, etc.)
  [key: string]: unknown;
};

export type PropertyWithAnalysis = {
  property_analysis?: PropertyAnalysis;
  // Add other property fields as needed
  [key: string]: unknown;
};
