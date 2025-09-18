/**
 * Common utilities and shared logic for search functionality
 * Consolidates duplicate code patterns across search components
 */

import type { PropertyDetails } from '../../../core/schemas/search';

/**
 * Common property formatting utilities
 */
export const propertyUtils = {
  /**
   * Format price for display
   */
  formatPrice: (price: string | number): string => {
    if (typeof price === 'string') {
      return price.startsWith('$') ? price : `$${price}`;
    }
    return `$${price?.toLocaleString() ?? 'N/A'}`;
  },

  /**
   * Format address for display
   */
  formatAddress: (address: string | number): string => {
    return typeof address === 'string' || typeof address === 'number'
      ? address.toString()
      : '[Invalid address]';
  },

  /**
   * Calculate property score
   */
  calculateScore: (property: PropertyDetails): number => {
    return property._score || property.calculatedScore || 0;
  },

  /**
   * Check if property has valid coordinates
   */
  hasValidCoordinates: (property: PropertyDetails): boolean => {
    return !isNaN(property.lat) && !isNaN(property.lng) && 
           property.lat !== 0 && property.lng !== 0;
  },

  /**
   * Get property display image
   */
  getDisplayImage: (property: PropertyDetails): string | undefined => {
    return (
      (property as any).imageUrl ||
      (property as any).image_url ||
      (property as any).imageSrc ||
      (property as any).imgSrc ||
      (property as any).images?.[0]?.url ||
      (property as any).imgUrl
    );
  },

  /**
   * Convert PropertyDetails to SearchResult format (for compatibility with saved homes)
   * This ensures both search results and saved homes use the same data structure
   */
  convertToSearchResult: (property: PropertyDetails) => ({
    id: property.id,
    address: property.address,
    price: typeof property.price === 'string' 
      ? property.price 
      : property.price.toString(),
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    sqft: property.sqft,
    lat: property.lat,
    lng: property.lng,
    lotSize: property.lotSize,
    propertyType: property.propertyType as string,
    listingStatus: property.listingStatus as string,
    imageUrl:
      (property as any).imageUrl ||
      (property as any).image_url ||
      (property as any).imageSrc ||
      (property as any).imgSrc ||
      (property as any).images?.[0]?.url ||
      (property as any).imgUrl,
    _score: property._score || property.calculatedScore || 0,
  }),

  /**
   * Convert array of PropertyDetails to SearchResult format
   */
  convertArrayToSearchResults: (properties: PropertyDetails[]) => {
    return properties.map(propertyUtils.convertToSearchResult);
  },

  /**
   * Convert PropertyDetails to PropertyDetails format (ensures consistent structure)
   * This normalizes the data structure while preserving all fields including score
   */
  normalizePropertyDetails: (property: PropertyDetails) => ({
    id: property.id,
    address: property.address,
    price: typeof property.price === 'string' 
      ? property.price.startsWith('$') ? property.price : `$${property.price}`
      : typeof property.price === 'number'
      ? `$${property.price.toLocaleString()}`
      : String(property.price),
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    sqft: property.sqft ?? 0,
    lat: property.lat,
    lng: property.lng,
    lotSize: property.lotSize,
    propertyType: property.propertyType,
    listingStatus: property.listingStatus,
    imageUrl:
      (property as any).imageUrl ||
      (property as any).image_url ||
      (property as any).imageSrc ||
      (property as any).imgSrc ||
      (property as any).images?.[0]?.url ||
      (property as any).imgUrl,
    images: property.images,
    calculatedScore: property.calculatedScore,
    _score: property._score || property.calculatedScore || 0,
  }),

  /**
   * Convert array of PropertyDetails to normalized PropertyDetails format
   */
  normalizeArrayToPropertyDetails: (properties: PropertyDetails[]) => {
    return properties.map(propertyUtils.normalizePropertyDetails);
  },
};

/**
 * Common validation utilities
 */
export const validationUtils = {
  /**
   * Validate property data
   */
  validateProperty: (property: unknown): property is PropertyDetails => {
    return (
      typeof property === 'object' &&
      property !== null &&
      typeof (property as PropertyDetails).id === 'string' &&
      typeof (property as PropertyDetails).address === 'string' &&
      typeof (property as PropertyDetails).lat === 'number' &&
      typeof (property as PropertyDetails).lng === 'number'
    );
  },

  /**
   * Validate search results array
   */
  validateSearchResults: (results: unknown[]): PropertyDetails[] => {
    return results.filter(validationUtils.validateProperty);
  },

  /**
   * Validate pagination parameters
   */
  validatePagination: (page: number, perPage: number, total: number): {
    isValid: boolean;
    correctedPage: number;
    correctedPerPage: number;
  } => {
    const correctedPerPage = Math.max(1, Math.min(perPage, 100));
    const maxPage = Math.max(0, Math.ceil(total / correctedPerPage) - 1);
    const correctedPage = Math.max(0, Math.min(page, maxPage));
    
    return {
      isValid: page === correctedPage && perPage === correctedPerPage,
      correctedPage,
      correctedPerPage,
    };
  },
};

/**
 * Common event handler utilities
 */
export const eventHandlerUtils = {
  /**
   * Create safe event handler with error handling
   */
  createSafeHandler: <T extends (...args: any[]) => any>(
    handler: T,
    context: string,
    onError?: (error: Error, context: string) => void
  ): T => {
    return ((...args: Parameters<T>) => {
      try {
        return handler(...args);
      } catch (error) {
        const err = error as Error;
        console.error(`❌ Error in ${context}:`, err);
        onError?.(err, context);
        return undefined;
      }
    }) as T;
  },

  /**
   * Create debounced event handler
   */
  createDebouncedHandler: <T extends (...args: any[]) => any>(
    handler: T,
    delay: number = 300
  ): T => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    return ((...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        handler(...args);
        timeoutId = null;
      }, delay);
    }) as T;
  },

  /**
   * Create throttled event handler
   */
  createThrottledHandler: <T extends (...args: any[]) => any>(
    handler: T,
    delay: number = 300
  ): T => {
    let lastCall = 0;
    
    return ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        handler(...args);
        lastCall = now;
      }
    }) as T;
  },
};

/**
 * Common state management utilities
 */
export const stateUtils = {
  /**
   * Create state updater with validation
   */
  createValidatedUpdater: <T>(
    setter: (value: T) => void,
    validator: (value: T) => boolean,
    context: string
  ) => {
    return (value: T) => {
      if (validator(value)) {
        setter(value);
      } else {
        console.warn(`⚠️ Invalid state update in ${context}:`, value);
      }
    };
  },

  /**
   * Create state updater with transformation
   */
  createTransformedUpdater: <T, U>(
    setter: (value: T) => void,
    transformer: (value: U) => T,
    context: string
  ) => {
    return (value: U) => {
      try {
        const transformed = transformer(value);
        setter(transformed);
      } catch (error) {
        console.error(`❌ Error transforming state in ${context}:`, error);
      }
    };
  },

  /**
   * Create state updater with side effects
   */
  createSideEffectUpdater: <T>(
    setter: (value: T) => void,
    sideEffect: (value: T) => void,
    context: string
  ) => {
    return (value: T) => {
      try {
        setter(value);
        sideEffect(value);
      } catch (error) {
        console.error(`❌ Error in side effect for ${context}:`, error);
      }
    };
  },
};

/**
 * Common API utilities
 */
export const apiUtils = {
  /**
   * Create API request with retry logic
   */
  createRetryRequest: async <T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          console.warn(`⚠️ API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`);
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
        }
      }
    }
    
    throw lastError || new Error('API request failed after all retries');
  },

  /**
   * Create API request with timeout
   */
  createTimeoutRequest: async <T>(
    requestFn: () => Promise<T>,
    timeoutMs: number = 10000
  ): Promise<T> => {
    return Promise.race([
      requestFn(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
      }),
    ]);
  },

  /**
   * Create API request with caching
   */
  createCachedRequest: <T>(
    requestFn: () => Promise<T>,
    cacheDuration: number = 5 * 60 * 1000 // 5 minutes
  ) => {
    let cache: { data: T; timestamp: number } | null = null;
    
    return async (): Promise<T> => {
      if (cache && Date.now() - cache.timestamp < cacheDuration) {
        return cache.data;
      }
      
      const data = await requestFn();
      cache = { data, timestamp: Date.now() };
      return data;
    };
  },
};

/**
 * Common UI utilities
 */
export const uiUtils = {
  /**
   * Create responsive class names
   */
  createResponsiveClasses: (baseClasses: string, responsiveClasses: Record<string, string>): string => {
    const classes = [baseClasses];
    
    Object.entries(responsiveClasses).forEach(([breakpoint, className]) => {
      classes.push(`${breakpoint}:${className}`);
    });
    
    return classes.join(' ');
  },

  /**
   * Create conditional class names
   */
  createConditionalClasses: (baseClasses: string, conditions: Record<string, boolean>): string => {
    const classes = [baseClasses];
    
    Object.entries(conditions).forEach(([className, condition]) => {
      if (condition) {
        classes.push(className);
      }
    });
    
    return classes.join(' ');
  },

  /**
   * Create loading state class names
   */
  createLoadingClasses: (baseClasses: string, isLoading: boolean): string => {
    return uiUtils.createConditionalClasses(baseClasses, {
      'opacity-50': isLoading,
      'pointer-events-none': isLoading,
      'animate-pulse': isLoading,
    });
  },
};

/**
 * Common error handling utilities
 */
export const errorUtils = {
  /**
   * Create error boundary props
   */
  createErrorBoundaryProps: (context: string, onError?: (error: Error, context: string) => void) => ({
    onError: (error: Error, errorInfo: React.ErrorInfo) => {
      console.error(`🔴 Error in ${context}:`, error, errorInfo);
      onError?.(error, context);
    },
  }),

  /**
   * Create error handler for async operations
   */
  createAsyncErrorHandler: (context: string, onError?: (error: Error, context: string) => void) => {
    return (error: Error) => {
      console.error(`❌ Async error in ${context}:`, error);
      onError?.(error, context);
    };
  },

  /**
   * Create error handler for event handlers
   */
  createEventHandlerErrorHandler: (context: string, onError?: (error: Error, context: string) => void) => {
    return (error: Error) => {
      console.error(`❌ Event handler error in ${context}:`, error);
      onError?.(error, context);
    };
  },
};

/**
 * Common performance utilities
 */
export const performanceUtils = {
  /**
   * Create performance monitor
   */
  createPerformanceMonitor: (name: string) => {
    const start = performance.now();
    
    return {
      end: () => {
        const duration = performance.now() - start;
        console.log(`⏱️ ${name} took ${duration.toFixed(2)}ms`);
        return duration;
      },
    };
  },

  /**
   * Create debounced performance monitor
   */
  createDebouncedPerformanceMonitor: (name: string, delay: number = 1000) => {
    let lastCall = 0;
    
    return {
      log: (message: string) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
          console.log(`⏱️ ${name}: ${message}`);
          lastCall = now;
        }
      },
    };
  },
};

/**
 * Common constants
 */
export const constants = {
  PROPERTIES_PER_PAGE: 1,
  DEFAULT_MAP_ZOOM: 12,
  DEFAULT_MAP_CENTER: { lat: 40.7128, lng: -74.0060 }, // New York
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,
  RETRY_DELAY: 1000,
  MAX_RETRIES: 3,
  REQUEST_TIMEOUT: 10000,
} as const;

/**
 * Common type guards
 */
export const typeGuards = {
  isString: (value: unknown): value is string => typeof value === 'string',
  isNumber: (value: unknown): value is number => typeof value === 'number',
  isBoolean: (value: unknown): value is boolean => typeof value === 'boolean',
  isObject: (value: unknown): value is Record<string, unknown> => 
    typeof value === 'object' && value !== null,
  isArray: (value: unknown): value is unknown[] => Array.isArray(value),
  isFunction: (value: unknown): value is Function => typeof value === 'function',
} as const;
