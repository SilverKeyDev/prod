import { log, LOG_CATEGORIES } from "packages/logger";
import { apiGet, apiPost, apiPut, apiUpload } from "packages/services/http/compatibility";

import type {
  AddFavoriteRequest,
  AddNotInterestedRequest,
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
    // #region agent log
    // eslint-disable-next-line no-restricted-globals -- debug NDJSON ingest (session 244579)
    fetch("http://127.0.0.1:7449/ingest/62a2c70d-285c-439c-8ad0-211f81794197", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "244579",
      },
      body: JSON.stringify({
        sessionId: "244579",
        location: "homeauth/api/user.ts:uploadProfilePicture",
        message: "upload response",
        data: {
          success: Boolean(res.success),
          hasTopUrl: Boolean(res.profile_picture_url),
          hasNestedUrl: Boolean(res.data?.profile_picture_url),
          topUrlLen: res.profile_picture_url?.length ?? 0,
        },
        timestamp: Date.now(),
        hypothesisId: "E",
      }),
    }).catch(() => {});
    // #endregion
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
      log.error(LOG_CATEGORIES.API, "User profile validation failed", { paths });
      const msg = parsed.error.errors.map((e) => e.message).join("; ");
      throw new Error(`User profile validation failed: ${msg}`);
    }
    // #region agent log
    {
      const inner = parsed.data.user ?? parsed.data.data;
      // eslint-disable-next-line no-restricted-globals -- debug NDJSON ingest (session 244579)
      fetch("http://127.0.0.1:7449/ingest/62a2c70d-285c-439c-8ad0-211f81794197", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "244579",
        },
        body: JSON.stringify({
          sessionId: "244579",
          location: "homeauth/api/user.ts:getProfile",
          message: "profile API parsed",
          data: {
            hasInner: inner != null,
            hasPictureKey: Boolean(inner?.profile_picture),
            hasPictureUrl: Boolean(inner?.profile_picture_url),
            pictureUrlLen: inner?.profile_picture_url?.length ?? 0,
          },
          timestamp: Date.now(),
          hypothesisId: "D",
        }),
      }).catch(() => {});
    }
    // #endregion
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
  addFavoriteHome: (data: AddFavoriteRequest): Promise<FavoriteHomesResponse> =>
    apiPost<FavoriteHomesResponse>("/api/v1/user/favorite-homes/add", data),

  /**
   * Remove a home from favorites
   */
  removeFavoriteHome: (data: RemoveFavoriteRequest): Promise<FavoriteHomesResponse> =>
    apiPost<FavoriteHomesResponse>("/api/v1/user/favorite-homes/remove", data),

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
   * Delete user account - Note: Backend endpoint not implemented yet
   */
  deleteAccount: (): Promise<UserResponse> => {
    log.warn(LOG_CATEGORIES.API, "User account deletion endpoint not implemented on backend");
    return Promise.reject(new Error("Account deletion not available"));
  },
};
