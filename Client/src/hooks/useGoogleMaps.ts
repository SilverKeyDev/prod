import { useState, useEffect } from 'react';

export default function useGoogleMaps(apiKey: string, libraries: string[] = ['places'], version: string = 'weekly') {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setError('Google Maps API key is required');
      return;
    }

    // Check if script is already loaded
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`);
    if (existingScript) {
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

    // Load the script
    const script = document.createElement('script');
    const librariesParam = libraries.length > 0 ? `&libraries=${libraries.join(',')}` : '';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${librariesParam}&v=${version}&loading=async&callback=Function.prototype`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.google?.maps) {
        // Load the web component if needed
        if (!document.querySelector('script[src*="extended-component-library"]')) {
          const webComponentScript = document.createElement('script');
          webComponentScript.src = 'https://unpkg.com/@googlemaps/extended-component-library@latest/dist/loader.js';
          webComponentScript.async = true;
          webComponentScript.onload = () => {
            // Initialize the web component loader
            if (window.initMapScripts) {
              window.initMapScripts();
            }
            setIsLoaded(true);
          };
          document.head.appendChild(webComponentScript);
        } else {
          setIsLoaded(true);
        }
      } else {
        setError('Google Maps API loaded but not properly initialized');
      }
    };
    
    script.onerror = () => {
      setError('Failed to load Google Maps script. Please check your API key or internet connection.');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup function to remove the script if the component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [apiKey, libraries, version]);

  return { isLoaded, error };
}
