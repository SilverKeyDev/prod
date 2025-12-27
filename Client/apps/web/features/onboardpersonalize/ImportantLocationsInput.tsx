import { MapPin, Plus, X, Clock } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

import { Input } from "../../components/ui/form/Input";
import type { GoogleMapsWindow } from "../../../../packages/schemas/google-maps";
import { asError } from "../../../../packages/utils/error";
import {
  isObject,
  hasProperty,
  isFunction,
} from "../../../../packages/utils/typeGuards";

type ImportantLocation = {
  name: string;
  address: string;
  commute_tolerance?: number;
};

// Google Places API types
interface GooglePlacePrediction {
  text: {
    text: string;
  };
  toPlace: () => google.maps.places.Place;
}

type Suggestion = {
  placePrediction: GooglePlacePrediction;
  description: string;
};

type ImportantLocationsInputProps = {
  locations: ImportantLocation[];
  onChange: (locations: ImportantLocation[]) => void;
  scriptsReady: boolean;
  isEditMode?: boolean;
};

const ImportantLocationsInput: React.FC<ImportantLocationsInputProps> = ({
  locations,
  onChange,
  scriptsReady,
  isEditMode = true,
}) => {
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [commuteTime, setCommuteTime] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [hasSelected, setHasSelected] = useState(false);

  const addressInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Fetch autocomplete suggestions as the user types
  useEffect(() => {
    if (!scriptsReady || locationAddress.trim().length < 3 || hasSelected) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const googleMapsWindow = window as unknown as GoogleMapsWindow;
        const sessionToken =
          new googleMapsWindow.google.maps.places.AutocompleteSessionToken();
        const request = {
          input: locationAddress,
          sessionToken,
          includedRegionCodes: ["US"],
        };

        const { suggestions: fetched } =
          await googleMapsWindow.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            request
          );

        const built: Suggestion[] = (
          fetched as Array<{ placePrediction: GooglePlacePrediction | null }>
        ).flatMap((s) => {
          const prediction = s.placePrediction;
          if (!prediction) return [];
          return [
            {
              description: prediction.text.text,
              placePrediction: prediction,
            },
          ];
        });
        setSuggestions(built);
      } catch (err: unknown) {
        const error = asError(err);
        console.error("Autocomplete fetch error:", error);
        setSuggestions([]);
      }
    };

    const debounce = void void setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(debounce);
  }, [locationAddress, scriptsReady, hasSelected]);

  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasSelected(false);
    setLocationAddress(e.target.value);
  };

  const handleSelect = async (suggestion: Suggestion) => {
    setHasSelected(true);
    const suggestionData = suggestion as Record<string, unknown>;
    const placePrediction = suggestionData.placePrediction as Record<
      string,
      unknown
    >;
    const place =
      placePrediction &&
      typeof placePrediction === "object" &&
      "toPlace" in placePrediction &&
      typeof placePrediction.toPlace === "function"
        ? (placePrediction as { toPlace: () => unknown }).toPlace()
        : null;

    if (
      isObject(place) &&
      hasProperty(place, "fetchFields") &&
      isFunction(place.fetchFields)
    ) {
      try {
        // Call fetchFields with proper 'this' binding to preserve Google Maps context
        const fetchFieldsMethod = place.fetchFields;
        if (typeof fetchFieldsMethod === "function") {
          await fetchFieldsMethod.call(place, {
            fields: ["displayName", "formattedAddress"],
          });
        }
      } catch (error) {
        console.warn("Error fetching place fields:", error);
      }

      if (
        hasProperty(place, "formattedAddress") &&
        typeof place.formattedAddress === "string"
      ) {
        setLocationAddress(place.formattedAddress);
      }
    }
    setSuggestions([]);
  };

  const handleAddLocation = () => {
    if (locationName.trim() && locationAddress.trim()) {
      // Parse commute time - default to undefined if empty or invalid
      const parsedCommuteTime = commuteTime.trim() === "" 
        ? undefined 
        : parseInt(commuteTime.trim(), 10);
      
      // Only add commute_tolerance if it's a valid number >= 0
      const commuteTolerance = parsedCommuteTime !== undefined && !isNaN(parsedCommuteTime) && parsedCommuteTime >= 0
        ? parsedCommuteTime
        : undefined;

      const newLocation: ImportantLocation = {
        name: locationName.trim(),
        address: locationAddress.trim(),
        commute_tolerance: commuteTolerance,
      };
      onChange([...locations, newLocation]);
      setLocationName("");
      setLocationAddress("");
      setCommuteTime("");
      setIsAddingLocation(false);
      setHasSelected(false);
    }
  };

  const handleRemoveLocation = (index: number) => {
    const updatedLocations = locations.filter((_, i) => i !== index);
    onChange(updatedLocations);
  };

  const handleCancel = () => {
    setLocationName("");
    setLocationAddress("");
    setCommuteTime("");
    setIsAddingLocation(false);
    setHasSelected(false);
    setSuggestions([]);
  };

  return (
    <div className="space-y-4">
      {/* Existing Locations */}
      {locations.length > 0 && (
        <div className="space-y-3">
          {locations.map((location, index) => (
            <div
              key={index}
              className="flex items-start justify-between rounded-lg border border-beige bg-beige/20 p-3"
            >
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-medium text-black">
                  {location.name}
                </h4>
                <p className="mt-1 break-words text-xs text-black/60">
                  {location.address}
                </p>
                {location.commute_tolerance && (
                  <p className="mt-1 text-xs text-brown">
                    Max commute: {location.commute_tolerance} minutes
                  </p>
                )}
              </div>
              {isEditMode && (
                <button
                  onClick={() => handleRemoveLocation(index)}
                  className="cursor-pointer rounded p-1 text-rose transition-colors hover:bg-rose-50 hover:text-rose-light"
                  title="Remove location"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add New Location */}
      {isEditMode && (
        <>
          {!isAddingLocation ? (
            <button
              onClick={() => setIsAddingLocation(true)}
              className="flex w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-3 text-gray-500 transition-colors hover:border-brown hover:text-brown"
            >
              <Plus className="h-4 w-4" />
              Add Important Location
            </button>
          ) : (
            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              {/* Location Name Input */}
              <Input
                ref={nameInputRef}
                label="Location Name"
                type="text"
                value={locationName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLocationName(e.target.value)
                }
                placeholder="e.g., Work, Mom's House, Gym"
                autoComplete="off"
                size="md"
              />

              {/* Address Input with Autocomplete */}
              <div className="relative">
                <Input
                  ref={addressInputRef}
                  label="Address"
                  type="text"
                  value={locationAddress}
                  onChange={handleAddressInputChange}
                  placeholder={
                    scriptsReady ? "Search for address..." : "Loading..."
                  }
                  disabled={!scriptsReady}
                  leftIcon={<MapPin className="h-4 w-4" />}
                  autoComplete="off"
                  size="md"
                />

                {/* Address Suggestions */}
                {suggestions.length > 0 && (
                  <ul className="relative z-50 mt-2 max-h-60 overflow-hidden overflow-y-auto rounded-md border bg-white shadow-sm">
                    {suggestions.map((s, idx) => (
                      <li key={idx}>
                        <button
                          onClick={handleSelect.bind(null, s)}
                          className="w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-gray-100"
                        >
                          {s.description}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Commute Tolerance Input */}
              <Input
                label="Max Commute Time (minutes)"
                type="number"
                value={commuteTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  // Allow empty string or any numeric input (0-9 only, handled by type="number")
                  // Only update if it's empty or contains valid numeric characters
                  if (value === "" || /^\d*$/.test(value)) {
                    setCommuteTime(value);
                  }
                }}
                placeholder="30"
                min="0"
                max="180"
                leftIcon={<Clock className="h-4 w-4" />}
                autoComplete="off"
                size="md"
                helperText="Maximum acceptable commute time to this location"
              />

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleAddLocation}
                  disabled={!locationName.trim() || !locationAddress.trim()}
                  className="cursor-pointer rounded-lg bg-olive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-olive/80 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  Add Location
                </button>
                <button
                  onClick={handleCancel}
                  className="cursor-pointer rounded-lg bg-brown px-4 py-2 text-white transition-colors hover:bg-brown/90"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImportantLocationsInput;
