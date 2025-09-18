/**
 * Unified Cache and Memory Management System
 * Consolidates all caching, memory management, and storage functionality
 * Handles: isochrone data, important locations, search results, saved homes, and memory cleanup
 */

import React from 'react';
import type { PropertyDetails, MapMarker, MapPolygon } from '../../../core/schemas/search';
import type { IsochroneData } from '../../../core/schemas/search';
import type { SearchResult } from '../../../core/schemas/search';
import { getFromStorage, setToStorage, removeFromStorage } from '../../../core/utils/storage';

// ============================================================================
// CACHE CONFIGURATION AND TYPES
// ============================================================================

export type CacheConfig = {
  maxAge: number; // Maximum age in milliseconds
  maxSize: number; // Maximum number of cached items
  compressionEnabled: boolean;
  versionCheckEnabled: boolean;
  cleanupInterval: number; // Cleanup interval in milliseconds
  persistImportantData: boolean; // Whether to persist important data to localStorage
}

export type CacheEntry<T = unknown> = {
  data: T;
  timestamp: number;
  version: string;
  size: number;
  accessCount: number;
  lastAccessed: number;
  persistent: boolean; // Whether this entry should be persisted to localStorage
}

export type CacheStats = {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  oldestEntry: number;
  newestEntry: number;
  memoryUsage: {
    markers: number;
    polygons: number;
    overlays: number;
    listeners: number;
    timers: number;
    total: number;
  };
}

export type MemoryManagerState = {
  markers: MapMarker[];
  polygons: MapPolygon[];
  overlays: google.maps.OverlayView[];
  listeners: google.maps.MapsEventListener[];
  timers: NodeJS.Timeout[];
}

// ============================================================================
// UNIFIED CACHE AND MEMORY MANAGER
// ============================================================================

export class UnifiedCacheManager {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };
  private cleanupTimer: NodeJS.Timeout | null = null;
  private memoryState: MemoryManagerState = {
    markers: [],
    polygons: [],
    overlays: [],
    listeners: [],
    timers: [],
  };
  private isDestroyed = false;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 100,
      compressionEnabled: true,
      versionCheckEnabled: true,
      cleanupInterval: 60 * 60 * 1000, // 1 hour
      persistImportantData: true,
      ...config,
    };

    this.startCleanupTimer();
    this.loadPersistentData();
  }

  // ============================================================================
  // CACHE OPERATIONS
  // ============================================================================

  /**
   * Set a cache entry with automatic compression and version management
   */
  set<T>(key: string, data: T, version?: string, persistent: boolean = false): void {
    try {
      const serialized = this.config.compressionEnabled 
        ? this.compress(JSON.stringify(data))
        : JSON.stringify(data);
      
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: version || this.getCurrentVersion(),
        size: serialized.length,
        accessCount: 0,
        lastAccessed: Date.now(),
        persistent: persistent || this.isImportantKey(key),
      };

      // Check if we need to evict entries
      this.evictIfNeeded();

      this.cache.set(key, entry);
      this.stats.sets++;

      console.log('📦 [CACHE] Added entry:', {
        key,
        size: entry.size,
        version: entry.version,
        persistent: entry.persistent,
        totalEntries: this.cache.size,
        dataType: Array.isArray(data) ? `Array(${data.length})` : typeof data,
      });

      // Persist to localStorage for important data
      if (entry.persistent && this.config.persistImportantData) {
        this.persistToLocalStorage(key, entry);
        console.log('💾 [CACHE] Persisted to localStorage:', key);
      }
    } catch (error) {
      console.warn('❌ [CACHE] Failed to set cache entry:', error);
    }
  }

  /**
   * Get a cache entry with automatic decompression and version checking
   */
  get<T>(key: string, currentVersion?: string): T | null {
    try {
      const entry = this.cache.get(key) as CacheEntry<T> | undefined;
      
      if (!entry) {
        // Try to load from localStorage
        const persistedEntry = this.loadFromLocalStorage<T>(key);
        if (persistedEntry) {
          console.log('💾 [CACHE] Loaded from localStorage:', key);
          this.cache.set(key, persistedEntry);
          return this.processCacheEntry(persistedEntry, currentVersion);
        }
        
        console.log('❌ [CACHE] Cache miss:', key);
        this.stats.misses++;
        return null;
      }

      console.log('✅ [CACHE] Cache hit:', {
        key,
        accessCount: entry.accessCount + 1,
        age: Date.now() - entry.timestamp,
        size: entry.size,
      });
      return this.processCacheEntry(entry, currentVersion);
    } catch (error) {
      console.warn('❌ [CACHE] Failed to get cache entry:', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Process a cache entry (check version, update access stats)
   */
  private processCacheEntry<T>(entry: CacheEntry<T>, currentVersion?: string): T | null {
    // Check if entry is expired
    if (this.isExpired(entry)) {
      this.cache.delete(entry as any);
      this.stats.misses++;
      return null;
    }

    // Check version if enabled
    if (this.config.versionCheckEnabled && currentVersion && entry.version !== currentVersion) {
      this.cache.delete(entry as any);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    this.stats.hits++;
    return entry.data;
  }

  /**
   * Delete a cache entry
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.removeFromLocalStorage(key);
      console.log('🗑️ [CACHE] Deleted entry:', {
        key,
        totalEntries: this.cache.size,
      });
    } else {
      console.log('❌ [CACHE] Failed to delete entry (not found):', key);
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const entryCount = this.cache.size;
    this.cache.clear();
    this.clearLocalStorage();
    console.log('🧹 [CACHE] Cleared all entries:', {
      clearedCount: entryCount,
    });
  }

  // ============================================================================
  // MEMORY MANAGEMENT OPERATIONS
  // ============================================================================

  /**
   * Register a marker for cleanup
   */
  registerMarker(marker: MapMarker): void {
    if (this.isDestroyed) return;
    this.memoryState.markers.push(marker);
  }

  /**
   * Register a polygon for cleanup
   */
  registerPolygon(polygon: MapPolygon): void {
    if (this.isDestroyed) return;
    this.memoryState.polygons.push(polygon);
  }

  /**
   * Register an overlay for cleanup
   */
  registerOverlay(overlay: google.maps.OverlayView): void {
    if (this.isDestroyed) return;
    this.memoryState.overlays.push(overlay);
  }

  /**
   * Register a map event listener for cleanup
   */
  registerListener(listener: google.maps.MapsEventListener): void {
    if (this.isDestroyed) return;
    this.memoryState.listeners.push(listener);
  }

  /**
   * Register a timer for cleanup
   */
  registerTimer(timer: NodeJS.Timeout): void {
    if (this.isDestroyed) return;
    this.memoryState.timers.push(timer);
  }

  /**
   * Clean up all registered resources
   */
  cleanupMemory(): void {
    if (this.isDestroyed) return;

    // Clean up markers
    this.memoryState.markers.forEach((marker) => {
      try {
        if (marker.overlay) {
          marker.overlay.setMap(null);
        }
      } catch (error) {
        console.warn('Error cleaning up marker:', error);
      }
    });

    // Clean up overlays
    this.memoryState.overlays.forEach((overlay) => {
      try {
        overlay.setMap(null);
      } catch (error) {
        console.warn('Error cleaning up overlay:', error);
      }
    });

    // Clean up event listeners
    this.memoryState.listeners.forEach((listener) => {
      try {
        google.maps.event.removeListener(listener);
      } catch (error) {
        console.warn('Error cleaning up listener:', error);
      }
    });

    // Clean up timers
    this.memoryState.timers.forEach((timer) => {
      try {
        clearTimeout(timer);
      } catch (error) {
        console.warn('Error cleaning up timer:', error);
      }
    });

    // Clear all arrays
    this.memoryState.markers = [];
    this.memoryState.polygons = [];
    this.memoryState.overlays = [];
    this.memoryState.listeners = [];
    this.memoryState.timers = [];
  }

  /**
   * Clean up only polygons from memory
   */
  cleanupPolygons(): void {
    if (this.isDestroyed) return;

    const polygonCount = this.memoryState.polygons.length;
    console.log('🧹 [CACHE] Cleaning up polygons:', { count: polygonCount });

    // Clean up polygons
    this.memoryState.polygons.forEach((polygon) => {
      try {
        if (polygon.polygon) {
          polygon.polygon.setMap(null);
        }
      } catch (error) {
        console.warn('❌ [CACHE] Error cleaning up polygon:', error);
      }
    });

    // Clear polygons array
    this.memoryState.polygons = [];
    console.log('✅ [CACHE] Polygons cleaned up');
  }

  /**
   * Clean up only markers from memory
   */
  cleanupMarkers(): void {
    if (this.isDestroyed) return;

    const markerCount = this.memoryState.markers.length;
    console.log('🧹 [CACHE] Cleaning up markers:', { count: markerCount });

    // Clean up markers
    this.memoryState.markers.forEach((marker) => {
      try {
        if (marker.overlay) {
          marker.overlay.setMap(null);
        }
      } catch (error) {
        console.warn('❌ [CACHE] Error cleaning up marker:', error);
      }
    });

    // Clear markers array
    this.memoryState.markers = [];
    console.log('✅ [CACHE] Markers cleaned up');
  }

  /**
   * Clear search results from cache, localStorage, and sessionStorage
   */
  clearSearchResults(): void {
    if (this.isDestroyed) return;
    
    console.log('🧹 [CACHE] Clearing search results from cache, localStorage, and sessionStorage');
    
    // Remove search results from cache
    const cacheKeys = [
      'search-results',
      'search-results-v1.0',
      'search-results-v1.1',
      'search-results-v1.2',
      'searchResults_1.0',
      'searchResults_1.1',
      'searchResults_1.2'
    ];
    
    let deletedFromCache = 0;
    cacheKeys.forEach(key => {
      if (this.cache.delete(key)) {
        deletedFromCache++;
      }
    });
    
    // Clear from localStorage
    try {
      const localStorageKeys = [
        'searchResults',
        'search-results',
        'search-results-v1.0',
        'search-results-v1.1',
        'search-results-v1.2'
      ];
      
      localStorageKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log('✅ [CACHE] Cleared search results from localStorage:', {
        deletedFromCache,
        localStorageKeysCleared: localStorageKeys.length,
      });
    } catch (error) {
      console.warn('❌ [CACHE] Failed to clear search results from localStorage:', error);
    }
    
    // Clear from sessionStorage
    try {
      const sessionStorageKeys = [
        'searchResults',
        'search-results',
        'search-results-v1.0',
        'search-results-v1.1',
        'search-results-v1.2'
      ];
      
      sessionStorageKeys.forEach(key => {
        sessionStorage.removeItem(key);
      });
      
      console.log('✅ [CACHE] Cleared search results from sessionStorage:', {
        sessionStorageKeysCleared: sessionStorageKeys.length,
      });
    } catch (error) {
      console.warn('❌ [CACHE] Failed to clear search results from sessionStorage:', error);
    }
  }

  /**
   * Clear saved homes from cache and localStorage
   */
  clearSavedHomes(): void {
    if (this.isDestroyed) return;
    
    console.log('🧹 [CACHE] Clearing saved homes from cache and localStorage');
    
    // Remove saved homes from cache
    const cacheKeys = [
      'saved-homes',
      'saved-homes-v1.0',
      'saved-homes-v1.1',
      'saved-homes-v1.2',
      'savedHomes_1.0',
      'savedHomes_1.1',
      'savedHomes_1.2'
    ];
    
    let deletedFromCache = 0;
    cacheKeys.forEach(key => {
      if (this.cache.delete(key)) {
        deletedFromCache++;
      }
    });
    
    // Clear from localStorage
    try {
      const localStorageKeys = [
        'savedHomes',
        'saved-homes',
        'saved-homes-v1.0',
        'saved-homes-v1.1',
        'saved-homes-v1.2'
      ];
      
      localStorageKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log('✅ [CACHE] Cleared saved homes:', {
        deletedFromCache,
        localStorageKeysCleared: localStorageKeys.length,
      });
    } catch (error) {
      console.warn('❌ [CACHE] Failed to clear saved homes from localStorage:', error);
    }
  }

  /**
   * Clear isochrone data from cache
   */
  clearIsochroneData(): void {
    if (this.isDestroyed) return;
    
    console.log('🧹 [CACHE] Clearing isochrone data from cache');
    
    // Remove isochrone data from cache
    const cacheKeys = [
      'isochrone-data',
      'isochrone-data-v1.0',
      'isochrone-data-v1.1',
      'isochrone-data-v1.2'
    ];
    
    let deletedFromCache = 0;
    cacheKeys.forEach(key => {
      if (this.cache.delete(key)) {
        deletedFromCache++;
      }
    });
    
    console.log('✅ [CACHE] Cleared isochrone data:', {
      deletedFromCache,
    });
  }

  // ============================================================================
  // SPECIALIZED DATA OPERATIONS
  // ============================================================================

  /**
   * Cache search results with version management
   */
  cacheSearchResults(results: SearchResult[], preferencesVersion: string): void {
    const key = `searchResults_${preferencesVersion}`;
    console.log('📦 [CACHE] Caching search results:', {
      key,
      resultsCount: results.length,
      preferencesVersion,
    });
    this.set(key, results, preferencesVersion, true);
  }

  /**
   * Get cached search results
   */
  getCachedSearchResults(preferencesVersion: string): PropertyDetails[] | null {
    const key = `searchResults_${preferencesVersion}`;
    return this.get<PropertyDetails[]>(key, preferencesVersion);
  }

  /**
   * Cache isochrone data
   */
  cacheIsochroneData(data: IsochroneData, version: string): void {
    const key = `isochrone_${version}`;
    console.log('📦 [CACHE] Caching isochrone data:', {
      key,
      version,
      hasIsochrone: !!data?.isochrone,
      hasGeometry: !!data?.isochrone?.geometry,
      locationsCount: data?.locations?.length || 0,
    });
    this.set(key, data, version, true);
  }

  /**
   * Get cached isochrone data
   */
  getCachedIsochroneData(version: string): IsochroneData | null {
    const key = `isochrone_${version}`;
    return this.get<IsochroneData>(key, version);
  }

  /**
   * Cache important locations data
   */
  cacheImportantLocations(data: IsochroneData['locations'], version: string): void {
    const key = `importantLocations_${version}`;
    this.set(key, data, version, true);
  }

  /**
   * Get cached important locations data
   */
  getCachedImportantLocations(version: string): IsochroneData['locations'] | null {
    const key = `importantLocations_${version}`;
    return this.get<IsochroneData['locations']>(key, version);
  }

  /**
   * Cache saved homes data
   */
  cacheSavedHomes(data: PropertyDetails[], version: string): void {
    const key = `savedHomes_${version}`;
    this.set(key, data, version, true);
  }

  /**
   * Get cached saved homes data
   */
  getCachedSavedHomes(version: string): PropertyDetails[] | null {
    const key = `savedHomes_${version}`;
    return this.get<PropertyDetails[]>(key, version);
  }

  /**
   * Save search results to sessionStorage (legacy compatibility - now uses sessionStorage for search results)
   */
  saveSearchResultsToLocalStorage(searchData: {
    results: SearchResult[];
    timestamp: string;
    totalCount: number;
    preferencesVersion: string;
    searchMetadata: {
      hasSearched: boolean;
      currentPage: number;
      propertiesPerPage: number;
    };
  }): void {
    try {
      // Use sessionStorage for search results (temporary wizard state)
      sessionStorage.setItem('searchResults', JSON.stringify(searchData));
      console.log('💾 [CACHE] Saved search results to sessionStorage (legacy compatibility)');
    } catch (error) {
      console.error('❌ Error saving search results to sessionStorage:', error);
    }
  }

  /**
   * Load search results from localStorage (legacy compatibility)
   */
  loadSearchResultsFromLocalStorage(): {
    results: SearchResult[];
    timestamp: string;
    totalCount: number;
    preferencesVersion: string;
    searchMetadata: {
      hasSearched: boolean;
      currentPage: number;
      propertiesPerPage: number;
    };
  } | null {
    try {
      return getFromStorage('searchResults') || null;
    } catch (error) {
      console.error('❌ Error loading search results from localStorage:', error);
      return null;
    }
  }

  // ============================================================================
  // STATISTICS AND MONITORING
  // ============================================================================

  /**
   * Get comprehensive cache and memory statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalHits = this.stats.hits;
    const totalRequests = totalHits + this.stats.misses;
    
    return {
      totalEntries: this.cache.size,
      totalSize: entries.reduce((sum, entry) => sum + entry.size, 0),
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.stats.misses / totalRequests : 0,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : 0,
      memoryUsage: this.getMemoryStats(),
    };
  }

  /**
   * Get current memory usage statistics
   */
  getMemoryStats(): {
    markers: number;
    polygons: number;
    overlays: number;
    listeners: number;
    timers: number;
    total: number;
  } {
    return {
      markers: this.memoryState.markers.length,
      polygons: this.memoryState.polygons.length,
      overlays: this.memoryState.overlays.length,
      listeners: this.memoryState.listeners.length,
      timers: this.memoryState.timers.length,
      total: this.memoryState.markers.length + 
             this.memoryState.polygons.length + 
             this.memoryState.overlays.length + 
             this.memoryState.listeners.length + 
             this.memoryState.timers.length,
    };
  }

  /**
   * Check if the manager has been destroyed
   */
  isDestroyedState(): boolean {
    return this.isDestroyed;
  }

  // ============================================================================
  // PRIVATE UTILITY METHODS
  // ============================================================================

  /**
   * Check if an entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.config.maxAge;
  }

  /**
   * Evict entries if cache is too large
   */
  private evictIfNeeded(): void {
    if (this.cache.size >= this.config.maxSize) {
      // Sort by last accessed time and remove oldest entries
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
      
      const toRemove = entries.slice(0, Math.floor(this.config.maxSize * 0.2)); // Remove 20%
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.maxAge) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Compress data using simple compression
   */
  private compress(data: string): string {
    try {
      // Simple compression - in production, you might want to use a real compression library
      return btoa(data);
    } catch {
      return data;
    }
  }

  /**
   * Decompress data
   */
  private decompress(data: string): string {
    try {
      return atob(data);
    } catch {
      return data;
    }
  }

  /**
   * Get current version
   */
  private getCurrentVersion(): string {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  /**
   * Check if a key is important enough to persist
   */
  private isImportantKey(key: string): boolean {
    return key.includes('searchResults') || 
           key.includes('isochrone') || 
           key.includes('importantLocations') || 
           key.includes('savedHomes') ||
           key.includes('preferences');
  }

  /**
   * Persist entry to appropriate storage (sessionStorage for search results, localStorage for others)
   */
  private persistToLocalStorage(key: string, entry: CacheEntry): void {
    try {
      const storageKey = `unified_cache_${key}`;
      const data = {
        ...entry,
        data: this.config.compressionEnabled 
          ? this.compress(JSON.stringify(entry.data))
          : entry.data,
      };
      
      // Use sessionStorage for search results (temporary wizard state)
      if (this.isSearchResultsKey(key)) {
        sessionStorage.setItem(storageKey, JSON.stringify(data));
      } else {
        // Use localStorage for other data (UI preferences, etc.)
        setToStorage(storageKey, data);
      }
    } catch (error) {
      console.warn('Failed to persist to storage:', error);
    }
  }

  /**
   * Load entry from appropriate storage (sessionStorage for search results, localStorage for others)
   */
  private loadFromLocalStorage<T>(key: string): CacheEntry<T> | null {
    try {
      const storageKey = `unified_cache_${key}`;
      let stored: CacheEntry<T> | null = null;
      
      // Try sessionStorage first for search results
      if (this.isSearchResultsKey(key)) {
        const sessionItem = sessionStorage.getItem(storageKey);
        if (sessionItem) {
          stored = JSON.parse(sessionItem) as CacheEntry<T>;
        }
      }
      
      // Fallback to localStorage if not found in sessionStorage or not a search results key
      if (!stored) {
        stored = getFromStorage<CacheEntry<T>>(storageKey);
      }
      
      if (!stored) return null;

      // Check if entry is expired
      if (this.isExpired(stored)) {
        this.removeFromStorage(storageKey, key);
        return null;
      }

      // Decompress data if needed
      if (this.config.compressionEnabled && typeof stored.data === 'string') {
        stored.data = JSON.parse(this.decompress(stored.data));
      }

      return stored;
    } catch (error) {
      console.warn('Failed to load from storage:', error);
      return null;
    }
  }

  /**
   * Remove entry from appropriate storage (sessionStorage for search results, localStorage for others)
   */
  private removeFromStorage(storageKey: string, originalKey: string): void {
    try {
      if (this.isSearchResultsKey(originalKey)) {
        sessionStorage.removeItem(storageKey);
      } else {
        removeFromStorage(storageKey);
      }
    } catch (error) {
      console.warn('Failed to remove from storage:', error);
    }
  }

  /**
   * Remove entry from localStorage (legacy method name)
   */
  private removeFromLocalStorage(key: string): void {
    const storageKey = `unified_cache_${key}`;
    this.removeFromStorage(storageKey, key);
  }

  /**
   * Clear all storage cache entries (both localStorage and sessionStorage)
   */
  private clearLocalStorage(): void {
    try {
      // Clear localStorage entries
      const localStorageKeys = Object.keys(localStorage);
      localStorageKeys.forEach(key => {
        if (key.startsWith('unified_cache_') || key === 'searchResults') {
          removeFromStorage(key);
        }
      });
      
      // Clear sessionStorage entries
      const sessionStorageKeys = Object.keys(sessionStorage);
      sessionStorageKeys.forEach(key => {
        if (key.startsWith('unified_cache_') || key === 'searchResults') {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear storage:', error);
    }
  }

  /**
   * Load persistent data on initialization from both localStorage and sessionStorage
   */
  private loadPersistentData(): void {
    try {
      // Load from localStorage
      const localStorageKeys = Object.keys(localStorage);
      localStorageKeys.forEach(key => {
        if (key.startsWith('unified_cache_')) {
          const cacheKey = key.replace('unified_cache_', '');
          const entry = this.loadFromLocalStorage(cacheKey);
          if (entry) {
            this.cache.set(cacheKey, entry);
          }
        }
      });
      
      // Load from sessionStorage
      const sessionStorageKeys = Object.keys(sessionStorage);
      sessionStorageKeys.forEach(key => {
        if (key.startsWith('unified_cache_')) {
          const cacheKey = key.replace('unified_cache_', '');
          const entry = this.loadFromLocalStorage(cacheKey);
          if (entry) {
            this.cache.set(cacheKey, entry);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to load persistent data:', error);
    }
  }

  /**
   * Check if a key is for search results (should use sessionStorage)
   */
  private isSearchResultsKey(key: string): boolean {
    return key.includes('searchResults') || key.includes('search-results');
  }

  /**
   * Destroy the cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cleanupMemory();
    this.clear();
    this.isDestroyed = true;
  }
}

// ============================================================================
// GLOBAL INSTANCE AND UTILITIES
// ============================================================================

// Global unified cache instance
export const unifiedCache = new UnifiedCacheManager({
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 50,
  compressionEnabled: true,
  versionCheckEnabled: true,
  cleanupInterval: 30 * 60 * 1000, // 30 minutes
  persistImportantData: true,
});

// Legacy compatibility exports
export const cacheUtils = {
  cacheSearchResults: (results: SearchResult[], preferencesVersion: string): void => {
    unifiedCache.cacheSearchResults(results, preferencesVersion);
  },
  getCachedSearchResults: (preferencesVersion: string): PropertyDetails[] | null => {
    return unifiedCache.getCachedSearchResults(preferencesVersion);
  },
  cacheIsochroneData: (data: IsochroneData, version: string): void => {
    unifiedCache.cacheIsochroneData(data, version);
  },
  getCachedIsochroneData: (version: string): IsochroneData | null => {
    return unifiedCache.getCachedIsochroneData(version);
  },
  clearSearchCache: (): void => {
    unifiedCache.clear();
  },
  getCacheStats: (): CacheStats => {
    return unifiedCache.getStats();
  },
};

// Legacy localStorage utilities
export const localStorageUtils = {
  loadSearchResults: (): ReturnType<typeof unifiedCache.loadSearchResultsFromLocalStorage> => {
    return unifiedCache.loadSearchResultsFromLocalStorage();
  },
  saveSearchResults: (data: Parameters<typeof unifiedCache.saveSearchResultsToLocalStorage>[0]): void => {
    unifiedCache.saveSearchResultsToLocalStorage(data);
  },
};

// Memory management utilities
export const memoryUtils = {
  registerMarker: (marker: MapMarker): void => {
    unifiedCache.registerMarker(marker);
  },
  registerPolygon: (polygon: MapPolygon): void => {
    unifiedCache.registerPolygon(polygon);
  },
  registerOverlay: (overlay: google.maps.OverlayView): void => {
    unifiedCache.registerOverlay(overlay);
  },
  registerListener: (listener: google.maps.MapsEventListener): void => {
    unifiedCache.registerListener(listener);
  },
  registerTimer: (timer: NodeJS.Timeout): void => {
    unifiedCache.registerTimer(timer);
  },
  cleanupMemory: (): void => {
    unifiedCache.cleanupMemory();
  },
  cleanupPolygons: (): void => {
    unifiedCache.cleanupPolygons();
  },
  cleanupMarkers: (): void => {
    unifiedCache.cleanupMarkers();
  },
  clearSearchResults: (): void => {
    unifiedCache.clearSearchResults();
  },
  clearSavedHomes: (): void => {
    unifiedCache.clearSavedHomes();
  },
  clearIsochroneData: (): void => {
    unifiedCache.clearIsochroneData();
  },
  getMemoryStats: (): ReturnType<typeof unifiedCache.getMemoryStats> => {
    return unifiedCache.getMemoryStats();
  },
};

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * Hook for managing unified cache and memory in React components
 */
export function useUnifiedCache() {
  const cacheRef = React.useRef<UnifiedCacheManager | null>(null);

  // Initialize cache
  if (!cacheRef.current) {
    cacheRef.current = unifiedCache;
  }

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (cacheRef.current) {
        cacheRef.current.cleanupMemory();
      }
    };
  }, []);

  return cacheRef.current;
}

/**
 * Utility to create a debounced cleanup function
 */
export function createDebouncedCleanup(delay: number = 1000) {
  let timeoutId: NodeJS.Timeout | null = null;

  return (cleanupFn: () => void) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      cleanupFn();
      timeoutId = null;
    }, delay);
  };
}

/**
 * Utility to batch cleanup operations
 */
export function batchCleanup(cleanupFns: (() => void)[]): void {
  cleanupFns.forEach((fn) => {
    try {
      fn();
    } catch (error) {
      console.warn('Error in batch cleanup:', error);
    }
  });
}

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    unifiedCache.destroy();
  });
}

// Auto-start memory monitoring in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const stats = unifiedCache.getStats();
    if (stats.memoryUsage.total > 0) {
      console.log('🧠 Unified Cache Memory Stats:', stats.memoryUsage);
    }
  }, 30000); // Every 30 seconds
}

