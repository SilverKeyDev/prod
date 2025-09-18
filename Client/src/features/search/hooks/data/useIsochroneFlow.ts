// External libraries
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Internal config and utilities
import { searchService } from '../../../../features/search/services';
import type { IsochroneData } from '../../../../core/schemas/search';
import type { UseIsochroneFlowParams } from '../../../../core/schemas/search';
import { checkAuthAndRedirect } from '../../../../core/utils/auth';
import { cacheUtils } from '../unifiedCache';

// Request deduplication to prevent multiple concurrent calls
const activeIsochroneRequests = new Map<string, Promise<IsochroneData | null>>();

// Internal features
// Note: renderIsochronePolygon is passed as a parameter from SearchMapContainer
// Note: renderImportantLocationMarkers is passed as a parameter from SearchMapContainer

export function useIsochroneFlow(params: UseIsochroneFlowParams): {
  primeIsochroneOverlay: (hasResults: boolean) => Promise<void>;
  runIsochroneSearch: () => Promise<void>;
} {
  const navigate = useNavigate();

  // Extract individual functions to prevent dependency issues
  const {
    searchPropertiesInIsochrone,
    setSearchStage,
    setSearchResults,
    setIsSearching,
    setHasSearched,
    setCurrentPage,
    setShowPropertyModals,
    renderIsochronePolygon,
    renderImportantLocationMarkers,
  } = params;

  // Fetch isochrone polygon from backend for map population only (no property search)
  const fetchIsochroneForMapOnly = useCallback(async (): Promise<IsochroneData | null> => {
    try {
      // Check auth and redirect if no token found
      if (!checkAuthAndRedirect(navigate)) {
        return null;
      }

      // Try to get cached isochrone data first
      const cachedData = cacheUtils.getCachedIsochroneData('1.0');
      if (cachedData) {
        // keep quiet unless checklist relevant
        // Render immediately when data is available
        console.log('[SEARCH_CHECK] Isochrone cached:', !!cachedData);
        try {
          renderIsochronePolygon(cachedData);
          await renderImportantLocationMarkers(cachedData);
          console.log('[SEARCH_CHECK] Isochrone rendered (cached):', true);
        } catch (error) {
          console.error('❌ [ISOCHRONE_FLOW] Failed to render cached isochrone data:', error);
        }
        return cachedData;
      }

      // quiet
      const isochroneData = await searchService.getIsochrone();
      
      // Cache the isochrone data for future use
      cacheUtils.cacheIsochroneData(isochroneData, '1.0');
      // quiet
      
      // Render immediately when API response is received
      console.log('[SEARCH_CHECK] Isochrone fetched:', true);
      try {
        renderIsochronePolygon(isochroneData);
        await renderImportantLocationMarkers(isochroneData);
        console.log('[SEARCH_CHECK] Isochrone rendered (fresh):', true);
      } catch (error) {
        console.error('❌ [ISOCHRONE_FLOW] Failed to render fresh isochrone data:', error);
      }
      
      return isochroneData;
    } catch (error: unknown) {
      console.error('❌ Error fetching isochrone polygon:', error);
      return null;
    }
  }, [navigate, renderIsochronePolygon, renderImportantLocationMarkers]);

  // Automatically search for properties within the isochrone polygon
  const handleSearchPropertiesInIsochrone = useCallback(
    async (isochroneData: IsochroneData) => {
      await searchPropertiesInIsochrone(
        isochroneData,
        setSearchStage,
        setSearchResults,
        setIsSearching,
        setHasSearched,
        setCurrentPage,
        setShowPropertyModals
      );
    },
    [
      searchPropertiesInIsochrone,
      setSearchStage,
      setSearchResults,
      setIsSearching,
      setHasSearched,
      setCurrentPage,
      setShowPropertyModals,
    ]
  );

  // Fetch isochrone polygon from backend
  const fetchIsochronePolygon = useCallback(async (): Promise<IsochroneData | null> => {
    const requestKey = 'isochrone-polygon-1.0';
    
    // Check if request is already in progress
    if (activeIsochroneRequests.has(requestKey)) {
      // quiet
      return activeIsochroneRequests.get(requestKey)!;
    }
    
    const requestPromise = (async (): Promise<IsochroneData | null> => {
      try {
        // quiet
        // Check auth and redirect if no token found
        if (!checkAuthAndRedirect(navigate)) {
          console.log('❌ [ISOCHRONE_FLOW] Auth check failed, returning null');
          return null;
        }

        // Try to get cached isochrone data first
        const cachedData = cacheUtils.getCachedIsochroneData('1.0');
        let isochroneData: IsochroneData;
        
        if (cachedData) {
          // quiet
          isochroneData = cachedData;
          // Render immediately when cached data is available
          console.log('[SEARCH_CHECK] Isochrone cached:', true);
          try {
            renderIsochronePolygon(isochroneData);
            await renderImportantLocationMarkers(isochroneData);
            console.log('[SEARCH_CHECK] Isochrone rendered (cached):', true);
          } catch (error) {
            console.error('❌ [ISOCHRONE_FLOW] Failed to render cached isochrone data for search:', error);
          }
        } else {
          // quiet
          isochroneData = await searchService.getIsochrone();
          
          // Cache the isochrone data for future use
          cacheUtils.cacheIsochroneData(isochroneData, '1.0');
          // quiet
          
          // Render immediately when API response is received
          console.log('[SEARCH_CHECK] Isochrone fetched:', true);
          try {
            renderIsochronePolygon(isochroneData);
            await renderImportantLocationMarkers(isochroneData);
            console.log('[SEARCH_CHECK] Isochrone rendered (fresh):', true);
          } catch (error) {
            console.error('❌ [ISOCHRONE_FLOW] Failed to render fresh isochrone data for search:', error);
          }
        }
        
        // Search for properties within the isochrone
        // quiet
        await handleSearchPropertiesInIsochrone(isochroneData);
        console.log('[SEARCH_CHECK] Property search completed:', true);
        return isochroneData;
      } catch (error: unknown) {
        console.error('❌ [ISOCHRONE_FLOW] Error fetching isochrone polygon:', error);
        throw error;
      }
    })();
    
    activeIsochroneRequests.set(requestKey, requestPromise);
    
    try {
      const result = await requestPromise;
      return result;
    } finally {
      activeIsochroneRequests.delete(requestKey);
    }
  }, [navigate, handleSearchPropertiesInIsochrone]);

  const primeIsochroneOverlay = useCallback(
    async (hasResults: boolean) => {
      try {
        const fetcher = hasResults ? fetchIsochroneForMapOnly : fetchIsochronePolygon;
        
        // The fetcher will handle rendering immediately when API response is received
        const data = await fetcher();
        
        if (data) console.log('[SEARCH_CHECK] Isochrone ready:', true);
      } catch (error) {
        console.error('❌ [ISOCHRONE_FLOW] Error in primeIsochroneOverlay:', error);
      }
    },
    [fetchIsochroneForMapOnly, fetchIsochronePolygon]
  );

  const runIsochroneSearch = useCallback(async () => {
    // fetchIsochronePolygon will handle rendering immediately when API response is received
    const isochroneData = await fetchIsochronePolygon();
    if (isochroneData) {
      console.log('[SEARCH_CHECK] Isochrone search completed:', true);
    } else {
      console.warn('[SEARCH_CHECK] Isochrone search returned no data');
    }
  }, [fetchIsochronePolygon]);

  return {
    primeIsochroneOverlay,
    runIsochroneSearch,
  };
}
