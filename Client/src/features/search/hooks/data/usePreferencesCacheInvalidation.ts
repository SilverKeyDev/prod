/**
 * Hook to monitor user preferences changes and invalidate search cache
 * Ensures search results are refreshed when user preferences change
 */

import { useEffect, useRef } from 'react';
import { preferencesApi } from '../../../../core/config/api/preferences';
import { cacheUtils } from '../unifiedCache';
import { useConsolidatedSearchStore } from '../../../../core/store/search';

export function usePreferencesCacheInvalidation() {
  const previousPreferencesVersion = useRef<string>('1.0');
  const store = useConsolidatedSearchStore();

  useEffect(() => {
    const checkPreferencesChange = async () => {
      try {
        const preferencesResponse = await preferencesApi.get();
        
        if (preferencesResponse.success && preferencesResponse.preferences) {
          const currentVersion = preferencesResponse.preferences.preferences_version || '1.0';
          
          // Check if preferences version has changed
          if (previousPreferencesVersion.current !== currentVersion) {
            console.log('🔄 [CACHE_INVALIDATION] Preferences version changed:', {
              from: previousPreferencesVersion.current,
              to: currentVersion,
            });
            
            // Clear search cache for old version
            if (previousPreferencesVersion.current !== '1.0') {
              cacheUtils.clearSearchCache();
              console.log('🧹 [CACHE_INVALIDATION] Cleared search cache for old preferences version');
            }
            
            // Clear current search results from store
            store.clearSearchResults();
            console.log('🧹 [CACHE_INVALIDATION] Cleared search results from store');
            
            // Update the previous version
            previousPreferencesVersion.current = currentVersion;
            
            // Show toast notification
            store.enqueueToast({
              message: 'Your preferences have been updated. Please search again to see updated results.',
              type: 'info',
            });
          }
        }
      } catch (error) {
        console.warn('⚠️ [CACHE_INVALIDATION] Could not check preferences version:', error);
      }
    };

    // Check preferences on mount
    checkPreferencesChange();

    // Set up interval to check for preferences changes
    const interval = setInterval(checkPreferencesChange, 30000); // Check every 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, [store]);

  return {
    currentPreferencesVersion: previousPreferencesVersion.current,
  };
}

/**
 * Utility function to manually invalidate cache when preferences are updated
 */
export function invalidateSearchCacheOnPreferencesUpdate() {
  console.log('🔄 [CACHE_INVALIDATION] Manually invalidating search cache');
  
  const store = useConsolidatedSearchStore.getState();
  
  // Clear unified cache
  cacheUtils.clearSearchCache();
  
  // Clear store search results
  store.clearSearchResults();
  
  // Show notification
  store.enqueueToast({
    message: 'Search cache cleared due to preferences update. Please search again.',
    type: 'info',
  });
  
  console.log('✅ [CACHE_INVALIDATION] Search cache invalidated');
}
