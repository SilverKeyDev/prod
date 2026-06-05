import { authApi } from "packages/features/homeauth/api/auth";
import { userApi } from "packages/features/homeauth/api/user";
import type {
  AddFavoriteRequest,
  FavoriteHomesReplaceResponse,
  RemoveFavoriteRequest,
} from "packages/features/homeauth/types/auth/user";
import { mapToAddFavoriteHomePayload } from "packages/features/saved/utils/mapToAddFavoriteHomePayload";
import { log } from "packages/logger";
import { handleAuthenticationError, isAuthenticationError } from "packages/services/http/apiErrors";
import type { AuthenticationError } from "packages/services/http/client";
import type { SavedHome } from "packages/types";
import { mapSavedHomeWireToSavedHome } from "packages/utils/transaction/saved";

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
        const homeObjects: SavedHome[] = rawHomes.map((home, index) =>
          mapSavedHomeWireToSavedHome(home, index)
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
        log.error("ERRORS", "Failed to fetch saved homes", {
          error: errorMsg,
        });
        throw new Error(errorMsg);
      }
    } catch (error: unknown) {
      if (isAuthenticationError(error)) {
        handleAuthenticationError(error as AuthenticationError);
        throw error;
      }

      log.error("ERRORS", "Error fetching saved homes", error);
      throw error;
    }
  }

  /**
   * Save a home to favorites
   */
  public async saveHome(property: unknown): Promise<{ success: boolean; error?: string }> {
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
        log.error("ERRORS", "Failed to save home", {
          error: errorMsg,
        });
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error: unknown) {
      log.error("ERRORS", "Error saving home", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save home",
      };
    }
  }

  /**
   * Remove a home from favorites
   */
  public async removeSavedHome(address: string): Promise<{ success: boolean; error?: string }> {
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
        log.error("ERRORS", "Failed to remove home", {
          error: errorMsg,
        });
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error: unknown) {
      log.error("ERRORS", "Error removing home", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to remove home",
      };
    }
  }
}

// Export singleton instance
export const savedHomesService = SavedHomesService.getInstance();
