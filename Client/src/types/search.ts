// Shared SearchResult type definition for consistent usage across the application
export interface SearchResult {
  id: string;
  address: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lat: number;
  lng: number;
  lotSize?: string;
  propertyType?: string;
  listingStatus?: string;
  imageUrl?: string;
  _score?: number; // Backend ML match score (0-100 integer)

  // Enhanced property details from searchAddress API
  zpid?: number;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  yearBuilt?: number;
  livingArea?: string;
  livingAreaValue?: number;
  pricePerSquareFoot?: number;
  propertyTypeDimension?: string;
  homeType?: string;
  homeStatus?: string;
  timeOnZillow?: string;
  daysOnZillow?: number;
  onMarketDate?: number;

  // Financial information
  zestimate?: number;
  taxAnnualAmount?: number;
  propertyTaxRate?: number;
  hoaFee?: string;
  associationFee?: string;
  monthlyHoaFee?: number;
  annualHomeownersInsurance?: number;
  rentZestimate?: number;

  // Property features
  architecturalStyle?: string;
  structureType?: string;
  propertyCondition?: string;
  isNewConstruction?: boolean;
  hasGarage?: boolean;
  hasAttachedGarage?: boolean;
  garageSpaces?: number;
  parking?: number;
  hasView?: boolean;
  waterView?: string;
  hasFireplace?: boolean;
  hasCooling?: boolean;
  hasHeating?: boolean;
  hasAssociation?: boolean;

  // Detailed features
  view?: string[];
  flooring?: string[];
  heating?: string[];
  cooling?: string[];
  appliances?: string[];
  interiorFeatures?: string[];
  exteriorFeatures?: any;
  lotFeatures?: string[];
  communityFeatures?: string[];
  parkingFeatures?: string[];
  utilities?: string[];
  inclusions?: string[];

  // Room information
  rooms?: any[];
  bathroomsFull?: number;
  bathroomsHalf?: number;
  bathroomsPartial?: number;
  bathroomsThreeQuarter?: number;
  mainLevelBedrooms?: number;
  mainLevelBathrooms?: number;

  // Building details
  stories?: string;
  roofType?: string;
  foundationDetails?: string[];
  constructionMaterials?: string[];
  windowFeatures?: string[];

  // Location details
  subdivision?: string;
  subdivisionName?: string;
  county?: string;
  cityId?: number;
  parcelNumber?: string;

  // Agent information
  contact_recipients?: any[];
  listed_by?: {
    agent_reason?: number;
    zpro?: boolean;
    recent_sales?: number;
    review_count?: number;
    display_name?: string;
    badge_type?: string;
    business_name?: string;
    rating_average?: number;
    phone?: {
      prefix?: string;
      areacode?: string;
      number?: string;
    };
    zuid?: string;
    image_url?: string;
  };

  // Schools
  schools?: Array<{
    name?: string;
    rating?: number;
    level?: string;
    grades?: string;
    type?: string;
    distance?: number;
    isAssigned?: boolean;
    studentsPerTeacher?: number;
    size?: number;
    link?: string;
  }>;

  // Price history
  priceHistory?: Array<{
    date?: string;
    price?: number;
    event?: string;
    priceChangeRate?: number;
    source?: string;
    pricePerSquareFoot?: number;
  }>;

  // Nearby homes
  nearbyHomes?: any[];

  // At a glance facts
  atAGlanceFacts?: Array<{
    factLabel?: string;
    factValue?: string;
  }>;

  // Additional details
  description?: string;
  url?: string;
  mlsid?: string;
  pageViewCount?: number;
  favoriteCount?: number;
  virtualTour?: string;
  buildingName?: string;

  // Mortgage rates
  mortgageRates?: {
    thirtyYearFixedRate?: number;
    fifteenYearFixedRate?: number;
    arm5Rate?: number;
  };
}

// Isochrone data structure
export interface IsochroneData {
  polygon: Array<{ lat: number; lng: number }>;
  center: { lat: number; lng: number };
  locations: Array<{
    name: string;
    address: string;
    lat: number;
    lng: number;
    category?: string;
    commute_tolerance?: number;
    commute_time?: number;
  }>;
}
