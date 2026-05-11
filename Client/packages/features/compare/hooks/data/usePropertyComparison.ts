import { useEffect, useRef, useState } from "react";

import type { CompareHomesPropertyDetails } from "packages/features/compare/types/compareHomes";
import { useIsAgent } from "packages/hooks/store";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useAgentDashboardStore } from "packages/store";
import { unknownToNumberOrString, unknownToString } from "packages/utils/typeGuards";

import type { PropertyRequest } from "@/features/search/api/research";
import { researchApi } from "@/features/search/api/research";
import type { SavedHome } from "@/features/search/types/domain/property";

export function usePropertyComparison(isOpen: boolean, selectedHomes: SavedHome[]) {
  const [propertyDetails, setPropertyDetails] = useState<
    Record<string, CompareHomesPropertyDetails>
  >({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const isAgent = useIsAgent();
  const selectedClientId = useAgentDashboardStore((s) => s.selectedClientId);

  const selectedHomesKey = selectedHomes
    .map((home) => {
      const address = String(home.address || home.description || "");
      return `${home.home_id}:${address}`;
    })
    .join("|");

  const selectedHomesRef = useRef(selectedHomes);
  useEffect(() => {
    selectedHomesRef.current = selectedHomes;
  }, [selectedHomesKey, selectedHomes]);

  useEffect(() => {
    const homes = selectedHomesRef.current;
    if (!isOpen || homes.length === 0) {
      if (!isOpen) {
        setPropertyDetails({});
        setLoadingStates({});
      }
      return;
    }

    let cancelled = false;

    const fetchAllProperties = async () => {
      const fetchPromises = homes.map(async (home) => {
        const homeId = home.home_id;
        const address = String(home.address || home.description || "");

        setLoadingStates((prev) => ({ ...prev, [homeId]: true }));

        try {
          const initialData: CompareHomesPropertyDetails = {
            id: homeId,
            address,
            price: home.price,
            bedrooms: home.bedrooms,
            bathrooms: home.bathrooms,
            sqft: home.sqft,
            lotSize: typeof home.lot_size === "string" ? home.lot_size : undefined,
            imageUrl: home.image_url,
          };

          setPropertyDetails((prev) => ({
            ...prev,
            [homeId]: { ...initialData, isLoading: true },
          }));

          const comparePayload: PropertyRequest = { address };
          if (isAgent && selectedClientId) {
            comparePayload.preferences_user_id = selectedClientId;
          }
          for await (const update of researchApi.streamCompare(comparePayload)) {
            if (cancelled) return;

            if (update.type === "error") {
              const errorData = update.data as {
                error?: string;
                message?: string;
                details?: string;
                status_code?: number;
              };
              const errorMessage =
                errorData.details || errorData.message || errorData.error || "Unknown error";
              const statusCode = errorData.status_code ? ` (${errorData.status_code})` : "";
              throw new Error(`${errorMessage}${statusCode}`);
            }

            setPropertyDetails((prev) => {
              const current = prev[homeId] || initialData;
              let updated: CompareHomesPropertyDetails = { ...current };

              if (update.type === "basic") {
                const basicData = update.data as {
                  data?: Record<string, unknown>;
                };
                if (basicData.data) {
                  const data = basicData.data;
                  const newPrice =
                    unknownToNumberOrString(data.price) || unknownToNumberOrString(data.listPrice);
                  const newBedrooms =
                    unknownToNumberOrString(data.bedrooms) || unknownToNumberOrString(data.beds);
                  const newBathrooms =
                    unknownToNumberOrString(data.bathrooms) || unknownToNumberOrString(data.baths);
                  const newSqft =
                    unknownToNumberOrString(data.sqft) || unknownToNumberOrString(data.livingArea);
                  const newLotSize =
                    unknownToString(data.lotSize) || unknownToString(data.lotAreaValue);
                  const newYearBuilt = unknownToNumberOrString(data.yearBuilt);
                  const newPropertyType =
                    unknownToString(data.propertyType) || unknownToString(data.homeType);
                  const newHomeType = unknownToString(data.homeType);
                  const newListingStatus = unknownToString(data.listingStatus);

                  updated = {
                    ...updated,
                    price: newPrice ?? updated.price,
                    bedrooms: newBedrooms ?? updated.bedrooms,
                    bathrooms: newBathrooms ?? updated.bathrooms,
                    sqft: newSqft ?? updated.sqft,
                    lotSize: newLotSize ?? updated.lotSize,
                    yearBuilt: newYearBuilt ?? updated.yearBuilt,
                    propertyType: newPropertyType ?? updated.propertyType,
                    homeType: newHomeType ?? updated.homeType,
                    listingStatus: newListingStatus ?? updated.listingStatus,
                  };
                }
              } else if (update.type === "commute_data") {
                updated.commuteData = update.data;
              } else if (
                update.type === "property_analysis" ||
                update.type === "property_analysis_partial"
              ) {
                const existingAnalysis =
                  (updated.propertyAnalysis as Record<string, unknown>) || {};
                updated.propertyAnalysis = {
                  ...existingAnalysis,
                  ...(update.data as Record<string, unknown>),
                };
              } else if (update.type === "property_analysis_section") {
                const existingAnalysis =
                  (updated.propertyAnalysis as Record<string, unknown>) || {};
                updated.propertyAnalysis = {
                  ...existingAnalysis,
                  ...(update.data as Record<string, unknown>),
                };
              } else if (update.type === "images") {
                updated.images = update.data as string[];
              } else if (update.type === "image_features") {
                updated.imageFeatures = update.data;
              } else if (update.type === "features") {
                updated.features = update.data;
              } else if (update.type === "combined_features") {
                updated.combinedFeatures = update.data as {
                  combined_features: string[];
                  preferred_overlap: string[];
                  dealbreaker_overlap: string[];
                };
              } else if (update.type === "complete") {
                updated.isLoading = false;
              }

              return {
                ...prev,
                [homeId]: updated,
              };
            });
          }

          setLoadingStates((prev) => ({ ...prev, [homeId]: false }));
        } catch (error) {
          log.error(LOG_CATEGORIES.SEARCH, "Error fetching property details", {
            address,
            error,
          });
          setPropertyDetails((prev) => ({
            ...prev,
            [homeId]: {
              ...(prev[homeId] || {
                id: homeId,
                address,
                price: home.price,
                bedrooms: home.bedrooms,
                bathrooms: home.bathrooms,
                sqft: home.sqft,
                imageUrl: home.image_url,
              }),
              isLoading: false,
              error: error instanceof Error ? error.message : "Failed to fetch",
            },
          }));
          setLoadingStates((prev) => ({ ...prev, [homeId]: false }));
        }
      });

      await Promise.all(fetchPromises);
    };

    void fetchAllProperties();
    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedHomesKey, isAgent, selectedClientId]);

  return { propertyDetails, loadingStates };
}
