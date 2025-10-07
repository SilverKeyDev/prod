import { userApi } from "../config/api/user";
import type { SavedHome } from "../schemas";
import type {
  HomeUniversal,
  AddFavoriteHomeRequest,
  RemoveFavoriteHomeRequest,
  FavoriteHomeResponse,
} from "../schemas/api";
import { isObject, isNumber } from "../utils/typeGuards";
import { useAuthStore } from "../store/auth.slice";

import type { AuthenticationError } from "./http";
import { isAuthenticationError, handleAuthenticationError } from "./http";
import { log } from "./security/secureLogger";

/**
 * Map home data to SavedHome format
 */
const mapHomeUniversalToSavedHome = (
  home: HomeUniversal,
  index: number,
): SavedHome => {
  if (!isObject(home)) {
    // Fallback for invalid data
    return {
      home_id: `home_${index}_${Date.now()}`,
      description: "",
      address: "",
      price: "",
      bedrooms: 0,
      bathrooms: 0,
      sqft: 0,
      lot_size: "",
      image_url: undefined,
      lat: 0,
      lng: 0,
    };
  }

  return {
    home_id: home.address || `home_${index}_${Date.now()}`,
    description: home.address || "",
    address: home.address || "",
    price: home.price || "",
    bedrooms: isNumber(home.beds) ? home.beds : 0,
    bathrooms: isNumber(home.baths) ? home.baths : 0,
    sqft: isNumber(home.sqft) ? home.sqft : 0,
    lot_size: home.lot_size || "",
    image_url: home.image_url,
    lat: home.lat,
    lng: home.lng,
  };
};

/**
 * Map arbitrary property input to AddFavoriteHomeRequest.home payload
 */
const mapToAddFavoriteHomePayload = (
  input: unknown,
): AddFavoriteHomeRequest["home"] => {
  const obj = (input ?? {}) as Record<string, unknown>;
  const getString = (v: unknown, fallback = ""): string =>
    typeof v === "string" ? v : typeof v === "number" ? String(v) : fallback;
  const getNumber = (v: unknown, fallback = 0): number => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const parsed = parseInt(v.replace(/,/g, ''), 10);
      return isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
  };

  const id = getString(obj.id ?? obj.address ?? obj.home_id);
  const address = getString(obj.address ?? obj.description);
  const price = getString(obj.price);
  const bedrooms = getNumber(obj.bedrooms ?? obj.beds);
  const bathrooms = getNumber(obj.bathrooms ?? obj.baths);
  const sqft = getNumber(obj.sqft ?? obj.livingArea);
  const lat = getNumber(obj.lat ?? obj.latitude);
  const lng = getNumber(obj.lng ?? obj.longitude);
  const lotSize =
    obj.lotSize !== undefined ? getString(obj.lotSize) : undefined;
  const propertyType = getString(obj.propertyType ?? obj.property_type);
  const listingStatus = getString(obj.listingStatus ?? obj.listing_status);
  const imageUrl =
    obj.imageUrl !== undefined
      ? getString(obj.imageUrl)
      : getString(obj.image_url, undefined as unknown as string);

  return {
    id,
    address,
    price,
    bedrooms,
    bathrooms,
    sqft,
    lat,
    lng,
    ...(lotSize !== undefined ? { lotSize } : {}),
    propertyType,
    listingStatus,
    ...(imageUrl ? { imageUrl } : {}),
  };
};

/**
 * SavedHomes service - I/O only, no state management
 * All state management is now handled by React Query
 */
export class SavedHomesService {
  private static instance: SavedHomesService;

  private constructor() {}

  public static getInstance(): SavedHomesService {
    if (!SavedHomesService.instance) {
      SavedHomesService.instance = new SavedHomesService();
    }
    return SavedHomesService.instance;
  }

  /**
   * Check if user is authenticated
   */
  private isUserAuthenticated(): boolean {
    // Use auth store to check authentication status
    return useAuthStore.getState().isAuthenticated;
  }

  /**
   * Fetch saved homes data
   */
  public async fetchSavedHomes(): Promise<SavedHome[]> {
    if (!this.isUserAuthenticated()) {
      throw new Error("User not authenticated");
    }

    try {
      const response = await userApi.getFavoriteHomes();
      if (!response || typeof response !== "object") {
        throw new Error("Invalid API response structure");
      }

      // Type guard for API response
      const typedResponse = response as Record<string, unknown>;
      if (!("success" in typedResponse)) {
        throw new Error("Invalid API response: missing success field");
      }

      if (
        typedResponse &&
        typeof typedResponse === "object" &&
        "success" in typedResponse &&
        typedResponse.success
      ) {
        const rawHomes =
          typedResponse &&
          typeof typedResponse === "object" &&
          "favorites" in typedResponse &&
          Array.isArray(typedResponse.favorites)
            ? typedResponse.favorites
            : [];
        const homeObjects: SavedHome[] = rawHomes.map(
          mapHomeUniversalToSavedHome,
        );
        return homeObjects;
      } else {
        const errorMsg =
          typedResponse &&
          typeof typedResponse === "object" &&
          "error" in typedResponse &&
          typeof typedResponse.error === "string"
            ? typedResponse.error
            : "Failed to load favorite homes";
        if (log && typeof log.error === "function") {
          log.error("SAVED_HOMES_SERVICE", "Failed to fetch saved homes", {
            error: errorMsg,
          });
        }
        throw new Error(errorMsg);
      }
    } catch (error: unknown) {
      if (isAuthenticationError(error)) {
        handleAuthenticationError(error as AuthenticationError);
        throw error;
      }

      if (log && typeof log.error === "function") {
        log.error("SAVED_HOMES_SERVICE", "Error fetching saved homes", error);
      }
      throw error;
    }
  }

  /**
   * Save a home to favorites
   */
  public async saveHome(
    property: unknown,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const request: AddFavoriteHomeRequest = {
        home: mapToAddFavoriteHomePayload(property),
      };
      const response = await userApi.addFavoriteHome(request);
      if (!response || typeof response !== "object") {
        throw new Error("Invalid API response structure");
      }
      const typedResponse = response as FavoriteHomeResponse;

      if (
        typedResponse &&
        typeof typedResponse === "object" &&
        "success" in typedResponse &&
        typedResponse.success
      ) {
        return { success: true };
      } else {
        const errorMsg =
          typedResponse &&
          typeof typedResponse === "object" &&
          "error" in typedResponse &&
          typeof typedResponse.error === "string"
            ? typedResponse.error
            : "Failed to save home";
        if (log && typeof log.error === "function") {
          log.error("SAVED_HOMES_SERVICE", "Failed to save home", {
            error: errorMsg,
          });
        }
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error: unknown) {
      if (log && typeof log.error === "function") {
        log.error("SAVED_HOMES_SERVICE", "Error saving home", error);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save home",
      };
    }
  }

  /**
   * Remove a home from favorites
   */
  public async removeSavedHome(
    address: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const request: RemoveFavoriteHomeRequest = { address };
      const response = await userApi.removeFavoriteHome(request);
      if (!response || typeof response !== "object") {
        throw new Error("Invalid API response structure");
      }

      // Type guard for API response
      const typedResponse = response as Record<string, unknown>;
      if (!("success" in typedResponse)) {
        throw new Error("Invalid API response: missing success field");
      }

      if (
        typedResponse &&
        typeof typedResponse === "object" &&
        "success" in typedResponse &&
        typedResponse.success
      ) {
        return { success: true };
      } else {
        const errorMsg =
          typedResponse &&
          typeof typedResponse === "object" &&
          "error" in typedResponse &&
          typeof typedResponse.error === "string"
            ? typedResponse.error
            : "Failed to remove home";
        if (log && typeof log.error === "function") {
          log.error("SAVED_HOMES_SERVICE", "Failed to remove home", {
            error: errorMsg,
          });
        }
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error: unknown) {
      if (log && typeof log.error === "function") {
        log.error("SAVED_HOMES_SERVICE", "Error removing home", error);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to remove home",
      };
    }
  }
}

// Export singleton instance
export const savedHomesService = SavedHomesService.getInstance();
