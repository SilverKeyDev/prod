import { useCallback } from "react";

import { getEnv } from "packages/config";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useNavigation } from "packages/navigation";
import { dateNow } from "packages/utils/date";

import type { SearchResult } from "@/features/search/types";

export type UseSearchPageHandlersParams = {
  activeTab: "results" | "saved";
  currentPage: number;
  filteredSearchResults: SearchResult[];
  savedHomes: SearchResult[];
  setCurrentPage: (page: number) => void;
  selectedPropertyId: string | undefined;
  setAnchor: (anchor: { listingId: string }) => void;
  fetchPropertyDetails: (property: unknown) => Promise<void>;
};

export function useSearchPageHandlers({
  activeTab,
  filteredSearchResults,
  savedHomes,
  setCurrentPage,
  selectedPropertyId,
  setAnchor,
  fetchPropertyDetails,
  currentPage,
}: UseSearchPageHandlersParams) {
  const handleViewPropertyDetails = useCallback(
    async (property: SearchResult) => {
      const isDev = getEnv().isDevelopment;
      log.debug(LOG_CATEGORIES.SEARCH, "handleViewPropertyDetails called", {
        environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
        propertyId: property.id,
        address: property.address?.substring(0, 30) + "...",
        timestamp: dateNow().toISOString(),
      });

      const propertyForDetails = {
        ...property,
        latitude: property.lat,
        longitude: property.lng,
        property_type: property.propertyType ?? "Unknown",
        listing_status: "active",
      };

      try {
        log.debug(LOG_CATEGORIES.SEARCH, "Calling fetchPropertyDetails", {
          environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
          propertyId: propertyForDetails.id,
          timestamp: dateNow().toISOString(),
        });

        await fetchPropertyDetails(propertyForDetails);

        log.debug(LOG_CATEGORIES.SEARCH, "fetchPropertyDetails completed successfully", {
          environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
          propertyId: propertyForDetails.id,
          timestamp: dateNow().toISOString(),
        });
      } catch (error) {
        log.error(LOG_CATEGORIES.ERRORS, "Failed to fetch property details", {
          environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
          propertyId: property.id,
          error: error instanceof Error ? error.message : String(error),
          timestamp: dateNow().toISOString(),
        });
        throw error;
      }
    },
    [fetchPropertyDetails]
  );

  const handleNavigateToProperty = useCallback(
    (property: SearchResult) => {
      const currentData = activeTab === "results" ? filteredSearchResults : savedHomes;
      const propertyIndex = currentData.findIndex((p) => p.id === property.id);

      if (propertyIndex !== -1) {
        setCurrentPage(propertyIndex);
      } else {
        log.error(LOG_CATEGORIES.SEARCH, "Property not found in current data", {
          propertyId: property.id,
          activeTab,
          searchResultsCount: filteredSearchResults.length,
          savedHomesCount: savedHomes.length,
          timestamp: dateNow().toISOString(),
        });
      }
    },
    [activeTab, filteredSearchResults, savedHomes, setCurrentPage]
  );

  const handleOpenPropertyDetails = useCallback(
    (propertyId: string) => {
      const currentData = activeTab === "results" ? filteredSearchResults : savedHomes;
      const property = currentData.find((p) => p.id === propertyId);

      if (property) {
        void handleViewPropertyDetails(property);
      } else {
        log.error(LOG_CATEGORIES.SEARCH, "MAP MODAL: Property not found with ID", {
          propertyId,
          availableProperties: currentData.map((p) => ({
            id: p.id,
            address: p.address,
          })),
        });
      }
    },
    [activeTab, filteredSearchResults, savedHomes, handleViewPropertyDetails]
  );

  const handleBeforeSwitchToReels = useCallback(() => {
    const currentData = activeTab === "results" ? filteredSearchResults : savedHomes;
    const currentItem = currentData[currentPage];
    const firstItem = currentData[0];
    const listingId = selectedPropertyId ?? currentItem?.id ?? firstItem?.id;
    if (listingId) {
      setAnchor({ listingId });
    }
  }, [activeTab, currentPage, filteredSearchResults, savedHomes, selectedPropertyId, setAnchor]);

  return {
    handleViewPropertyDetails,
    handleNavigateToProperty,
    handleOpenPropertyDetails,
    handleBeforeSwitchToReels,
  };
}
