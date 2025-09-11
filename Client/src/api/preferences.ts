import { apiGet, apiPost } from "./utils/index";
import { UserPreferences } from "../types";

export interface PreferencesResponse {
  success: boolean;
  preferences?: UserPreferences;
  message?: string;
  error?: string;
}

export interface ClientInfo {
  id: string;
  name: string;
  email: string;
  preferences?: UserPreferences;
}

export interface ClientsResponse {
  success: boolean;
  clients?: ClientInfo[];
  message?: string;
  error?: string;
}

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
