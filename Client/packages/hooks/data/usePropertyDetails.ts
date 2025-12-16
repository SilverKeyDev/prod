import { useState, useCallback } from "react";

import { searchApi } from "../../config/api";

export type Property = {
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
  [key: string]: unknown;
};

export type UsePropertyDetailsReturn = {
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
};

/**
 * Custom hook for fetching and managing property details with streaming support
 * Opens modal immediately when basic info arrives, then updates as sections are generated
 */
export function usePropertyDetails(): UsePropertyDetailsReturn {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPropertyDetails = useCallback(
    async (property: Property) => {
      setIsLoading(true);
      setError(null);
      
      // Initialize with basic property info immediately so modal opens
      setSelectedProperty(property);

      try {
        // Stream property updates
        for await (const update of searchApi.streamProperty({
          address: property.address,
        })) {
          if (update.type === "error") {
            const errorData = update.data as {
              error?: string;
              message?: string;
              details?: string;
              status_code?: number;
            };
            
            // Try to parse details as JSON if it looks like JSON
            let errorMessage = errorData.details || errorData.message || errorData.error || "Unknown error";
            if (errorData.details) {
              try {
                const parsed = JSON.parse(errorData.details);
                if (parsed.message) {
                  errorMessage = parsed.message;
                } else if (typeof parsed === "string") {
                  errorMessage = parsed;
                }
              } catch {
                // If parsing fails, use the details as-is
                errorMessage = errorData.details;
              }
            }
            
            const statusCode = errorData.status_code
              ? ` (${errorData.status_code})`
              : "";
            throw new Error(`${errorMessage}${statusCode}`);
          }

          if (update.type === "basic") {
            const basicData = update.data as {
              data?: unknown;
              zillow_url?: string;
            };
            setSelectedProperty((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                ...(basicData.data as Record<string, unknown>),
                zillow_url: basicData.zillow_url,
              };
            });
          } else if (update.type === "commute_data") {
            setSelectedProperty((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                commute_data: update.data,
              };
            });
          } else if (update.type === "property_analysis" || update.type === "property_analysis_partial") {
            setSelectedProperty((prev) => {
              if (!prev) return prev;
              const existingAnalysis = (prev.property_analysis as Record<string, unknown>) || {};
              return {
                ...prev,
                property_analysis: {
                  ...existingAnalysis,
                  ...(update.data as Record<string, unknown>),
                },
              };
            });
          } else if (update.type === "images") {
            setSelectedProperty((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                images: update.data as string[],
              };
            });
          } else if (update.type === "image_features") {
            setSelectedProperty((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                image_features: update.data,
              };
            });
          } else if (update.type === "features") {
            setSelectedProperty((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                features: update.data,
              };
            });
          } else if (update.type === "complete") {
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error(
          "❌ [USE_PROPERTY_DETAILS] Error streaming property details:",
          err,
        );
        setError(err instanceof Error ? err.message : "Failed to fetch property details");
        setIsLoading(false);
        // Keep the property with whatever data we have so far
      }
    },
    [],
  );

  const clearSelectedProperty = useCallback(() => {
    setSelectedProperty(null);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    isLoading,
    selectedProperty,
    fetchPropertyDetails,
    clearSelectedProperty,
    error,
  };
}
