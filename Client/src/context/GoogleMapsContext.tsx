import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

interface GoogleMapsContextType {
  isLoaded: boolean;
  error: string | null;
  scriptUrl: string | null;
  createMap: (container: HTMLElement) => google.maps.Map | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  error: null,
  scriptUrl: null,
  createMap: () => null, // Default no-op function
});

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error("useGoogleMaps must be used within a GoogleMapsProvider");
  }
  return context;
};

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptUrl, setScriptUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get mapId from environment variables with proper validation
  const getMapId = () => {
    const mapId = import.meta.env.VITE_GOOGLE_MAPS_ID;
    if (!mapId) {
      console.warn(
        "VITE_GOOGLE_MAPS_ID not configured - using default map styling",
      );
    }
    return mapId;
  };
  const MAP_ID = getMapId();

  const createMap = useCallback(
    (container: HTMLElement): google.maps.Map | null => {
      if (!isLoaded || !window.google?.maps?.Map) {
        console.error("Google Maps not loaded yet");
        return null;
      }

      // Additional safety check for required APIs
      if (
        !window.google?.maps?.ControlPosition ||
        !window.google?.maps?.MapTypeControlStyle
      ) {
        console.error(
          "Google Maps APIs not fully loaded - missing ControlPosition or MapTypeControlStyle",
        );
        return null;
      }

      try {
        const map = new window.google.maps.Map(container, {
          center: { lat: 33.75, lng: -84.39 }, // Default Atlanta center
          zoom: 12, // Default zoom, will be overridden by fitBounds
          mapId: MAP_ID ?? undefined, // ✅ Map ID for cloud styling
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

        return map;
      } catch (err) {
        console.error("Error creating Google Map:", err);
        return null;
      }
    },
    [isLoaded, MAP_ID],
  );

  useEffect(() => {
    // Check if Google Maps is already loaded with all required APIs
    if (
      window.google?.maps?.Map &&
      window.google?.maps?.ControlPosition &&
      window.google?.maps?.MapTypeControlStyle
    ) {
      setIsLoaded(true);
      return;
    }

    // More comprehensive check for existing Google Maps scripts
    const existingScripts = document.querySelectorAll(
      'script[src*="maps.googleapis.com"], script[src*="maps.google.com"]',
    );
    if (existingScripts.length > 0) {
      const checkLoaded = () => {
        if (
          window.google?.maps?.Map &&
          window.google?.maps?.ControlPosition &&
          window.google?.maps?.MapTypeControlStyle
        ) {
          setIsLoaded(true);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    // Check if we're already in the process of loading
    if (isLoading) {
      return;
    }

    const loadGoogleMaps = async () => {
      // Prevent multiple simultaneous loading attempts
      if (isLoading || isLoaded) {
        return;
      }

      try {
        // Check if user is authenticated using the same logic as authUtils
        const idToken = localStorage.getItem("id_token");
        const token = localStorage.getItem("token");
        const sessionToken = sessionStorage.getItem("access_token");
        const authToken = sessionToken || idToken || token;

        if (!authToken) {
          return;
        }

        setIsLoading(true);

        // Use centralized mapsApi instead of direct fetch
        const { mapsApi } = await import("../api/maps");
        const data = await mapsApi.getScriptUrl();

        if (!data.success || !data.script_url) {
          console.error(
            "🗺️ [GMAPS_CONTEXT] ❌ Failed to get script URL:",
            data.error,
          );
          throw new Error(data.error || "No script URL received from server");
        }

        setScriptUrl(data.script_url);

        // Double-check no script was added while we were fetching the URL
        const scriptsAfterFetch = document.querySelectorAll(
          'script[src*="maps.googleapis.com"], script[src*="maps.google.com"]',
        );
        if (scriptsAfterFetch.length > 0) {
          setIsLoading(false);
          return;
        }

        // Optimize script URL for faster loading
        const url = new URL(data.script_url);
        const libraries = new Set(
          (url.searchParams.get("libraries") || "").split(",").filter(Boolean),
        );
        libraries.add("marker"); // needed for AdvancedMarkerElement overlays
        libraries.add("places"); // needed for geocoding functionality
        url.searchParams.set("libraries", Array.from(libraries).join(","));

        // Use beta version for better performance
        url.searchParams.set("v", "beta");

        // Add loading optimization parameters
        url.searchParams.set("loading", "async");

        const finalScriptUrl = url.toString();

        // Load Google Maps script
        const script = document.createElement("script");
        script.src = finalScriptUrl;
        script.async = true;
        script.defer = true;
        script.id = "google-maps-api"; // Add unique ID to prevent duplicates

        script.onload = async () => {
          // Optimized readiness check with shorter intervals
          let attempts = 0;
          const maxAttempts = 30; // 3 seconds max wait time

          const checkReady = () => {
            attempts++;

            if (
              window.google?.maps?.Map &&
              window.google?.maps?.ControlPosition &&
              window.google?.maps?.MapTypeControlStyle
            ) {
              setIsLoaded(true);
              setIsLoading(false);

              // Preload marker library immediately for faster map creation
              if (window.google?.maps?.importLibrary) {
                window.google.maps
                  .importLibrary("marker")
                  .catch((err: unknown) =>
                    console.warn("Failed to import marker library:", err),
                  );
                // Also preload places library for geocoding
                window.google.maps
                  .importLibrary("places")
                  .catch((err: unknown) =>
                    console.warn("Failed to import places library:", err),
                  );
              }
            } else if (attempts >= maxAttempts) {
              console.error(
                "🗺️ [GMAPS_CONTEXT] ❌ Google Maps initialization timeout after 3 seconds",
              );
              setError(
                "Google Maps initialization timeout. Please refresh the page.",
              );
              setIsLoading(false);
            } else {
              setTimeout(checkReady, 50); // Reduced from 100ms to 50ms
            }
          };
          checkReady();
        };

        script.onerror = (error) => {
          console.error(
            "🗺️ [GMAPS_CONTEXT] ❌ Failed to load Google Maps script:",
            error,
          );
          console.error("🗺️ [GMAPS_CONTEXT] Script URL was:", finalScriptUrl);
          setError("Failed to load Google Maps. Please check your connection.");
          setIsLoading(false);
        };

        document.head.appendChild(script);
      } catch (err) {
        console.error("Error loading Google Maps:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load Google Maps",
        );
        setIsLoading(false);
      }
    };

    loadGoogleMaps();

    // Set up interval to retry loading when user becomes authenticated
    const retryInterval = setInterval(() => {
      const idToken = localStorage.getItem("id_token");
      const token = localStorage.getItem("token");
      const sessionToken = sessionStorage.getItem("access_token");
      const authToken = sessionToken || idToken || token;

      if (authToken && !isLoaded && !error && !isLoading) {
        loadGoogleMaps();
      }
    }, 2000); // Check every 2 seconds

    return () => {
      clearInterval(retryInterval);
    };
  }, [isLoaded, error, isLoading]);

  return (
    <GoogleMapsContext.Provider
      value={{ isLoaded, error, scriptUrl, createMap }}
    >
      {children}
    </GoogleMapsContext.Provider>
  );
}

// Global type declaration for Google Maps
declare global {
  interface Window {
    google?: any;
  }
}
