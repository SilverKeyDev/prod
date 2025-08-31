import React, { useState, useRef, useEffect } from "react";
import { MapPin, Plus, X, Clock } from "lucide-react";
import Input from "../base/Input";

interface ImportantLocation {
  name: string;
  address: string;
  commute_tolerance?: number;
}

interface Suggestion {
  placePrediction: any;
  description: string;
}

interface ImportantLocationsInputProps {
  locations: ImportantLocation[];
  onChange: (locations: ImportantLocation[]) => void;
  scriptsReady: boolean;
  isEditMode?: boolean;
}

const ImportantLocationsInput: React.FC<ImportantLocationsInputProps> = ({
  locations,
  onChange,
  scriptsReady,
  isEditMode = true,
}) => {
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [commuteTime, setCommuteTime] = useState<number>(30);
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
        const sessionToken =
          new window.google.maps.places.AutocompleteSessionToken();
        const request = {
          input: locationAddress,
          sessionToken,
          componentRestrictions: { country: 'US' },
        };

        const { suggestions: fetched } =
          await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            request
          );

        setSuggestions(
          fetched.map((s: any) => ({
            description: s.placePrediction.text.text,
            placePrediction: s.placePrediction,
          }))
        );
      } catch (err) {
        console.error("Autocomplete fetch error:", err);
        setSuggestions([]);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(debounce);
  }, [locationAddress, scriptsReady, hasSelected]);

  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasSelected(false);
    setLocationAddress(e.target.value);
  };

  const handleSelect = async (suggestion: Suggestion) => {
    setHasSelected(true);
    const place = suggestion.placePrediction.toPlace();
    await place.fetchFields({
      fields: ["displayName", "formattedAddress"],
    });
    setLocationAddress(place.formattedAddress);
    setSuggestions([]);
  };

  const handleAddLocation = () => {
    if (locationName.trim() && locationAddress.trim()) {
      const newLocation: ImportantLocation = {
        name: locationName.trim(),
        address: locationAddress.trim(),
        commute_tolerance: commuteTime,
      };
      onChange([...locations, newLocation]);
      setLocationName("");
      setLocationAddress("");
      setCommuteTime(30);
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
    setCommuteTime(30);
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
              className="flex items-start justify-between p-3 bg-beige/20 rounded-lg border border-beige"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-black text-sm">{location.name}</h4>
                <p className="text-xs text-black/60 mt-1 break-words">{location.address}</p>
                {location.commute_tolerance && (
                  <p className="text-xs text-brown mt-1">
                    Max commute: {location.commute_tolerance} minutes
                  </p>
                )}
              </div>
              {isEditMode && (
                <button
                  type="button"
                  onClick={() => handleRemoveLocation(index)}
                  className="ml-3 p-1 text-black/40 hover:text-red-500 transition-colors flex-shrink-0"
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
              type="button"
              onClick={() => setIsAddingLocation(true)}
              className="flex items-center space-x-2 text-brown hover:text-brown/80 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Add Important Location</span>
            </button>
          ) : (
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {/* Location Name Input */}
          <Input
            ref={nameInputRef}
            label="Location Name"
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
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
              placeholder={scriptsReady ? "Search for address..." : "Loading..."}
              disabled={!scriptsReady}
              leftIcon={<MapPin className="h-4 w-4" />}
              autoComplete="off"
              size="md"
            />

            {/* Address Suggestions */}
            {suggestions.length > 0 && (
              <ul className="border mt-2 rounded-md overflow-hidden shadow-sm bg-white z-50 relative max-h-60 overflow-y-auto">
                {suggestions.map((s, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSelect(s)}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0 text-gray-600 text-xs sm:text-sm md:text-base text-left leading-tight"
                  >
                    {s.description}
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
            onChange={(e) => setCommuteTime(parseInt(e.target.value) || 30)}
            placeholder="30"
            min="5"
            max="180"
            leftIcon={<Clock className="h-4 w-4" />}
            autoComplete="off"
            size="md"
            helperText="Maximum acceptable commute time to this location"
          />

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleAddLocation}
              disabled={!locationName.trim() || !locationAddress.trim()}
              className="px-4 py-2 bg-olive text-white text-sm font-medium rounded-lg hover:bg-olive/80 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Add Location
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
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
