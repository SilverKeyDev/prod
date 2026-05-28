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

import { apiDelete, apiGet, apiPost } from "packages/services/http/compatibility";
import type { components } from "packages/types/api.generated";

import type { UserPreferences } from "@/features/homeauth/types";

// Re-export types from generated schema
export type PreferencesResponse = components["schemas"]["PreferencesResponse"];
export type ClearPreferencesResponse = components["schemas"]["SuccessResponse"] & {
  has_preferences: false;
  preferences?: unknown;
  message?: string;
};
export type ClientInfo = components["schemas"]["ClientInfo"];
export type ClientsResponse = components["schemas"]["ClientsResponse"];

/**
 * Preferences API client using centralized utilities
 */
export const preferencesApi = {
  /**
   * Create or update user preferences
   */
  createOrUpdate: (preferences: Partial<UserPreferences>): Promise<PreferencesResponse> =>
    apiPost<PreferencesResponse>("/api/v1/preferences", preferences),

  /**
   * Get current user's preferences
   */
  get: (): Promise<PreferencesResponse> => apiGet<PreferencesResponse>("/api/v1/preferences"),

  /**
   * Clear all preference rows for the authenticated user (never affects a client's row).
   */
  clear: (): Promise<ClearPreferencesResponse> =>
    apiDelete<ClearPreferencesResponse>("/api/v1/preferences"),

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
