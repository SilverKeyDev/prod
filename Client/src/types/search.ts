// Shared SearchResult type definition for consistent usage across the application

export interface SearchResult {
  // Core required properties
  id: string;
  address: string;
  price: string;
  
  // Property details (with defaults)
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  
  // Location coordinates (supporting both formats)
  lat: number;
  lng: number;
  latitude: number;
  longitude: number;
  
  // Property details
  lotSize?: string;
  propertyType?: string;
  listingStatus?: string;
  imageUrl?: string;
  images?: string[];
  
  // Scoring and metadata
  _score?: number;
  zpid?: number;
  
  // Address components
  streetAddress?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  
  // Property characteristics
  yearBuilt?: number;
  livingArea?: string;
  livingAreaValue?: number;
  pricePerSquareFoot?: number;
  propertyTypeDimension?: string;
  homeType?: string;
  listingSubType?: string;
  
  // Financial information
  zestimate?: number;
  rentZestimate?: number;
  taxAssessedValue?: number;
  
  // Lot information
  lotAreaValue?: number;
  lotAreaUnit?: string;
  
  // Additional metadata
  description?: string;
  url?: string;
  zillow_url?: string;
  
  // Commute data
  commute_data?: {
    commute_time?: number;
    commute_distance?: number;
  };
  
  // Schools data
  schools?: Array<{
    name?: string;
    rating?: number;
    level?: string;
    grades?: string;
    distance?: number;
  }>;
  
  // Property analysis
  property_analysis?: {
    summary?: string;
    pros?: string[];
    cons?: string[];
  };
}

// LatLng interface for coordinate handling
export interface LatLng {
  lat: number;
  lng: number;
  lon?: number; // Optional for searchApi compatibility
}

// Isochrone data structure
export interface IsochroneData {
  polygon: LatLng[];
  center: { lat: number; lng: number };
  locations: Array<{
    name: string;
    address: string;
    lat: number | null;
    lng: number | null;
    category?: string;
    commute_tolerance?: number;
    commute_time?: number;
  }>;
}
