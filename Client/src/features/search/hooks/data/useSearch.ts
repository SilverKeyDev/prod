// External libraries
import { useState, useEffect } from 'react';

// Internal utilities
import type { SearchResult } from '../../../../core/schemas/search';
import type { PropertyDetails, PropertyType, ListingStatus } from '../../../../core/schemas/search';
import type { IsochroneData } from '../../../../core/schemas/search';
import { asError } from '../../../../core/utils/error';
import { cacheUtils } from '../unifiedCache';
import { searchService } from '../../services/SearchService';
import { preferencesApi } from '../../../../core/config/api/preferences';

// Types from PropertySearchWorkflow
export type LatLng = {
  lat: number;
  lng: number;
};

export type SearchByPolygonParams = {
  polygon: LatLng[];
  status_type?: string;
  perBucketPages?: number;
  maxRetries?: number;
};

// Request deduplication to prevent multiple concurrent calls
const activeRequests = new Map<string, Promise<any>>();

// Search state tracking to prevent multiple simultaneous searches
let isSearchInProgress = false;

/**
 * Convert SearchResult to PropertyDetails
 * Handles type conversion and provides safe defaults
 */
// Note: conversion helpers are inlined where needed to avoid unused exports

export function useSearchBootstrap(params: {
  env: { apiBaseUrl: string };
  setSearchResults: (r: PropertyDetails[]) => void;
  setHasSearched: (b: boolean) => void;
  setCurrentPage: (n: number) => void;
  setShowPropertyModals: (b: boolean) => void;
}): { isLocalStorageLoaded: boolean } {
  const [isLocalStorageLoaded, setIsLocalStorageLoaded] = useState(false);

  // Extract individual functions to prevent dependency issues
  const { setSearchResults, setHasSearched, setCurrentPage, setShowPropertyModals } = params;

  useEffect(() => {
    const initializeSearchResults = async () => {
      try {
        // Removed verbose logging
        
        // First try unified cache with current preferences version
        let preferencesVersion = '1.0';
        try {
          const idToken = sessionStorage.getItem("id_token");
          const { apiBaseUrl } = params.env;

          if (idToken) {
            const response = await fetch(`${apiBaseUrl}/api/v1/preferences`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${idToken}`,
                "Content-Type": "application/json",
              },
            });

            if (response?.ok) {
              const data = (await response.json()) as Record<string, unknown>;
              preferencesVersion =
                data.preferences &&
                typeof data.preferences === "object" &&
                "preferences_version" in data.preferences
                  ? (data.preferences as { preferences_version: string })
                      .preferences_version
                  : "1.0";
            }
          }
        } catch (prefError: unknown) {
          const error = asError(prefError);
          console.warn(
            "⚠️ Could not fetch preferences version, using default:",
            error
          );
        }

        // Removed verbose logging

        // Try unified cache only
        const cachedResults = cacheUtils.getCachedSearchResults(preferencesVersion);
        if (cachedResults && cachedResults.length > 0) {
          // Removed verbose logging
          setSearchResults(cachedResults);
          setHasSearched(true);
          setCurrentPage(0);
          setShowPropertyModals(true);
          setIsLocalStorageLoaded(true);
          return;
        }

        // Removed verbose logging
      } catch (error: unknown) {
        const err = asError(error);
        console.error('❌ [BOOTSTRAP] Error initializing search results:', err);
      } finally {
        setIsLocalStorageLoaded(true);
      }
    };

    void initializeSearchResults();
  }, [setSearchResults, setHasSearched, setCurrentPage, setShowPropertyModals, params.env]);

  return { isLocalStorageLoaded };
}

/**
 * Search properties within an isochrone polygon using the backend API
 * Backend automatically retrieves user preferences
 */
export const searchPropertiesInIsochrone = async (
  isochroneData: IsochroneData,
  setSearchStage: (stage: string) => void,
  setSearchResults: (results: PropertyDetails[]) => void,
  setIsSearching: (searching: boolean) => void,
  setHasSearched: (searched: boolean) => void,
  setCurrentPage: (page: number) => void,
  setShowPropertyModals: (show: boolean) => void
): Promise<void> => {
  // Removed verbose logging
  
  // Prevent multiple simultaneous searches
  if (isSearchInProgress) {
    // Removed verbose logging
    return;
  }

  isSearchInProgress = true;
  setIsSearching(true);
  setSearchStage('Locating homes in your area...');
  setSearchResults([]);

  if (!isochroneData?.isochrone?.geometry) {
    // Removed verbose logging
    setIsSearching(false);
    isSearchInProgress = false;
    return;
  }

  try {
    setSearchStage('Extracting property data...');

    // Load user preferences for the search request
    let userPreferences: any = {};
    try {
      const preferencesResponse = await preferencesApi.get();
      if (preferencesResponse.success && preferencesResponse.preferences) {
        userPreferences = preferencesResponse.preferences;
      }
    } catch (prefError) {
      // Removed verbose logging
    }

    const searchRequest = {
      user_preferences: userPreferences,
      perBucketPages: 20,
    };

    // Create a unique key for this search request to prevent duplicates
    // Use isochrone data to create unique key
    const searchKey = `search-simplified-${isochroneData.locations?.length || 0}-${Date.now()}`;
    
    let searchResults: PropertyDetails[];
    
    // Check if there's already an active search with the same parameters
    if (activeRequests.has(searchKey)) {
      searchResults = await activeRequests.get(searchKey);
    } else {
      const searchPromise = searchService.searchByPolygon(searchRequest);
      activeRequests.set(searchKey, searchPromise);
      
      try {
        // Removed verbose logging
        const response = await searchPromise;
        // Removed verbose logging
        
        if (response.success && response.properties) {
          // Transform API response to PropertyDetails format
          searchResults = response.properties.map((property: any) => {
            // Debug logging for coordinate extraction
            console.log(`🗺️ [SEARCH_MAPPING] Processing property ${property.id || property.property_id}:`, {
              address: property.address,
              rawLat: property.lat,
              rawLng: property.lng,
              rawLatitude: property.latitude,
              rawLongitude: property.longitude,
              propertyKeys: Object.keys(property)
            });
            
            return {
              id: property.id || property.property_id || Math.random().toString(),
              address: property.address || 'Address not available',
              price: property.price || 'N/A',
              bedrooms: property.bedrooms || 0,
              bathrooms: property.bathrooms || 0,
              sqft: property.sqft || 0,
              lat: property.lat ?? property.latitude ?? null,
              lng: property.lng ?? property.longitude ?? null,
              lotSize: property.lot_size,
              propertyType: (property.property_type || 'SINGLE_FAMILY') as PropertyType,
              listingStatus: (property.listing_status || 'FOR_SALE') as ListingStatus,
              imageUrl: property.image_url || property.imageUrl || property.imageSrc || property.imgSrc || property.images?.[0]?.url || property.imgUrl,
              _score: property._score || property.score || 0,
            };
          });
          // Removed verbose logging
        } else {
          console.error('❌ Search failed:', response.error);
          throw new Error(response.error || 'Search failed');
        }
      } finally {
        activeRequests.delete(searchKey);
      }
    }

    // Show evaluating scores stage
    setSearchStage('Evaluating scores...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setSearchStage('Scoring homes based on your preferences...');

    // Use the transformed results
    const transformedResults: PropertyDetails[] = searchResults;

    setSearchStage('Extracting property images...');
    await new Promise((resolve) => setTimeout(resolve, 800));

    setSearchStage('Finalizing results...');

    // Update search results and mark as searched
    // Removed verbose logging
    setSearchResults(transformedResults);

    // Save search results to unified cache only
    try {
      const searchResultsForStorage: SearchResult[] = transformedResults.map(property => ({
        id: property.id,
        address: property.address,
        price: typeof property.price === 'string' ? property.price : property.price.toString(),
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        sqft: property.sqft,
        lat: property.lat,
        lng: property.lng,
        lotSize: property.lotSize,
        propertyType: property.propertyType,
        listingStatus: property.listingStatus,
        imageUrl: property.imageUrl || (property as any).image_url || (property as any).imageSrc || (property as any).imgSrc || (property as any).images?.[0]?.url || (property as any).imgUrl,
        _score: property._score,
      }));
      
      // Removed verbose logging
      
      // Get current preferences version for caching
      let preferencesVersion = '1.0';
      try {
        const preferencesResponse = await preferencesApi.get();
        if (preferencesResponse.success && preferencesResponse.preferences) {
          const pv: unknown = (preferencesResponse.preferences as any).preferences_version;
          preferencesVersion = typeof pv === 'string' ? pv : '1.0';
        }
      } catch (prefError) {
        // Removed verbose logging
      }
      
      // Cache results using unified cache only
      cacheUtils.cacheSearchResults(searchResultsForStorage, preferencesVersion);
      // Removed verbose logging
    } catch (error: unknown) {
      console.error('❌ [POLYGON_SEARCH] Failed to save search results to cache:', error);
    }

    // Removed verbose logging
    setHasSearched(true);
    setIsSearching(false);
    setCurrentPage(0);
    setShowPropertyModals(true);

    // Removed verbose logging
  } catch (error: unknown) {
    console.error('❌ Error in automatic isochrone property search:', error, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      isochroneData,
    });
    setIsSearching(false);
    setSearchStage('');
  } finally {
    // Reset search state
    isSearchInProgress = false;
  }
};
