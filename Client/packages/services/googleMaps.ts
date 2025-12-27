import { env } from "../config";
import { mapsApi, type MapsScriptResponse } from "../config/api/maps";
import { asError } from "../utils/error";

/**
 * Google Maps service for managing map initialization, script loading, and map creation
 */
export class GoogleMapsService {
  private static instance: GoogleMapsService;
  private isLoaded = false;
  private isLoading = false;
  private error: string | null = null;
  private scriptUrl: string | null = null;
  private mapId: string | undefined;
  private loadPromise: Promise<void> | null = null;
  private static mapInstanceCount = 0;
  private static activeMapInstances = new Set<google.maps.Map>();

  private constructor() {
    this.mapId = this.getMapId();
  }

  public static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService();
    }
    return GoogleMapsService.instance;
  }

  /**
   * Get map ID from environment variables with proper validation
   */
  private getMapId(): string | undefined {
    try {
      const mapId = env.googleMapsId;
      if (!mapId) {
        console.warn(
          "VITE_GOOGLE_MAPS_ID not configured - using default map styling",
        );
      }
      return mapId;
    } catch {
      console.warn("Could not load config, using fallback");
      return undefined;
    }
  }

  /**
   * Check if Google Maps is already loaded with all required APIs
   */
  public isGoogleMapsReady(): boolean {
    return (
      window.google?.maps?.Map &&
      window.google?.maps?.ControlPosition &&
      typeof window.google?.maps?.MapTypeControlStyle !== "undefined" &&
      typeof window.google?.maps?.Geocoder !== "undefined"
    );
  }

  /**
   * Check for existing Google Maps scripts
   */
  private hasExistingScripts(): boolean {
    const existingScripts = document.querySelectorAll(
      'script[src*="maps.googleapis.com"], script[src*="maps.google.com"]',
    );
    return existingScripts.length > 0;
  }

  /**
   * Wait for Google Maps to be ready after script load
   */
  private waitForGoogleMapsReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 700; // 35 seconds max wait time (700 * 50ms = 35s)

      const checkReady = () => {
        attempts++;

        if (this.isGoogleMapsReady()) {
          this.isLoaded = true;
          this.isLoading = false;
          this.preloadLibraries();
          resolve();
        } else if (attempts >= maxAttempts) {
          const errorMsg =
            "Google Maps initialization timeout after 35 seconds";
          console.error("🗺️ [GMAPS_SERVICE] ❌", errorMsg);
          this.error =
            "Google Maps initialization timeout. Please refresh the page.";
          this.isLoading = false;
          reject(new Error(errorMsg));
        } else {
          setTimeout(checkReady, 50);
        }
      };

      checkReady();
    });
  }

  /**
   * Preload Google Maps libraries for better performance
   */
  private preloadLibraries(): void {
    if (window.google?.maps?.importLibrary) {
      // Preload marker library for AdvancedMarkerElement overlays
      window.google.maps
        .importLibrary("marker")
        .catch((err: unknown) =>
          console.warn("Failed to import marker library:", err),
        );

      // Preload places library for geocoding functionality
      window.google.maps
        .importLibrary("places")
        .catch((err: unknown) =>
          console.warn("Failed to import places library:", err),
        );
    }
  }

  /**
   * Optimize script URL for faster loading
   */
  private optimizeScriptUrl(scriptUrl: string): string {
    const url = new URL(scriptUrl);
    const libraries = new Set(
      (url.searchParams.get("libraries") ?? "").split(",").filter(Boolean),
    );
    libraries.add("marker"); // needed for AdvancedMarkerElement overlays
    libraries.add("places"); // needed for geocoding functionality
    url.searchParams.set("libraries", Array.from(libraries).join(","));

    // Use beta version for better performance
    url.searchParams.set("v", "beta");

    // Add loading optimization parameters
    url.searchParams.set("loading", "async");

    return url.toString();
  }

  /**
   * Load Google Maps script
   */
  public async loadGoogleMapsScript(): Promise<void> {
    // If already loaded, return immediately
    if (this.isLoaded) return;

    // If a load is already in progress, await the same promise
    if (this.loadPromise) return this.loadPromise;

    // Google Maps can be loaded without authentication
    // Removed authentication check to allow loading on public pages

    // Check for existing scripts
    if (this.hasExistingScripts()) {
      try {
        await this.waitForGoogleMapsReady();
        return;
      } catch (error: unknown) {
        console.error(
          "🗺️ [GMAPS_SERVICE] Failed to wait for existing script:",
          error,
        );
        throw error;
      }
    }

    this.isLoading = true;
    this.error = null;

    this.loadPromise = (async () => {
      try {
        // Use sessionStorage cache to avoid refetching key/script url during the session
        const cachedUrl = sessionStorage.getItem("gmaps_script_url");
        if (cachedUrl) {
          this.scriptUrl = cachedUrl;

          // If script already present, just wait until ready
          if (this.hasExistingScripts()) {
            await this.waitForGoogleMapsReady();
            return;
          }

          // Otherwise, load using cached URL
          const optimizedCached = this.optimizeScriptUrl(cachedUrl);
          await this.loadScript(optimizedCached);
          await this.waitForGoogleMapsReady();
          return;
        }

        const data: MapsScriptResponse = await mapsApi.getScriptUrl();

        if (!data.success || !data.script_url) {
          const errorMsg = data.error ?? "No script URL received from server";
          console.error(
            "🗺️ [GMAPS_SERVICE] ❌ Failed to get script URL:",
            errorMsg,
          );
          this.error = errorMsg;
          throw new Error(errorMsg);
        }

        this.scriptUrl = data.script_url;
        try {
          sessionStorage.setItem("gmaps_script_url", data.script_url);
        } catch {
          /* ignore quota or storage errors */
        }

        // Double-check no script was added while we were fetching the URL
        if (this.hasExistingScripts()) {
          await this.waitForGoogleMapsReady();
          return;
        }

        // Optimize script URL
        const finalScriptUrl = this.optimizeScriptUrl(data.script_url);

        // Load Google Maps script
        await this.loadScript(finalScriptUrl);
        await this.waitForGoogleMapsReady();
      } catch (err: unknown) {
        const error = asError(err);
        const errorMsg = error.message;
        console.error(
          "🗺️ [GMAPS_SERVICE] ❌ Error loading Google Maps:",
          errorMsg,
        );
        this.error = errorMsg;
        throw err;
      } finally {
        this.isLoading = false;
        // Reset loadPromise after resolution/rejection to allow retries on future calls
        const previous = this.loadPromise;
        this.loadPromise = null;
        // Avoid unhandled rejections in callers that checked isLoaded separately
        void previous?.catch(() => {});
      }
    })();

    return this.loadPromise;
  }

  /**
   * Load script element
   */
  private loadScript(scriptUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = scriptUrl;
      script.async = true;
      script.defer = true;
      script.id = "google-maps-api"; // Add unique ID to prevent duplicates

      // Suppress CSP test endpoint errors (gen_204) - these are non-critical
      const originalErrorHandler = window.onerror;
      const errorListener = (event: ErrorEvent) => {
        // Ignore Google Maps CSP test endpoint errors (gen_204)
        if (
          event.message?.includes("gen_204") ||
          event.filename?.includes("gen_204") ||
          event.message?.includes("ERR_CONNECTION_CLOSED")
        ) {
          event.preventDefault();
          return true;
        }
        return false;
      };
      window.addEventListener("error", errorListener, { once: true });

      script.onload = () => {
        window.removeEventListener("error", errorListener);
        resolve();
      };

      script.onerror = (error) => {
        window.removeEventListener("error", errorListener);
        // Check if this is a CSP test endpoint error (non-critical)
        const errorMessage = error instanceof ErrorEvent 
          ? error.message 
          : String(error);
        if (errorMessage.includes("gen_204") || errorMessage.includes("ERR_CONNECTION_CLOSED")) {
          // CSP test endpoint errors are non-critical, log as warning instead
          console.warn(
            "🗺️ [GMAPS_SERVICE] ⚠️ Google Maps CSP test endpoint error (non-critical):",
            errorMessage,
          );
          // Still resolve since the main script may have loaded successfully
          resolve();
          return;
        }
        
        console.error(
          "🗺️ [GMAPS_SERVICE] ❌ Failed to load Google Maps script:",
          error,
        );
        console.error("🗺️ [GMAPS_SERVICE] Script URL was:", scriptUrl);
        this.error =
          "Failed to load Google Maps. Please check your connection.";
        this.isLoading = false;
        reject(new Error("Failed to load Google Maps script"));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Create a Google Map instance
   */
  public createMap(container: HTMLElement): google.maps.Map | null {
    if (!this.isGoogleMapsReady()) {
      console.error("Google Maps not ready yet - missing required APIs");
      return null;
    }

    // Check if container already has a map instance
    const existingMapInstance = Array.from(GoogleMapsService.activeMapInstances).find(
      map => map.getDiv() === container
    );
    
    if (existingMapInstance) {
      // Return the existing map instance instead of creating a new one
      return existingMapInstance;
    }

    try {
      const map = new window.google.maps.Map(container, {
        center: { lat: 33.75, lng: -84.39 }, // Default Atlanta center
        zoom: 12, // Default zoom, will be overridden by fitBounds
        mapId: this.mapId ?? undefined, // Map ID for cloud styling
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
        scaleControl: false,
        rotateControl: false,
        keyboardShortcuts: false,
        gestureHandling: "greedy",
        disableDefaultUI: true, // Hide all default UI elements including watermarks
        // Note: NO styles array - using mapId for cloud styling
        // Note: NO mapTypeId override - let cloud styling control the default
      });

      // Track the new map instance
      GoogleMapsService.mapInstanceCount++;
      GoogleMapsService.activeMapInstances.add(map);
      
      return map;
    } catch (err: unknown) {
      const error = asError(err);
      console.error("Error creating Google Map:", error);
      return null;
    }
  }

  /**
   * Trigger map resize event
   */
  public triggerMapResize(map: google.maps.Map): void {
    if (window.google?.maps?.event && map) {
      window.google.maps.event.trigger(map, "resize");
    }
  }

  /**
   * Clean up a map instance and remove it from tracking
   */
  public cleanupMapInstance(map: google.maps.Map): void {
    console.log("🧹 [GMAPS_SERVICE] Cleaning up map instance:", {
      mapInstance: map,
      mapInstanceCount: GoogleMapsService.mapInstanceCount,
      activeMapInstancesCount: GoogleMapsService.activeMapInstances.size,
      timestamp: new Date().toISOString(),
    });

    try {
      // Clear all event listeners first
      if (window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(map);
        console.log("✅ [GMAPS_SERVICE] Cleared all event listeners");
      }

      // Remove from tracking
      if (GoogleMapsService.activeMapInstances.has(map)) {
        GoogleMapsService.activeMapInstances.delete(map);
        console.log("✅ [GMAPS_SERVICE] Map instance removed from tracking:", {
          remainingInstances: GoogleMapsService.activeMapInstances.size,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.warn("⚠️ [GMAPS_SERVICE] Map instance not found in tracking:", {
          mapInstance: map,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.warn("⚠️ [GMAPS_SERVICE] Error during map cleanup:", error);
    }
  }

  /**
   * Clean up all map instances for a specific container
   */
  public cleanupContainerMaps(container: HTMLElement): void {
    console.log("🧹 [GMAPS_SERVICE] Cleaning up all maps for container:", {
      container,
      timestamp: new Date().toISOString(),
    });

    const mapsToCleanup = Array.from(GoogleMapsService.activeMapInstances).filter(
      map => map.getDiv() === container
    );

    console.log("🔍 [GMAPS_SERVICE] Found maps to cleanup:", {
      count: mapsToCleanup.length,
      maps: mapsToCleanup,
    });

    mapsToCleanup.forEach(map => {
      this.cleanupMapInstance(map);
    });

    // Clear the container to ensure clean state
    container.innerHTML = "";
  }

  /**
   * Check if a container already has a map instance
   */
  public hasMapInContainer(container: HTMLElement): boolean {
    return Array.from(GoogleMapsService.activeMapInstances).some(
      map => map.getDiv() === container
    );
  }

  /**
   * Get the map instance for a specific container, if it exists
   */
  public getMapForContainer(container: HTMLElement): google.maps.Map | null {
    return Array.from(GoogleMapsService.activeMapInstances).find(
      map => map.getDiv() === container
    ) || null;
  }

  /**
   * Get current map instance statistics
   */
  public getMapInstanceStats(): {
    totalCreated: number;
    activeInstances: number;
    activeMapInstances: google.maps.Map[];
  } {
    return {
      totalCreated: GoogleMapsService.mapInstanceCount,
      activeInstances: GoogleMapsService.activeMapInstances.size,
      activeMapInstances: Array.from(GoogleMapsService.activeMapInstances),
    };
  }

  /**
   * Get current service state
   */
  public getState() {
    return {
      isLoaded: this.isLoaded,
      isLoading: this.isLoading,
      error: this.error,
      scriptUrl: this.scriptUrl,
    };
  }

  /**
   * Reset service state (useful for testing or cleanup)
   */
  public reset(): void {
    this.isLoaded = false;
    this.isLoading = false;
    this.error = null;
    this.scriptUrl = null;
  }
}

// Export singleton instance
export const googleMapsService = GoogleMapsService.getInstance();

// Global type declaration for Google Maps
declare global {
  interface Window {
    google?: typeof google;
  }
}
