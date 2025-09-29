// External libraries
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Internal API clients
import type { userApi } from "../../../../../packages/config/api/user";
// Internal utilities
import type { SearchResult } from "../../../../../packages/schemas/search";
import type {
  HomeUniversal,
  FavoriteHomesResponse,
  AddFavoriteHomeRequest,
  RemoveFavoriteHomeRequest,
  FavoriteHomeResponse,
} from "../../../../../packages/schemas/api";
import { checkAuthAndRedirect } from "../../../../../packages/utils/auth";

// Internal types

export function useSavedHomes(params: {
  userApi: typeof userApi;
  setFavoriteAddresses: (a: string[]) => void;
  isGoogleMapsLoaded?: boolean;
}): {
  savedHomes: SearchResult[];
  isHomeSaved: (id: string) => boolean;
  saveHome: (p: SearchResult) => Promise<void>;
  removeSavedHome: (id: string) => Promise<void>;
} {
  const navigate = useNavigate();
  const [savedHomes, setSavedHomes] = useState<SearchResult[]>([]);
  const hasLoadedRef = useRef(false);

  // Load saved homes from user's favorite_home_ids on component mount
  useEffect(() => {
    // Prevent multiple API calls
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    const loadSavedHomes = async () => {
      try {
        // Check auth and redirect if no token found
        if (!checkAuthAndRedirect(navigate)) {
          return;
        }

        // Step 2: Call the centralized userApi
        const favoritesData =
          (await params.userApi.getFavoriteHomes()) as FavoriteHomesResponse;

        if (!favoritesData.success) {
          console.error("🏠 API returned success=false:", favoritesData.error);
          return;
        }

        // Step 3: Extract actual saved homes data from API response (backend returns { favorites: HomeUniversal[] })
        const rawHomes = favoritesData.favorites ?? [];

        // Step 4: Convert HomeUniversal objects to SearchResult format (same as UserDashboard)
        if (rawHomes.length > 0) {
          const savedHomesData: SearchResult[] = await Promise.all(
            rawHomes.map(async (home: HomeUniversal, index: number) => {
              const homeData = home;
              let { lat } = homeData;
              let { lng } = homeData;

              // If coordinates are missing, geocode the address (SSR-safe)
              if (!lat || !lng) {
                try {
                  // SSR-safe guard
                  if (typeof window === "undefined") {
                    console.warn(
                      `⚠️ Window not available (SSR), skipping geocoding for ${homeData.address}`,
                    );
                    lat = 33.749; // Atlanta fallback
                    lng = -84.388;
                  } else if (
                    !window.google?.maps ||
                    !params.isGoogleMapsLoaded
                  ) {
                    console.warn(
                      `⚠️ Google Maps API not loaded yet, skipping geocoding for ${homeData.address}`,
                    );
                    lat = 33.749; // Atlanta fallback
                    lng = -84.388;
                  } else {
                    const geocoder = new google.maps.Geocoder();
                    const geocodeResponse = await geocoder.geocode({
                      address: homeData.address,
                    });

                    if (
                      geocodeResponse.results &&
                      geocodeResponse.results.length > 0
                    ) {
                      const { location } = geocodeResponse.results[0].geometry;
                      lat = location.lat();
                      lng = location.lng();
                    } else {
                      console.warn(
                        `⚠️ Could not geocode ${homeData.address}, using fallback coordinates`,
                      );
                      lat = 33.749; // Atlanta fallback
                      lng = -84.388;
                    }
                  }
                } catch (error: unknown) {
                  console.error(
                    `❌ Geocoding error for ${homeData.address}:`,
                    error,
                  );
                  lat = 33.749; // Atlanta fallback
                  lng = -84.388;
                }
              }

              return {
                id: homeData.address ?? `saved_${index + 1}`,
                address: homeData.address ?? "Address not available",
                price: `$${homeData.price?.toLocaleString() ?? "N/A"}`,
                bedrooms: parseInt(homeData.beds ?? "0") ?? 0,
                bathrooms: parseInt(homeData.baths ?? "0") ?? 0,
                sqft: parseInt(homeData.sqft ?? "0") ?? 0,
                lat,
                lng,
                lotSize: homeData.lot_size
                  ? homeData.lot_size.toString()
                  : undefined,
                propertyType: homeData.property_type ?? "SINGLE_FAMILY",
                listingStatus: homeData.listing_status ?? "FOR_SALE",
                imageUrl: homeData.image_url ?? undefined,
              };
            }),
          );

          // Extract addresses for favoriteAddresses state (for compatibility)
          const favoriteAddresses = rawHomes
            .map((home: HomeUniversal) => home.address)
            .filter(Boolean);

          // Update state
          params.setFavoriteAddresses(favoriteAddresses);
          setSavedHomes(savedHomesData);
        }
      } catch (error: unknown) {
        console.error("❌ Error loading saved homes:", error);
      }
    };

    void loadSavedHomes();
  }, []); // Empty dependency array - only run once on mount

  const saveHome = useCallback(
    async (property: SearchResult) => {
      try {
        // Call backend API to add favorite
        const request: AddFavoriteHomeRequest = {
          home: {
            id: property.id,
            address: property.address,
            price: property.price,
            bedrooms: property.bedrooms ?? 0,
            bathrooms: property.bathrooms ?? 0,
            sqft: property.sqft ?? 0,
            lat: property.lat,
            lng: property.lng,
            lotSize: property.lotSize,
            propertyType: property.propertyType ?? "SINGLE_FAMILY",
            listingStatus: property.listingStatus ?? "FOR_SALE",
            imageUrl: property.imageUrl,
          },
        };
        const response = (await params.userApi.addFavoriteHome(
          request,
        )) as FavoriteHomeResponse;
        if (response.success) {
          // Update local state
          const isAlreadySaved = savedHomes.find(
            (home) => home.id === property.id,
          );

          if (!isAlreadySaved) {
            setSavedHomes((prev) => {
              const newSavedHomes = [...prev, property];
              return newSavedHomes;
            });
          }

          // Update favorite addresses from backend response
          if (response.favorites) {
            params.setFavoriteAddresses(response.favorites);
          }
        } else {
          console.error("❌ Backend API returned failure:", response.error);
        }
      } catch (error: unknown) {
        console.error("❌ Error adding favorite:", error);
      }
    },
    [params.userApi, params.setFavoriteAddresses, savedHomes],
  );

  const removeSavedHome = useCallback(
    async (propertyId: string) => {
      try {
        // Find the property to get its address
        const property = savedHomes.find((home) => home.id === propertyId);
        if (!property) {
          console.error(
            "❌ Property not found in local savedHomes state:",
            propertyId,
          );
          return;
        }

        const request: RemoveFavoriteHomeRequest = {
          address: property.address,
        };
        const response = (await params.userApi.removeFavoriteHome(
          request,
        )) as FavoriteHomeResponse;

        if (response.success) {
          // Update local state
          setSavedHomes((prev) => {
            const newSavedHomes = prev.filter((home) => home.id !== propertyId);
            return newSavedHomes;
          });

          // Update favorite addresses from backend response
          if (response.favorites) {
            params.setFavoriteAddresses(response.favorites);
          }
        } else {
          console.error("❌ Backend API returned failure:", response.error);
        }
      } catch (error: unknown) {
        console.error("❌ Error removing favorite:", error);
      }
    },
    [params.userApi, params.setFavoriteAddresses, savedHomes],
  );

  const isHomeSaved = useCallback(
    (propertyId: string): boolean => {
      // Check both local savedHomes and favoriteAddresses from backend
      return savedHomes.some((home) => home.id === propertyId);
    },
    [savedHomes],
  );

  return {
    savedHomes,
    isHomeSaved,
    saveHome,
    removeSavedHome,
  };
}
