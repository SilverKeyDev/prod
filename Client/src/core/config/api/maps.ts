import { apiGet } from '../../services/http/compatibility';

// Types for maps API
export type MapsScriptResponse = {
  success: boolean;
  script_url?: string;
  error?: string;
};

/**
 * Maps API client using centralized utilities
 */
export const mapsApi = {
  /**
   * Get Google Maps script URL with API key
   */
  getScriptUrl: (): Promise<MapsScriptResponse> => apiGet<MapsScriptResponse>('/api/maps/script'),
};
