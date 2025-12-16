import { useState, useEffect } from "react";
import type { SavedHome } from "../../../../../packages/schemas";
import { searchApi } from "../../../../../packages/config/api";
import type { PropertyDetails } from "./types";

// Helper functions to safely convert unknown values to specific types
const toNumberOrString = (
  value: unknown
): string | number | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "object" && value !== null) return undefined;
  return String(value);
};

const toString = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && value !== null) return undefined;
  return String(value);
};

export function usePropertyComparison(
  isOpen: boolean,
  selectedHomes: SavedHome[]
) {
  const [propertyDetails, setPropertyDetails] = useState<
    Record<string, PropertyDetails>
  >({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    if (!isOpen || selectedHomes.length === 0) {
      // Reset when modal closes
      if (!isOpen) {
        setPropertyDetails({});
        setLoadingStates({});
      }
      return;
    }

    const fetchAllProperties = async () => {
      const fetchPromises = selectedHomes.map(async (home) => {
        const homeId = home.home_id;
        const address = String(home.address || home.description || "");

        setLoadingStates((prev) => ({ ...prev, [homeId]: true }));

        try {
          // Initialize with basic data
          const initialData: PropertyDetails = {
            id: homeId,
            address,
            price: home.price,
            bedrooms: home.bedrooms,
            bathrooms: home.bathrooms,
            sqft: home.sqft,
            lotSize:
              typeof home.lot_size === "string" ? home.lot_size : undefined,
            imageUrl: home.image_url,
          };

          setPropertyDetails((prev) => ({
            ...prev,
            [homeId]: { ...initialData, isLoading: true },
          }));

          // Stream property updates
          for await (const update of searchApi.streamProperty({ address })) {
            if (update.type === "error") {
              const errorData = update.data as {
                error?: string;
                message?: string;
                details?: string;
                status_code?: number;
              };
              // Prefer details (actual RapidAPI error) over generic error code
              const errorMessage =
                errorData.details ||
                errorData.message ||
                errorData.error ||
                "Unknown error";
              const statusCode = errorData.status_code
                ? ` (${errorData.status_code})`
                : "";
              throw new Error(`${errorMessage}${statusCode}`);
            }

            setPropertyDetails((prev) => {
              const current = prev[homeId] || initialData;
              let updated = { ...current };

              if (update.type === "basic") {
                const basicData = update.data as {
                  data?: Record<string, unknown>;
                  zillow_url?: string;
                };
                if (basicData.data) {
                  const data = basicData.data;
                  const newPrice =
                    toNumberOrString(data.price) ||
                    toNumberOrString(data.listPrice);
                  const newBedrooms =
                    toNumberOrString(data.bedrooms) ||
                    toNumberOrString(data.beds);
                  const newBathrooms =
                    toNumberOrString(data.bathrooms) ||
                    toNumberOrString(data.baths);
                  const newSqft =
                    toNumberOrString(data.sqft) ||
                    toNumberOrString(data.livingArea);
                  const newLotSize =
                    toString(data.lotSize) || toString(data.lotAreaValue);
                  const newYearBuilt = toNumberOrString(data.yearBuilt);
                  const newPropertyType =
                    toString(data.propertyType) || toString(data.homeType);
                  const newHomeType = toString(data.homeType);
                  const newListingStatus = toString(data.listingStatus);

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
                    zillowUrl: basicData.zillow_url || updated.zillowUrl,
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
              } else if (update.type === "images") {
                updated.images = update.data as string[];
              } else if (update.type === "image_features") {
                updated.imageFeatures = update.data;
              } else if (update.type === "features") {
                updated.features = update.data;
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
          console.error(
            `Error fetching property details for ${address}:`,
            error
          );
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

    fetchAllProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedHomes.length]);

  return { propertyDetails, loadingStates };
}

