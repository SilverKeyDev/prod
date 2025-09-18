import { searchApi } from '../../../core/config/api/search';
import type { 
  PropertyCompsRequest,
  PropertyCompsResponse,
  PropertyRequest,
  PropertyResponse
} from '../../../core/config/api/search';
import type { IsochroneData } from '../../../core/schemas/search';

/**
 * Simplified service class for search-related API operations
 * Provides a clean interface to search APIs without complex caching
 */
export class SearchService {
  private static instance: SearchService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  /**
   * Get isochrone data based on user preferences
   */
  public async getIsochrone(): Promise<IsochroneData> {
    try {
      console.log('🗺️ [SEARCH_SERVICE] Fetching isochrone data...');
      
      const response = await searchApi.getIsochrone();

      if (!response.success) {
        throw new Error(response.error ?? 'Failed to fetch isochrone data');
      }

      // Return the original API response structure that the renderer expects
      const isochroneData: IsochroneData = {
        isochrone: response.data?.isochrone,
        individual_isochrones: response.data?.individual_isochrones,
        center: response.data?.center,
        locations: response.data?.locations,
        commute_tolerance: response.data?.commute_tolerance,
        mode: response.data?.mode,
        // Legacy compatibility fields
        polygon: response.data?.isochrone?.geometry?.coordinates?.[0]?.map((coord: number[]) => ({
          lat: coord[1],
          lng: coord[0]
        })) ?? []
      };

      console.log('✅ [SEARCH_SERVICE] Isochrone data fetched successfully');
      return isochroneData;
    } catch (error) {
      console.error('❌ [SEARCH_SERVICE] Error fetching isochrone data:', error);
      throw error;
    }
  }

  /**
   * Get property comparables
   */
  public async getPropertyComps(params: PropertyCompsRequest): Promise<PropertyCompsResponse> {
    try {
      console.log('🏠 [SEARCH_SERVICE] Fetching property comparables...', params);
      
      const response = await searchApi.getPropertyComps(params);

      console.log('✅ [SEARCH_SERVICE] Property comparables fetched successfully');
      return response;
    } catch (error) {
      console.error('❌ [SEARCH_SERVICE] Error fetching property comparables:', error);
      throw error;
    }
  }

  /**
   * Search properties by polygon (regular)
   */
  public async searchByPolygon(params: { user_preferences: any; perBucketPages?: number }): Promise<any> {
    const requestId = `poly_${Date.now()}`;
    const startTime = Date.now();
    
    try {
      console.log(`🔍 [SEARCH_SERVICE] ${requestId} - Starting polygon search...`, {
        params: {
          perBucketPages: params.perBucketPages,
          user_preferences_summary: {
            home_budget: params.user_preferences?.home_budget,
            preferred_bedrooms: params.user_preferences?.preferred_bedrooms,
            preferred_bathrooms: params.user_preferences?.preferred_bathrooms,
            preferred_housing_type: params.user_preferences?.preferred_housing_type,
            important_locations_count: params.user_preferences?.important_locations?.length || 0
          }
        },
        timestamp: new Date().toISOString()
      });
      
      console.log(`🚀 [SEARCH_SERVICE] ${requestId} - Making API request to /api/v1/search/properties-by-polygon:`, {
        requestBody: params,
        timestamp: new Date().toISOString()
      });
      
      const response = await searchApi.searchByPolygon(params);
      
      const duration = Date.now() - startTime;
      console.log(`✅ [SEARCH_SERVICE] ${requestId} - Polygon search completed successfully:`, {
        success: response.success,
        propertiesCount: response.properties?.length || 0,
        totalCount: response.total_count || 0,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [SEARCH_SERVICE] ${requestId} - Error in polygon search:`, {
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }


  /**
   * Get property details
   */
  public async getPropertyDetails(data: PropertyRequest): Promise<PropertyResponse> {
    try {
      console.log('📋 [SEARCH_SERVICE] Fetching property details...', data);
      
      const response = await searchApi.getProperty(data);

      console.log('✅ [SEARCH_SERVICE] Property details fetched successfully');
      return response;
    } catch (error) {
      console.error('❌ [SEARCH_SERVICE] Error fetching property details:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const searchService = SearchService.getInstance();
