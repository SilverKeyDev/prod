import type { UserPreferences } from "packages/schemas/app/auth/user";
import { apiGet, apiPost } from "packages/services/http/compatibility";

export type PreferencesResponse = {
  success: boolean;
  preferences?: UserPreferences;
  message?: string;
  error?: string;
};

export type ClientInfo = {
  id: string;
  name: string;
  email: string;
  preferences?: UserPreferences;
};

export type ClientsResponse = {
  success: boolean;
  clients?: ClientInfo[];
  message?: string;
  error?: string;
};

/**
 * Preferences API client using centralized utilities
 */
export const preferencesApi = {
  /**
   * Create or update user preferences
   */
  createOrUpdate: (
    preferences: Partial<UserPreferences>,
  ): Promise<PreferencesResponse> =>
    apiPost<PreferencesResponse>("/api/v1/preferences", preferences),

  /**
   * Get current user's preferences
   */
  get: (): Promise<PreferencesResponse> =>
    apiGet<PreferencesResponse>("/api/v1/preferences"),

  /**
   * Get preferences for a specific user by ID (admin/agent only)
   */
  getByUserId: (userId: string): Promise<PreferencesResponse> =>
    apiGet<PreferencesResponse>(`/api/v1/preferences/user/${userId}`),

  /**
   * Get clients and their preferences (agent only)
   */
  getClients: (): Promise<ClientsResponse> =>
    apiGet<ClientsResponse>("/api/v1/preferences/clients"),
};
