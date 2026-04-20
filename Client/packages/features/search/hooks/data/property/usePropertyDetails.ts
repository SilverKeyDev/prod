import { useCallback, useState } from "react";

import { useIsAgent } from "packages/hooks/store";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useAgentDashboardStore } from "packages/store";
import { type ResearchListingKeyInput, researchListingZpid } from "packages/utils/property";

import type { PropertyRequest } from "@/features/search/api/research";
import { researchApi } from "@/features/search/api/research";

import { applyStreamUpdate, parseStreamError } from "./propertyDetailsStreamHelpers";
import type { Property } from "./propertyDetailsTypes";

export type { Property } from "./propertyDetailsTypes";
export { researchListingZpid } from "packages/utils/property";

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
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAgent = useIsAgent();
  const selectedClientId = useAgentDashboardStore((s) => s.selectedClientId);

  const fetchPropertyDetails = useCallback(
    async (property: Property) => {
      setIsLoading(true);
      setError(null);
      setSelectedProperty(property);
      try {
        const zpid = researchListingZpid(property as ResearchListingKeyInput);
        const payload: PropertyRequest = {
          address: property.address,
          ...(zpid ? { zpid } : {}),
        };
        if (isAgent && selectedClientId) {
          payload.preferences_user_id = selectedClientId;
        }
        for await (const update of researchApi.streamProperty(payload)) {
          if (update.type === "error") {
            throw new Error(
              parseStreamError(
                update.data as {
                  error?: string;
                  message?: string;
                  details?: string;
                  status_code?: number;
                }
              )
            );
          }
          applyStreamUpdate(
            update as { type: string; data: unknown },
            setSelectedProperty,
            setIsLoading
          );
        }
      } catch (err) {
        log.error(LOG_CATEGORIES.SEARCH, "Error streaming property details", err);
        setError(err instanceof Error ? err.message : "Failed to fetch property details");
        setIsLoading(false);
      }
    },
    [isAgent, selectedClientId]
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
