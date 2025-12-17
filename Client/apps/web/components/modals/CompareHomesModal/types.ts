import type { SavedHome } from "../../../../../packages/schemas";

export type CompareHomesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedHomes: SavedHome[];
  onRemove: (homeId: string) => void;
  onAdd?: (homeId: string) => void;
  allLikedHomes?: SavedHome[];
};

export type PropertyDetails = {
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

export type ComparisonField = {
  key: string;
  label: string;
  getValue: (home: PropertyDetails) => string;
  sectionKey?: string; // The section this field belongs to (e.g., "commute", "family_friendly")
  isSectionHeader?: boolean; // True if this is a section header row
  isLoading?: boolean; // True if this section is still loading for some homes
};

