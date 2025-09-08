import { useState, useCallback } from 'react';
import { searchApi } from '../api';

export interface Property {
  id: string;
  address: string;
  price: string; // Make required and string type to match SearchResult
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lat: number;
  lng: number;
  latitude: number;
  longitude: number;
  images?: string[];
  [key: string]: any;
}

export interface UsePropertyDetailsReturn {
  /** Whether property details are currently being fetched */
  isLoading: boolean;
  /** The selected property with detailed information */
  selectedProperty: Property | null;
  /** Function to fetch and set property details */
  fetchPropertyDetails: (property: Property) => Promise<void>;
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

  const fetchPropertyDetails = useCallback(async (property: Property) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await searchApi.getProperty({
        address: property.address
      });
      
      console.log("🔍 [USE_PROPERTY_DETAILS] Full API response:", response);
      
      // The backend returns property data in response.data, not response.property
      const detailedPropertyData = response.data || {};
      
      console.log("🔍 [USE_PROPERTY_DETAILS] Detailed property data:", detailedPropertyData);

      const enhancedProperty = {
        ...property,
        ...detailedPropertyData, // Merge detailed data with existing property data
        // Also include additional response fields
        commute_data: response.commute_data,
        property_analysis: response.property_analysis,
        image_features: response.image_features,
        zillow_url: response.zillow_url,
        images: response.images,
        features: response.features,
      };
      
      console.log("🔍 [USE_PROPERTY_DETAILS] Enhanced property for modal:", enhancedProperty);
      setSelectedProperty(enhancedProperty);
    } catch (error) {
      console.error("❌ [USE_PROPERTY_DETAILS] Error fetching property details:", error);
      console.error("❌ [USE_PROPERTY_DETAILS] Error type:", typeof error);
      console.error("❌ [USE_PROPERTY_DETAILS] Error message:", (error as Error).message);

      const errorMessage = (error as Error).message || 'Failed to fetch property details';
      setError(errorMessage);

      // Fallback: use the original property data without detailed information
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
