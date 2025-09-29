// Google Maps API type definitions for better type safety

export type GoogleMapsWindow = Window & {
  google: {
    maps: {
      places: {
        AutocompleteSessionToken: new () => Record<string, unknown>;
        AutocompleteSuggestion: {
          fetchAutocompleteSuggestions: (
            request: AutocompleteRequest,
          ) => Promise<{
            suggestions: AutocompleteSuggestion[];
          }>;
        };
      };
    };
  };
};

export type AutocompleteRequest = {
  input: string;
  sessionToken: google.maps.places.AutocompleteSessionToken;
  componentRestrictions?: {
    country: string;
  };
};

export type AutocompleteSuggestion = {
  placePrediction: {
    text: {
      text: string;
    };
    toPlace: () => google.maps.places.Place;
  };
};

// Marker types
export type LocationMarker = {
  position: google.maps.LatLngLiteral;
  title: string;
  icon?: string | google.maps.Icon | google.maps.Symbol;
  map?: google.maps.Map;
};

// Document types for better type safety
export type DocumentWithBody = Document & {
  body: HTMLElement;
};
