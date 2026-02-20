import { useCallback, useState } from "react";

import { log, LOG_CATEGORIES } from "logger";

import { researchApi } from "packages/config/api";

import {
  applyStreamUpdate,
  parseStreamError,
} from "./propertyDetailsStreamHelpers";
import type { Property } from "./propertyDetailsTypes";

export type { Property } from "./propertyDetailsTypes";

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

  const fetchPropertyDetails = useCallback(async (property: Property) => {
    setIsLoading(true);
    setError(null);
    setSelectedProperty(property);
    try {
      for await (const update of researchApi.streamProperty({
        address: property.address,
      })) {
        if (update.type === "error") {
          throw new Error(
            parseStreamError(
              update.data as {
                error?: string;
                message?: string;
                details?: string;
                status_code?: number;
              },
            ),
          );
        }
        applyStreamUpdate(
          update as { type: string; data: unknown },
          setSelectedProperty,
          setIsLoading,
        );
      }
    } catch (err) {
      log.error(LOG_CATEGORIES.SEARCH, "Error streaming property details", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch property details",
      );
      setIsLoading(false);
    }
  }, []);

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
