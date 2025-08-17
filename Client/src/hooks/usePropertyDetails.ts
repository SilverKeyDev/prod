import { useState, useCallback } from 'react';
import { getPropertyDetailsByAddress } from './searchAddress';

export interface Property {
  id: string;
  address: string;
  price: string; // Make required and string type to match SearchResult
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lat: number;
  lng: number;
  images?: string[];
  [key: string]: any;
}

export interface UsePropertyDetailsReturn {
  /** Whether property details are currently being fetched */
  isLoading: boolean;
  /** The selected property with detailed information */
  selectedProperty: Property | null;
  /** Function to fetch and set property details */
  fetchPropertyDetails: (property: Property, useAddressOnly?: boolean) => Promise<void>;
  /** Function to clear the selected property */
  clearSelectedProperty: () => void;
  /** Error state if property details fetch fails */
  error: string | null;
}

/**
 * Custom hook for fetching and managing property details
 * Provides loading state, error handling, and property data management
 */
export function usePropertyDetails(): UsePropertyDetailsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPropertyDetails = useCallback(async (property: Property, useAddressOnly: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const detailedPropertyData = await getPropertyDetailsByAddress(
        useAddressOnly ? undefined : property.id, // Only use zpid if not address-only
        property.address // Always pass address
      );

      const enhancedProperty = {
        ...property,
        ...detailedPropertyData, // Merge detailed data with existing property data
      };
      setSelectedProperty(enhancedProperty);
    } catch (error) {
      console.error("❌ [USE_PROPERTY_DETAILS] Error fetching property details:", error);
      console.error("❌ [USE_PROPERTY_DETAILS] Error type:", typeof error);
      console.error("❌ [USE_PROPERTY_DETAILS] Error message:", (error as Error).message);

      const errorMessage = (error as Error).message || 'Failed to fetch property details';
      setError(errorMessage);

      // Fallback: use the original property data without detailed information
      console.log("🔄 [USE_PROPERTY_DETAILS] Using fallback: setting original property data");
      setSelectedProperty(property);
    } finally {
      // Clear loading state regardless of success or failure
      setIsLoading(false);
    }
  }, []);

  const clearSelectedProperty = useCallback(() => {
    setSelectedProperty(null);
    setError(null);
  }, []);

  return {
    isLoading,
    selectedProperty,
    fetchPropertyDetails,
    clearSelectedProperty,
    error
  };
}
