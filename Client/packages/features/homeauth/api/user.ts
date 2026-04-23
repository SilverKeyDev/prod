/**
 * MIGRATION SHIM (DO NOT ADD NEW TYPES HERE)
 *
 * This file re-exports types from the generated API contract (api.generated.ts).
 * All type definitions have been moved to openapi.yaml.
 *
 * To add/modify API types:
 * 1. Edit openapi.yaml
 * 2. Run `pnpm generate:api-types`
 * 3. Types will be auto-generated in packages/types/api.generated.ts
 *
 * This shim maintains backward compatibility for existing imports.
 */

import { log, LOG_CATEGORIES } from "packages/logger";
import { apiGet, apiPost, apiPut, apiUpload } from "packages/services/http/compatibility";

import type {
  AddFavoriteRequest,
  AddNotInterestedRequest,
  FavoriteHomesReplaceResponse,
  FavoriteHomesResponse,
  NotInterestedHomesResponse,
  RemoveFavoriteRequest,
  RemoveNotInterestedRequest,
  UpdateNotInterestedRequest,
  User,
  UserResponse,
} from "@/features/homeauth/types/auth/user";
import { userResponseSchema } from "@/features/homeauth/types/auth/userSchema";

export type {
  AddFavoriteRequest,
  AddNotInterestedRequest,
  FavoriteHomesReplaceResponse,
  FavoriteHomesResponse,
  NotInterestedHomesResponse,
  RemoveFavoriteRequest,
  RemoveNotInterestedRequest,
  UpdateNotInterestedRequest,
  User,
  UserResponse,
};

/**
 * User API client using centralized utilities
 */
export const userApi = {
  /**
   * Upload profile picture. Returns presigned URL on success.
   */
  uploadProfilePicture: async (
    file: File
  ): Promise<{
    success: boolean;
    profile_picture_url?: string;
    data?: { profile_picture?: string; profile_picture_url?: string };
    error?: string;
  }> => {
    const formData = new FormData();
    formData.append("file", file);
    type UploadRes = {
      success: boolean;
      profile_picture_url?: string;
      data?: { profile_picture?: string; profile_picture_url?: string };
      error?: string;
    };
    const res = await apiUpload<UploadRes>("/api/v1/user/profile-picture", formData);
    return res;
  },

  /**
   * Get current user profile (validated at boundary with zod)
   */
  getProfile: async (): Promise<UserResponse> => {
    const raw = await apiGet<unknown>("/api/v1/user/profile");
    const parsed = userResponseSchema.safeParse(raw);
    if (!parsed.success) {
      const paths = parsed.error.errors.map((e) => e.path.join("."));
      log.error(LOG_CATEGORIES.API, "User profile validation failed", {
        paths,
      });
      const msg = parsed.error.errors.map((e) => e.message).join("; ");
      throw new Error(`User profile validation failed: ${msg}`);
    }
    return parsed.data;
  },

  /**
   * Update user profile - Note: Backend endpoint not implemented yet
   */
  updateProfile: (_userData: Partial<User>): Promise<UserResponse> => {
    log.warn(LOG_CATEGORIES.API, "User profile update endpoint not implemented on backend");
    return Promise.reject(new Error("Profile update not available"));
  },

  /**
   * Get user's favorite homes
   * @param clientId - Optional client ID for agents to view client's saved homes
   */
  getFavoriteHomes: (clientId?: string): Promise<FavoriteHomesResponse> => {
    const params = clientId ? `?client_id=${encodeURIComponent(clientId)}` : "";
    return apiGet<FavoriteHomesResponse>(`/api/v1/user/favorite-homes${params}`);
  },

  /**
   * Add a home to favorites
   */
  addFavoriteHome: (data: AddFavoriteRequest): Promise<FavoriteHomesReplaceResponse> =>
    apiPost<FavoriteHomesReplaceResponse>("/api/v1/user/favorite-homes/add", data),

  /**
   * Remove a home from favorites
   */
  removeFavoriteHome: (data: RemoveFavoriteRequest): Promise<FavoriteHomesReplaceResponse> =>
    apiPost<FavoriteHomesReplaceResponse>("/api/v1/user/favorite-homes/remove", data),

  /**
   * Get user's not-interested homes
   */
  getNotInterestedHomes: (): Promise<NotInterestedHomesResponse> =>
    apiGet<NotInterestedHomesResponse>("/api/v1/user/not-interested-homes"),

  /**
   * Mark a home as not interested
   */
  addNotInterestedHome: (data: AddNotInterestedRequest): Promise<FavoriteHomesResponse> =>
    apiPost<FavoriteHomesResponse>("/api/v1/user/not-interested-homes/add", data),

  /**
   * Remove a home from not-interested list (undo)
   */
  removeNotInterestedHome: (data: RemoveNotInterestedRequest): Promise<FavoriteHomesResponse> =>
    apiPost<FavoriteHomesResponse>("/api/v1/user/not-interested-homes/remove", data),

  /**
   * Update the reason for a not-interested home
   */
  updateNotInterestedHome: (data: UpdateNotInterestedRequest): Promise<FavoriteHomesResponse> =>
    apiPost<FavoriteHomesResponse>("/api/v1/user/not-interested-homes/update", data),

  /**
   * Get assigned agent for current user
   */
  getAssignedAgent: (): Promise<{
    success: boolean;
    data?: unknown;
    message?: string;
  }> =>
    apiGet<{ success: boolean; data?: unknown; message?: string }>("/api/v1/user/assigned-agent"),

  /**
   * Search for agents
   */
  searchAgents: (
    query: string
  ): Promise<{ success: boolean; agents?: unknown[]; message?: string }> =>
    apiGet<{ success: boolean; agents?: unknown[]; message?: string }>(
      `/api/v1/user/search-agents?q=${encodeURIComponent(query)}`
    ),

  /**
   * Assign an agent to current user
   */
  assignAgent: (
    agentId: string
  ): Promise<{ success: boolean; agent?: unknown; message?: string }> =>
    apiPost<{ success: boolean; agent?: unknown; message?: string }>("/api/v1/user/assign-agent", {
      agent_id: agentId,
    }),

  /**
   * Remove assigned agent from current user
   */
  removeAgent: (): Promise<{ success: boolean; message?: string }> =>
    apiPost<{ success: boolean; message?: string }>("/api/v1/user/remove-agent", {}),

  /**
   * Update user's closing mode status
   */
  updateClosingMode: (
    isClosingMode: boolean
  ): Promise<{
    success: boolean;
    data?: { is_closing_mode: boolean };
    error?: string;
  }> =>
    apiPut<{
      success: boolean;
      data?: { is_closing_mode: boolean };
      error?: string;
    }>("/api/v1/user/closing-mode", { is_closing_mode: isClosingMode }),

  /**
   * Irreversibly delete the current user's account and related data.
   */
  deleteAccount: (): Promise<{
    success: boolean;
    deleted_user_id?: string | null;
    error?: string | null;
    message?: string | null;
  }> => apiPost("/api/v1/user/account/delete", { confirm: true }),

  /**
   * Download a machine-readable export of account-related data (portability request).
   */
  exportUserData: (): Promise<Record<string, unknown>> =>
    apiGet<{ success: boolean; data?: Record<string, unknown> }>("/api/v1/user/data-export").then(
      (res) => {
        if (!res.success || res.data == null) {
          throw new Error("Data export failed");
        }
        return res.data;
      }
    ),
};
