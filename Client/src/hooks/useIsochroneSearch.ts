import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchZillowByPolygon } from '../lib/searchApi';
import { checkAuthAndRedirect, getAuthToken } from '../lib/authUtils';
import { SearchResult, IsochroneData } from '../types/search';
import { useSearchCache } from './useSearchCache';

interface UseIsochroneSearchReturn {
  isochroneData: IsochroneData | null;
  setIsochroneData: (data: IsochroneData | null) => void;
  fetchIsochronePolygon: (onSearchResults?: (results: SearchResult[]) => void) => Promise<void>;
  searchPropertiesInIsochrone: (isochroneData: any) => Promise<SearchResult[]>;
  fetchIsochroneForMapOnly: () => Promise<IsochroneData | null>;
  renderImportantLocationMarkers: (isochroneData: IsochroneData, map: google.maps.Map) => Promise<void>;
}

export function useIsochroneSearch(): UseIsochroneSearchReturn {
  const navigate = useNavigate();
  const [isochroneData, setIsochroneData] = useState<any>(null);
  const { resetAndUpdateSearchCache, deduplicateSearchResults } = useSearchCache();

  const importantMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const fetchIsochroneForMapOnly = useCallback(async (): Promise<IsochroneData | null> => {
    try {
      const cachedData = localStorage.getItem("isochroneCache");
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const cacheAge = Date.now() - parsed.timestamp;
        if (cacheAge < 5 * 60 * 1000) {
          setIsochroneData(parsed.data);
          return parsed.data;
        }
      }

      if (!checkAuthAndRedirect(navigate)) {
        return null;
      }

      const authToken = getAuthToken();
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      
      const response = await fetch(`${apiBaseUrl}/api/v1/search/isochrone`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to fetch isochrone");
      }

      const data = result.data;
      setIsochroneData(data);
      localStorage.setItem("isochroneCache", JSON.stringify({ data, timestamp: Date.now() }));
      return data;
    } catch (error) {
      console.error("❌ Error fetching isochrone for map:", error);
      return null;
    }
  }, [navigate, setIsochroneData]);

  const searchPropertiesInIsochrone = useCallback(async (isochroneData: any): Promise<SearchResult[]> => {
    const searchStartTime = Date.now();
    console.log('🔍 Starting property search in isochrone:', {
      timestamp: new Date().toISOString(),
      hasIsochroneData: !!isochroneData,
      hasGeometry: !!isochroneData?.isochrone?.geometry,
      locationsCount: isochroneData?.locations?.length || 0
    });

    if (!isochroneData?.isochrone?.geometry) {
      console.warn("❌ No isochrone geometry available for property search");
      return [];
    }

    try {
      // Convert isochrone polygon coordinates to LatLng format for search
      const geometry = isochroneData.isochrone.geometry;
      let searchPolygon: { lat: number; lon: number }[] = [];
      
      console.log('📐 Processing isochrone geometry:', {
        geometryType: geometry.type,
        coordinatesLength: geometry.coordinates?.length,
        timestamp: new Date().toISOString()
      });

      if (geometry.type === "Polygon") {
        // Use the outer ring of the polygon
        const coordinates = geometry.coordinates[0];
        searchPolygon = coordinates.map((coord: [number, number]) => ({
          lon: coord[0],
          lat: coord[1],
        }));
        console.log('✅ Processed Polygon geometry:', {
          coordinateCount: searchPolygon.length,
          firstCoord: searchPolygon[0],
          lastCoord: searchPolygon[searchPolygon.length - 1]
        });
      } else if (geometry.type === "MultiPolygon") {
        // Use the first polygon's outer ring
        const coordinates = geometry.coordinates[0][0];
        searchPolygon = coordinates.map((coord: [number, number]) => ({
          lon: coord[0],
          lat: coord[1],
        }));
        console.log('✅ Processed MultiPolygon geometry:', {
          coordinateCount: searchPolygon.length,
          firstCoord: searchPolygon[0],
          lastCoord: searchPolygon[searchPolygon.length - 1]
        });
      } else {
        console.warn("❌ Unsupported geometry type for search:", geometry.type);
        return [];
      }

      // Fetch user preferences for search
      console.log('👤 Fetching user preferences for search...');
      const token = getAuthToken();
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      
      const preferencesResponse = await fetch(`${apiBaseUrl}/api/v1/preferences`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let userPreferences: Record<string, unknown> = {};
      if (preferencesResponse.ok) {
        const preferencesData = await preferencesResponse.json() as { success: boolean; preferences: Record<string, unknown> | null };
        userPreferences = preferencesData.preferences || {};
        console.log('✅ User preferences fetched successfully:', {
          hasPreferences: !!preferencesData.preferences,
          preferenceKeys: Object.keys(userPreferences),
          homeBudget: userPreferences.home_budget,
          preferredBedrooms: userPreferences.preferred_bedrooms
        });
      } else {
        console.warn('⚠️ Failed to fetch user preferences:', {
          status: preferencesResponse.status,
          statusText: preferencesResponse.statusText
        });
      }

      // Map current userPreferences to the searchByCoords format
      const searchUserPreferences = {
        home_budget: (userPreferences.home_budget as number) || 1000000,
        preferred_bedrooms: (userPreferences.preferred_bedrooms as number) || 3,
        preferred_bathrooms: Math.floor(((userPreferences.preferred_bedrooms as number) || 3) / 2) + 1,
        preferred_housing_type: "single_family",
        preferred_home_age: "any",
        preferred_lot_size: "medium",
        preferred_home_features: [],
        deal_breakers: [],
        // Use ALL important_locations from the isochrone response, not just center
        important_locations: isochroneData.locations || [],
      };
      
      console.log('⚙️ Search preferences configured:', {
        homeBudget: searchUserPreferences.home_budget,
        bedrooms: searchUserPreferences.preferred_bedrooms,
        bathrooms: searchUserPreferences.preferred_bathrooms,
        importantLocationsCount: searchUserPreferences.important_locations.length,
        polygonCoordinates: searchPolygon.length
      });

      // Call the Zillow search API with the isochrone polygon
      console.log('🏠 Calling Zillow search API:', {
        polygonPoints: searchPolygon.length,
        statusType: "ForSale",
        perBucketPages: 10,
        maxRetries: 3,
        timestamp: new Date().toISOString()
      });
      
      const searchApiStartTime = Date.now();
      const searchResult = await searchZillowByPolygon({
        polygon: searchPolygon,
        user_preferences: searchUserPreferences,
        status_type: "ForSale",
        perBucketPages: 10,
        maxRetries: 3,
      });
      
      const searchApiDuration = Date.now() - searchApiStartTime;
      console.log('📊 Zillow search API completed:', {
        duration: `${searchApiDuration}ms`,
        hasResult: !!searchResult,
        propertiesCount: searchResult?.properties?.length || 0,
        timestamp: new Date().toISOString()
      });

      if (!searchResult?.properties) {
        console.warn('⚠️ No properties returned from search API:', {
          searchResult: !!searchResult,
          hasProperties: !!searchResult?.properties,
          timestamp: new Date().toISOString()
        });
        return [];
      }

      // Transform Zillow API results to SearchResult format
      console.log('🔄 Transforming search results:', {
        rawPropertiesCount: searchResult.properties.length,
        timestamp: new Date().toISOString()
      });

      // Check first few properties for _score field to understand backend response
      const sampleProps = searchResult.properties.slice(0, 3);
      const scoreAnalysis = sampleProps.map((prop: unknown) => {
        const p = prop as Record<string, unknown>;
        return {
          id: p.zpid || 'unknown',
          hasScore: '_score' in p,
          scoreValue: p._score,
          scoreType: typeof p._score,
          allKeys: Object.keys(p).filter(k => k.includes('score') || k.includes('Score'))
        };
      });
      console.log('📊 Score field analysis for sample properties:', scoreAnalysis);
      
      const transformedResults: SearchResult[] = searchResult.properties
        .filter((prop: unknown) => {
          const property = prop as Record<string, unknown>;
          return property.latitude && property.longitude && property.address;
        })
        .map((property: unknown, index: number) => {
          const prop = property as Record<string, unknown>;
          
          // Enhanced score handling with fallback
          let score: number | undefined;
          if (prop._score !== undefined && prop._score !== null) {
            score = prop._score as number;
          } else if (prop.score !== undefined && prop.score !== null) {
            score = prop.score as number;
          } else if (prop.matchScore !== undefined && prop.matchScore !== null) {
            score = prop.matchScore as number;
          } else {
            // Generate a basic score based on property characteristics as fallback
            const priceScore = prop.price ? Math.min((1000000 / (prop.price as number)) * 50, 100) : 50;
            const bedroomScore = prop.bedrooms ? Math.min((prop.bedrooms as number) * 20, 100) : 50;
            score = Math.round((priceScore + bedroomScore) / 2);
          }

          return {
            id: (prop.zpid as string) || `${Date.now()}-${index}`,
            address: (prop.address as string) || "",
            price: prop.price ? `$${(prop.price as number).toLocaleString()}` : "Price not available",
            bedrooms: (prop.bedrooms as number) || 0,
            bathrooms: (prop.bathrooms as number) || 0,
            sqft: (prop.livingArea as number) || 0,
            lat: (prop.latitude as number) || 0,
            lng: (prop.longitude as number) || 0,
            latitude: (prop.latitude as number) || 0,
            longitude: (prop.longitude as number) || 0,
            lotSize: (prop.lotAreaValue as number) && (prop.lotAreaUnit as string) 
              ? `${prop.lotAreaValue} ${prop.lotAreaUnit}` 
              : undefined,
            propertyType: (prop.propertyType as string) || "Unknown",
            listingStatus: (prop.listingStatus as string) || "For Sale",
            imageUrl: (prop.imgSrc as string) || undefined,
            _score: score, // Use enhanced score with fallback
            zpid: parseInt((prop.zpid as string)) || undefined,
            streetAddress: (prop.streetAddress as string) || undefined,
            city: (prop.city as string) || undefined,
            state: (prop.state as string) || undefined,
            zipcode: (prop.zipcode as string) || undefined,
            yearBuilt: (prop.yearBuilt as number) || undefined,
            livingArea: (prop.livingArea as string) || undefined,
            livingAreaValue: (prop.livingAreaValue as number) || undefined,
            pricePerSquareFoot: (prop.pricePerSquareFoot as number) || undefined,
            propertyTypeDimension: (prop.propertyTypeDimension as string) || undefined,
            homeType: (prop.homeType as string) || undefined,
            listingSubType: (prop.listingSubType as string) || undefined,
            zestimate: (prop.zestimate as number) || undefined,
            rentZestimate: (prop.rentZestimate as number) || undefined,
            taxAssessedValue: (prop.taxAssessedValue as number) || undefined,
            lotAreaValue: (prop.lotAreaValue as number) || undefined,
            lotAreaUnit: (prop.lotAreaUnit as string) || undefined,
            description: (prop.description as string) || undefined,
            url: (prop.url as string) || undefined,
            images: (prop.images as string[]) || [],
          };
        });

      // Use the centralized deduplication function and reset localStorage
      const deduplicatedResults = deduplicateSearchResults(transformedResults);
      
      // Reset and update localStorage with fresh search results (no duplicates)
      await resetAndUpdateSearchCache(deduplicatedResults);
      
      const searchTotalDuration = Date.now() - searchStartTime;
      console.log('✅ Search completed with localStorage reset and deduplication:', {
        originalCount: transformedResults.length,
        finalCount: deduplicatedResults.length,
        duplicatesRemoved: transformedResults.length - deduplicatedResults.length,
        totalDuration: `${searchTotalDuration}ms`,
        searchApiDuration: `${searchApiDuration}ms`,
        timestamp: new Date().toISOString()
      });

      return deduplicatedResults;
    } catch (error) {
      const searchErrorDuration = Date.now() - searchStartTime;
      console.error("❌ Error searching properties:", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        duration: `${searchErrorDuration}ms`,
        timestamp: new Date().toISOString()
      });
      return [];
    }
  }, [deduplicateSearchResults, resetAndUpdateSearchCache]);

  const fetchIsochronePolygon = useCallback(async (onSearchResults?: (results: SearchResult[]) => void) => {
    try {
      // Check auth and redirect if no token found
      if (!checkAuthAndRedirect(navigate)) {
        return null;
      }

      const authToken = getAuthToken();
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
      
      const response = await fetch(`${apiBaseUrl}/api/v1/search/isochrone`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.data) {
          setIsochroneData(data.data);
          const searchResults = await searchPropertiesInIsochrone(data.data);
          
          // Call the callback with search results if provided
          if (onSearchResults && searchResults.length > 0) {
            onSearchResults(searchResults);
          }
          
          return data.data;
        } else {
          console.warn(
            "⚠️ ISOCHRONE FAILED - API returned unsuccessful response:"
          );
          console.warn("  📄 Message:", data.message || "Unknown error");
          console.warn("  📊 Full Response:", JSON.stringify(data, null, 2));
        }
      } else {
        console.warn("⚠️ ISOCHRONE HTTP ERROR - Request failed:");
        console.warn("  🔢 Status Code:", response.status);
        console.warn("  📄 Status Text:", response.statusText);

        try {
          const errorText = await response.text();
          console.warn("  📋 Error Response Text:", errorText);

          // Try to parse as JSON for more structured error info
          try {
            const errorJson = JSON.parse(errorText);
            console.warn(
              "  📊 Error Response JSON:",
              JSON.stringify(errorJson, null, 2)
            );
          } catch {
            console.warn(
              "  📋 Error response is not JSON, showing as text above"
            );
          }
        } catch (textError) {
          console.warn("  ❌ Could not read error response text:", textError);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching isochrone polygon:", error);
    }
    return null;
  }, [navigate, searchPropertiesInIsochrone]);

  const renderImportantLocationMarkers = useCallback(async (isochroneData: IsochroneData, map: google.maps.Map) => {

    // Clear existing markers
    importantMarkersRef.current.forEach((marker: google.maps.marker.AdvancedMarkerElement) => {
      try {
        if (marker.map) {
          marker.map = null;
        }
      } catch (error) {
        console.warn('[ISOCHRONE] ⚠️ Error clearing existing marker:', error);
      }
    });
    importantMarkersRef.current = [];

    if (!isochroneData?.locations || !Array.isArray(isochroneData.locations)) {
      console.warn('[ISOCHRONE] ⚠️ No valid locations data:', {
        hasLocations: !!isochroneData?.locations,
        isArray: Array.isArray(isochroneData?.locations),
        locationsType: typeof isochroneData?.locations
      });
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const location of isochroneData.locations) {
      // Skip locations with null/undefined coordinates (geocoding failed)
      if (location.lat === null || location.lng === null || location.lat === undefined || location.lng === undefined) {
        console.warn('[ISOCHRONE] ⚠️ Skipping location with null coordinates (geocoding failed):', {
          name: location.name,
          address: location.address,
          lat: location.lat,
          lng: location.lng
        });
        errorCount++;
        continue;
      }

      // Validate that location has valid coordinates
      const lat = typeof location.lat === 'number' ? location.lat : parseFloat(location.lat);
      const lng = typeof location.lng === 'number' ? location.lng : parseFloat(location.lng);
      
      if (isNaN(lat) || isNaN(lng)) {
        console.warn('[ISOCHRONE] ⚠️ Invalid coordinates for location:', {
          name: location.name,
          lat: location.lat,
          lng: location.lng,
          parsedLat: lat,
          parsedLng: lng
        });
        errorCount++;
        continue;
      }

      const markerElement = document.createElement('div');
      markerElement.className = 'important-location-marker';
      markerElement.innerHTML = `
        <div style="background: #9CAF88; color: white; padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 500; box-shadow: 0 2px 6px rgba(0,0,0,0.15); text-align: center; min-width: 80px;">
          <div style="font-weight: 600; margin-bottom: 2px;">${location.name || 'Unknown Location'}</div>
          <div style="font-size: 10px; opacity: 0.9;">${location.commute_tolerance || 'N/A'} min</div>
        </div>
      `;

      try {
        const marker = new google.maps.marker.AdvancedMarkerElement({
          position: { lat, lng },
          map: map,
          content: markerElement,
          title: location.name || 'Important Location',
        });

        importantMarkersRef.current.push(marker);
        successCount++;
      } catch (error) {
        console.error('[ISOCHRONE] ❌ Error creating marker for location:', {
          name: location.name,
          lat,
          lng,
          error: error instanceof Error ? error.message : error
        });
        errorCount++;
      }
    }
  }, []);

  return {
    isochroneData,
    setIsochroneData,
    fetchIsochronePolygon,
    searchPropertiesInIsochrone,
    fetchIsochroneForMapOnly,
    renderImportantLocationMarkers,
  };
}
