/**
 * Isochrone single source: API + UI/legacy shape unified.
 */

export type IsochroneData = {
  // API response structure
  isochrone?: {
    type: string;
    geometry: {
      type: string;
      coordinates: number[][][];
    };
  };
  individual_isochrones?: Array<{
    address: string;
    commute_tolerance?: number;
    name?: string;
    isochrone: unknown;
  }>;
  center?: {
    lat: number;
    lon: number;
    address: string;
    name?: string;
  };
  locations?: Array<{
    address: string;
    commute_tolerance?: number;
    lat?: number | null;
    lng?: number | null;
    name?: string;
  }>;
  commute_tolerance?: number;
  mode?: string;
  // Legacy compatibility
  polygon?: Array<{ lat: number; lng: number }>;
};

export type IsochroneApiResponse = {
  success: boolean;
  data: IsochroneData | null;
  error?: string;
};
