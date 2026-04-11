import type {
  AddFavoriteRequest,
  FavoriteHomesReplaceResponse,
  RemoveFavoriteRequest,
} from "packages/api";
import { authApi, userApi } from "packages/config/http/api";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { AuthenticationError } from "packages/services/http";
import {
  handleAuthenticationError,
  isAuthenticationError,
} from "packages/services/http";
import type { SavedHome } from "packages/types";
import { mapHomeUniversalToSavedHome } from "packages/utils/saved";

/**
 * Map arbitrary property input to AddFavoriteRequest.home payload (FavoriteHomePayload).
 */
const mapToAddFavoriteHomePayload = (
  input: unknown,
): AddFavoriteRequest["home"] => {
  const obj = (input ?? {}) as Record<string, unknown>;
  const getString = (v: unknown, fallback = ""): string =>
    typeof v === "string" ? v : typeof v === "number" ? String(v) : fallback;
  const getInt = (v: unknown, fallback = 0): number => {
    if (typeof v === "number") return Math.round(v);
    if (typeof v === "string") {
      const parsed = parseInt(v.replace(/,/g, ""), 10);
      return isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
  };
  const getFloat = (v: unknown, fallback = 0): number => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const parsed = parseFloat(v.replace(/,/g, ""));
      return isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
  };
  const normalizePrice = (v: unknown): string => {
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    if (typeof v === "string" && v.trim() !== "") {
      let stripped = v.replace(/[$\s]/g, "");
      const dots = (stripped.match(/\./g) || []).length;
      if (dots > 1) {
        stripped = stripped.replace(/\./g, "");
      } else if (
        dots === 1 &&
        /^\d+\.\d{3}$/.test(stripped.replace(/,/g, ""))
      ) {
        stripped = stripped.replace(/\./g, "");
      }
      stripped = stripped.replace(/,/g, "");
      const n = parseFloat(stripped);
      return Number.isFinite(n) ? String(n) : v;
    }
    return "";
  };

  const id = getString(obj.id ?? obj.address ?? obj.home_id);
  const address = getString(obj.address ?? obj.description);
  const price = normalizePrice(obj.price);
  const bedrooms = getInt(obj.bedrooms ?? obj.beds);
  const bathrooms = getInt(obj.bathrooms ?? obj.baths);
  const sqft = getInt(obj.sqft ?? obj.livingArea);
  const lat = getFloat(obj.lat ?? obj.latitude);
  const lng = getFloat(obj.lng ?? obj.longitude);
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
  private async isUserAuthenticated(): Promise<boolean> {
    // Use auth API to check authentication status
    const authCheck = await authApi.verifySession();
    return authCheck.success;
  }

  /**
   * Fetch saved homes data
   */
  public async fetchSavedHomes(): Promise<SavedHome[]> {
    if (!(await this.isUserAuthenticated())) {
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
        log.error(LOG_CATEGORIES.ERRORS, "Failed to fetch saved homes", {
          error: errorMsg,
        });
        throw new Error(errorMsg);
      }
    } catch (error: unknown) {
      if (isAuthenticationError(error)) {
        handleAuthenticationError(error as AuthenticationError);
        throw error;
      }

      log.error(LOG_CATEGORIES.ERRORS, "Error fetching saved homes", error);
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
      const request: AddFavoriteRequest = {
        home: mapToAddFavoriteHomePayload(property),
      };
      const response = await userApi.addFavoriteHome(request);
      if (!response || typeof response !== "object") {
        throw new Error("Invalid API response structure");
      }
      const typedResponse = response as FavoriteHomesReplaceResponse;

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
        log.error(LOG_CATEGORIES.ERRORS, "Failed to save home", {
          error: errorMsg,
        });
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error: unknown) {
      log.error(LOG_CATEGORIES.ERRORS, "Error saving home", error);
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
      const request: RemoveFavoriteRequest = { address };
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
        log.error(LOG_CATEGORIES.ERRORS, "Failed to remove home", {
          error: errorMsg,
        });
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error: unknown) {
      log.error(LOG_CATEGORIES.ERRORS, "Error removing home", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to remove home",
      };
    }
  }
}

// Export singleton instance
export const savedHomesService = SavedHomesService.getInstance();
