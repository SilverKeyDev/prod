export type CompareHomesPropertyDetails = {
  id: string;
  address: string;
  price?: string | number;
  bedrooms?: number | string;
  bathrooms?: number | string;
  sqft?: number | string;
  lotSize?: string;
  yearBuilt?: string | number;
  propertyType?: string;
  homeType?: string;
  listingStatus?: string;
  imageUrl?: string;
  images?: string[];
  features?: unknown;
  propertyAnalysis?: Record<string, unknown>;
  commuteData?: unknown;
  imageFeatures?: unknown;
  combinedFeatures?: {
    combined_features: string[];
    preferred_overlap: string[];
    dealbreaker_overlap: string[];
  };
  isLoading?: boolean;
  error?: string;
};

export type CompareHomesComparisonField = {
  key: string;
  label: string;
  getValue: (home: CompareHomesPropertyDetails) => string;
  sectionKey?: string;
  isSectionHeader?: boolean;
  isLoading?: boolean;
};
