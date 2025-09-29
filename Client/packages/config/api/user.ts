import type { SavedHome } from "../../schemas";
import { apiGet, apiPost } from "../../services/http/compatibility";

// Types for user API
export type User = {
  id: string;
  cognito_id: string;
  email: string;
  name: string;
  phone?: string;
  created_at: string;
  updated_at?: string;
  is_active: boolean;
  is_agent?: boolean;
  client_ids?: string[];
  agency_name?: string;
  has_subscription?: boolean;
  subscription?: unknown;
  has_preferences?: boolean;
};

export type UserResponse = {
  success: boolean;
  user?: User;
  data?: User; // Backend sometimes returns user data in 'data' field
  message?: string;
  error?: string;
};

export type FavoriteHomesResponse = {
  success: boolean;
  favorites?: string[];
  homes?: SavedHome[];
  message?: string;
  error?: string;
};

export type AddFavoriteRequest = {
  home: unknown;
};

export type RemoveFavoriteRequest = {
  address: string;
};

/**
 * User API client using centralized utilities
 */
export const userApi = {
  /**
   * Get current user profile
   */
  getProfile: (): Promise<UserResponse> =>
    apiGet<UserResponse>("/api/v1/user/profile"),

  /**
   * Update user profile - Note: Backend endpoint not implemented yet
   */
  updateProfile: (_userData: Partial<User>): Promise<UserResponse> => {
    console.warn("User profile update endpoint not implemented on backend");
    return Promise.reject(new Error("Profile update not available"));
  },

  /**
   * Get user's favorite homes
   */
  getFavoriteHomes: (): Promise<FavoriteHomesResponse> =>
    apiGet<FavoriteHomesResponse>("/api/v1/user/favorite-homes"),

  /**
   * Add a home to favorites
   */
  addFavoriteHome: (data: AddFavoriteRequest): Promise<FavoriteHomesResponse> =>
    apiPost<FavoriteHomesResponse>("/api/v1/user/favorite-homes/add", data),

  /**
   * Remove a home from favorites
   */
  removeFavoriteHome: (
    data: RemoveFavoriteRequest,
  ): Promise<FavoriteHomesResponse> =>
    apiPost<FavoriteHomesResponse>("/api/v1/user/favorite-homes/remove", data),

  /**
   * Get assigned agent for current user
   */
  getAssignedAgent: (): Promise<{
    success: boolean;
    data?: unknown;
    message?: string;
  }> =>
    apiGet<{ success: boolean; data?: unknown; message?: string }>(
      "/api/v1/user/assigned-agent",
    ),

  /**
   * Get client list for agents
   */
  getClientList: (): Promise<{
    success: boolean;
    clients?: unknown[];
    message?: string;
  }> =>
    apiGet<{ success: boolean; clients?: unknown[]; message?: string }>(
      "/api/v1/agent/clients",
    ),

  /**
   * Search for agents
   */
  searchAgents: (
    query: string,
  ): Promise<{ success: boolean; agents?: unknown[]; message?: string }> =>
    apiGet<{ success: boolean; agents?: unknown[]; message?: string }>(
      `/api/v1/user/search-agents?q=${encodeURIComponent(query)}`,
    ),

  /**
   * Assign an agent to current user
   */
  assignAgent: (
    agentId: string,
  ): Promise<{ success: boolean; agent?: unknown; message?: string }> =>
    apiPost<{ success: boolean; agent?: unknown; message?: string }>(
      "/api/v1/user/assign-agent",
      {
        agent_id: agentId,
      },
    ),

  /**
   * Remove assigned agent from current user
   */
  removeAgent: (): Promise<{ success: boolean; message?: string }> =>
    apiPost<{ success: boolean; message?: string }>(
      "/api/v1/user/remove-agent",
      {},
    ),

  /**
   * Delete user account - Note: Backend endpoint not implemented yet
   */
  deleteAccount: (): Promise<UserResponse> => {
    console.warn("User account deletion endpoint not implemented on backend");
    return Promise.reject(new Error("Account deletion not available"));
  },
};
