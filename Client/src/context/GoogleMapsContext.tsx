import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface GoogleMapsContextType {
  isLoaded: boolean;
  error: string | null;
  scriptUrl: string | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  error: null,
  scriptUrl: null,
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

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    // More comprehensive check for existing Google Maps scripts
    const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"], script[src*="maps.google.com"]');
    if (existingScripts.length > 0) {
      console.log(`Found ${existingScripts.length} existing Google Maps script(s), waiting for load...`);
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
          console.log("⏳ Waiting for user authentication to load Google Maps");
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
          console.log('Google Maps script was added by another component, aborting duplicate load');
          setIsLoading(false);
          return;
        }

        // Load Google Maps script
        const script = document.createElement("script");
        script.src = data.script_url;
        script.async = true;
        script.defer = true;
        script.id = 'google-maps-api'; // Add unique ID to prevent duplicates

        script.onload = () => {
          console.log('Google Maps script loaded, initializing...');
          // Wait for Google Maps to be fully initialized with timeout
          let attempts = 0;
          const maxAttempts = 50; // 5 seconds max wait time
          
          const checkGoogleMapsReady = () => {
            attempts++;
            
            if (window.google?.maps?.Map && window.google?.maps?.places?.PlacesService) {
              console.log("✅ Google Maps loaded successfully with all required services");
              setIsLoaded(true);
              setIsLoading(false);
            } else if (attempts >= maxAttempts) {
              console.error("❌ Google Maps initialization timeout after 5 seconds");
              setError("Google Maps initialization timeout. Please refresh the page.");
              setIsLoading(false);
            } else if (window.google?.maps) {
              // Google Maps is loading but not all services are ready yet
              setTimeout(checkGoogleMapsReady, 100);
            } else {
              setTimeout(checkGoogleMapsReady, 100);
            }
          };
          
          // Start checking immediately
          checkGoogleMapsReady();
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
        console.log('Google Maps script added to DOM');

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
        console.log("🔄 User authenticated, retrying Google Maps load");
        loadGoogleMaps();
      }
    }, 2000); // Check every 2 seconds

    return () => {
      clearInterval(retryInterval);
    };
  }, [isLoaded, error, isLoading]);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, error, scriptUrl }}>
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
