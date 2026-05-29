import { apiGet } from "packages/services/http";
import type { components } from "packages/types/api.generated";

// Re-export type from generated schema
export type MapsScriptResponse = components["schemas"]["MapsScriptResponse"];

/**
 * Maps API client using centralized utilities
 */
export const mapsApi = {
  /**
   * Get Google Maps script URL with API key
   */
  getScriptUrl: (): Promise<MapsScriptResponse> => apiGet<MapsScriptResponse>("/api/maps/script"),
};
