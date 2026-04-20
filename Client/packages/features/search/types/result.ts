/**
 * UI/domain search result and property types.
 * Single source for SearchResult, PropertyDetails, and related type guards.
 */

import { getPropertyMatchScore } from "packages/utils/search/scoring/propertyMatchScore";

export type PropertyType =
  | "SINGLE_FAMILY"
  | "CONDO"
  | "TOWNHOUSE"
  | "MULTI_FAMILY"
  | "LAND"
  | "COMMERCIAL";

export type ListingStatus = "FOR_SALE" | "FOR_RENT" | "SOLD" | "PENDING" | "OFF_MARKET";

export type PropertyImage = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

export type PropertyDetails = {
  id: string;
  address: string;
  price: string | number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lat: number;
  lng: number;
  lotSize?: string;
  propertyType: PropertyType;
  listingStatus: ListingStatus;
  imageUrl?: string;
  images?: PropertyImage[];
  calculatedScore?: number;
  _score?: number;
};

/** Shared SearchResult type for consistent usage across the application */
export type SearchResult = {
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
  images?: string[];
  _score?: number; // Backend ML match score (0-100 integer)

  // Enhanced property details from searchAddress API
  zpid?: number | string;
  /** MLS / provider listing key when present (e.g. saved homes, shared-home snapshots). */
  mls_home_id?: string;
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
  exteriorFeatures?: unknown;
  lotFeatures?: string[];
  communityFeatures?: string[];
  parkingFeatures?: string[];
  utilities?: string[];
  inclusions?: string[];

  // Room information
  rooms?: unknown[];
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
  contact_recipients?: unknown[];
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
  nearbyHomes?: unknown[];

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
};

export function isPropertyDetails(obj: unknown): obj is PropertyDetails {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as PropertyDetails).id === "string" &&
    typeof (obj as PropertyDetails).address === "string" &&
    typeof (obj as PropertyDetails).lat === "number" &&
    typeof (obj as PropertyDetails).lng === "number"
  );
}

/** Centralized match score read (backend MCDA display scale when `_score` is set). */
export const getMatchScore = (property: SearchResult): number => getPropertyMatchScore(property);

export { isListingFullCriteriaMatch } from "packages/utils/search/scoring/propertyMatchScore";
