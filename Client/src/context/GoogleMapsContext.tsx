import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
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

  // Get mapId from environment variables
  const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_ID;

  const createMap = (container: HTMLElement): google.maps.Map | null => {
    if (!isLoaded || !window.google?.maps) {
      console.error("Google Maps not loaded yet");
      return null;
    }

    try {
      const map = new window.google.maps.Map(container, {
        center: { lat: 33.75, lng: -84.39 }, // Default Atlanta center
        zoom: 12, // Default zoom, will be overridden by fitBounds
        mapId: MAP_ID ?? undefined, // ✅ Map ID for cloud styling
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: window.google.maps.ControlPosition.TOP_RIGHT,
          mapTypeIds: ["roadmap", "satellite"], // styling affects roadmap only
        },
        gestureHandling: "greedy",
        // Note: NO styles array - using mapId for cloud styling
        // Note: NO mapTypeId override - let cloud styling control the default
      });

      // Runtime sanity checks
      console.log("Using mapId:", MAP_ID);
      console.log("Map type:", map.getMapTypeId()); // should be 'roadmap'
      
      // Some builds expose capabilities on vector maps:
      console.log("Vector caps:", (map as any).getMapCapabilities?.());

      return map;
    } catch (err) {
      console.error("Error creating Google Map:", err);
      return null;
    }
  };

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    // More comprehensive check for existing Google Maps scripts
    const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"], script[src*="maps.google.com"]');
    if (existingScripts.length > 0) {
      const checkLoaded = () => {
        if (window.google?.maps) {
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
        // Check if user is authenticated
        const idToken = localStorage.getItem("id_token");
        if (!idToken) {
          // Don't set error, just wait for authentication
          return;
        }

        setIsLoading(true);

        const response = await fetch("/api/maps/script", {
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch Google Maps script URL: ${response.status}`);
        }

        const data = await response.json();
        if (!data.script_url) {
          throw new Error("No script URL received from server");
        }

        setScriptUrl(data.script_url);

        // Double-check no script was added while we were fetching the URL
        const scriptsAfterFetch = document.querySelectorAll('script[src*="maps.googleapis.com"], script[src*="maps.google.com"]');
        if (scriptsAfterFetch.length > 0) {
          setIsLoading(false);
          return;
        }

        // Normalize script URL for vector maps and libraries
        const url = new URL(data.script_url);
        const libs = new Set((url.searchParams.get("libraries") || "").split(",").filter(Boolean));
        libs.add("marker"); // needed for AdvancedMarkerElement overlays
        // libs.add("places"); // only if you use Places
        url.searchParams.set("libraries", Array.from(libs).join(","));
        if (!url.searchParams.get("v")) url.searchParams.set("v", "weekly");
        // Do NOT add map_ids= in script URL; pass mapId only via MapOptions
        const finalScriptUrl = url.toString();

        // Load Google Maps script
        const script = document.createElement("script");
        script.src = finalScriptUrl;
        script.async = true;
        script.defer = true;
        script.id = 'google-maps-api'; // Add unique ID to prevent duplicates

        script.onload = async () => {
          // Wait for core Google Maps API to be ready (don't wait for Places)
          let attempts = 0;
          const maxAttempts = 50; // 5 seconds max wait time
          
          const checkReady = () => {
            attempts++;
            if (window.google?.maps?.Map) {
              setIsLoaded(true);
              setIsLoading(false);
              
              // Optionally import libraries after core API is ready
              if (window.google?.maps?.importLibrary) {
                window.google.maps.importLibrary("marker").catch((err: unknown) => 
                  console.warn("Failed to import marker library:", err)
                );

              }
            } else if (attempts >= maxAttempts) {
              console.error("❌ Google Maps initialization timeout after 5 seconds");
              setError("Google Maps initialization timeout. Please refresh the page.");
              setIsLoading(false);
            } else {
              setTimeout(checkReady, 100);
            }
          };
          
          // Start checking immediately
          checkReady();
        };

        script.onerror = () => {
          console.error('Failed to load Google Maps script');
          setError("Failed to load Google Maps script. Please check your API key or internet connection.");
          setIsLoading(false);
        };

        // Final check before adding to DOM
        const finalCheck = document.getElementById('google-maps-api');
        if (finalCheck) {
          console.log('Google Maps script already exists in DOM, aborting');
          setIsLoading(false);
          return;
        }

        document.head.appendChild(script);

      } catch (err) {
        console.error("Error loading Google Maps:", err);
        setError(err instanceof Error ? err.message : "Failed to load Google Maps");
        setIsLoading(false);
      }
    };

    loadGoogleMaps();

    // Set up interval to retry loading when user becomes authenticated
    const retryInterval = setInterval(() => {
      const idToken = localStorage.getItem("id_token");
      if (idToken && !isLoaded && !error) {
        loadGoogleMaps();
      }
    }, 100); // Check every 2 seconds

    return () => {
      clearInterval(retryInterval);
    };
  }, [isLoaded, error, isLoading]);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, error, scriptUrl, createMap }}>
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
