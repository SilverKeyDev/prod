import React, { useEffect, useRef, useState } from "react";

import { Icon } from "@ui/icons";

import { log, LOG_CATEGORIES } from "packages/logger";
import type { GoogleMapsWindow } from "packages/types/google-maps";
import { Input } from "packages/ui/components/form/Input";
import { BodyText, Button, CancelButton, IconButton } from "packages/ui/components/index.web";
import { asError } from "packages/utils";
import { hasProperty, isFunction, isObject } from "packages/utils";
import { getWindow } from "packages/utils/platform";
type ImportantLocation = {
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [locationAddress, setLocationAddress] = useState("");
  const [commuteTime, setCommuteTime] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [hasSelected, setHasSelected] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const isFormVisible = isAddingLocation || editingIndex !== null;
  // Fetch autocomplete suggestions as the user types
  useEffect(() => {
    if (!scriptsReady || locationAddress.trim().length < 3 || hasSelected) {
      setSuggestions([]);
      return;
    }
    const fetchSuggestions = async () => {
      try {
        const win = getWindow();
        const googleMapsWindow = win as unknown as GoogleMapsWindow | null;
        if (!googleMapsWindow?.google?.maps?.places) {
          setSuggestions([]);
          return;
        }
        const sessionToken = new googleMapsWindow.google.maps.places.AutocompleteSessionToken();
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
          fetched as Array<{
            placePrediction: GooglePlacePrediction | null;
          }>
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
        log.error(LOG_CATEGORIES.ERRORS, "Autocomplete fetch error", error);
        setSuggestions([]);
      }
    };
    const t = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(t);
  }, [locationAddress, scriptsReady, hasSelected]);
  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasSelected(false);
    setLocationAddress(e.target.value);
  };
  const handleSelect = async (suggestion: Suggestion) => {
    setHasSelected(true);
    const suggestionData = suggestion as Record<string, unknown>;
    const placePrediction = suggestionData.placePrediction as Record<string, unknown>;
    const place =
      placePrediction &&
      typeof placePrediction === "object" &&
      "toPlace" in placePrediction &&
      typeof placePrediction.toPlace === "function"
        ? (
            placePrediction as {
              toPlace: () => unknown;
            }
          ).toPlace()
        : null;
    if (isObject(place) && hasProperty(place, "fetchFields") && isFunction(place.fetchFields)) {
      try {
        // Call fetchFields with proper 'this' binding to preserve Google Maps context
        const fetchFieldsMethod = place.fetchFields;
        if (typeof fetchFieldsMethod === "function") {
          await fetchFieldsMethod.call(place, {
            fields: ["displayName", "formattedAddress"],
          });
        }
      } catch (error) {
        log.warn(LOG_CATEGORIES.ERRORS, "Error fetching place fields", error);
      }
      if (hasProperty(place, "formattedAddress") && typeof place.formattedAddress === "string") {
        setLocationAddress(place.formattedAddress);
      }
    }
    setSuggestions([]);
  };
  const parseCommuteTolerance = (): number | undefined => {
    const parsed = commuteTime.trim() === "" ? undefined : parseInt(commuteTime.trim(), 10);
    return parsed !== undefined && !isNaN(parsed) && parsed >= 0 ? parsed : undefined;
  };
  const handleAddLocation = () => {
    if (locationAddress.trim()) {
      const newLocation: ImportantLocation = {
        address: locationAddress.trim(),
        commute_tolerance: parseCommuteTolerance(),
      };
      onChange([...locations, newLocation]);
      handleCancel();
    }
  };
  const handleUpdateLocation = () => {
    if (editingIndex !== null && locationAddress.trim()) {
      const updatedLocation: ImportantLocation = {
        address: locationAddress.trim(),
        commute_tolerance: parseCommuteTolerance(),
      };
      const updatedLocations = locations.map((loc, i) =>
        i === editingIndex ? updatedLocation : loc
      );
      onChange(updatedLocations);
      handleCancel();
    }
  };
  const handleEditLocation = (index: number) => {
    const loc = locations[index];
    setLocationAddress(loc.address);
    setCommuteTime(loc.commute_tolerance !== undefined ? String(loc.commute_tolerance) : "");
    setEditingIndex(index);
    setIsAddingLocation(false);
    setHasSelected(false);
  };
  const handleRemoveLocation = (index: number) => {
    if (editingIndex === index) {
      handleCancel();
    }
    const updatedLocations = locations.filter((_, i) => i !== index);
    onChange(updatedLocations);
  };
  const handleCancel = () => {
    setLocationAddress("");
    setCommuteTime("");
    setIsAddingLocation(false);
    setEditingIndex(null);
    setHasSelected(false);
    setSuggestions([]);
  };
  const handleFormSubmit = () => {
    if (editingIndex !== null) {
      handleUpdateLocation();
    } else {
      handleAddLocation();
    }
  };
  return (
    <div className="space-y-4">
      {/* Existing Locations */}
      {locations.length > 0 && (
        <div className="space-y-3">
          {locations.map((location, index) => (
            <div
              key={index}
              className="border-beige bg-beige/20 flex items-center justify-between rounded-lg border p-3"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <BodyText as="span" size="sm" className="block break-words text-black">
                  {location.address}
                </BodyText>
                {location.commute_tolerance != null && (
                  <BodyText as="span" size="xs" className="text-brown block">
                    {location.commute_tolerance} min max
                  </BodyText>
                )}
              </div>
              {isEditMode && (
                <div className="flex flex-shrink-0 items-center gap-1">
                  <IconButton
                    variant="ghost"
                    size="sm"
                    icon={<Icon name="pencil" className="h-4 w-4" />}
                    onClick={() => handleEditLocation(index)}
                    title="Edit location"
                    className="text-brown/70 hover:text-brown"
                  />
                  <IconButton
                    variant="ghost"
                    size="sm"
                    icon={<Icon name="x" className="h-4 w-4" />}
                    onClick={() => handleRemoveLocation(index)}
                    title="Remove location"
                    className="text-rose hover:text-rose-light"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Form */}
      {isEditMode && (
        <>
          {!isFormVisible ? (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsAddingLocation(true)}
              className="w-full border-2 border-dashed border-gray-300 text-gray-600"
              iconName="plus"
              iconPosition="left"
            >
              Add Important Location
            </Button>
          ) : (
            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <Input
                ref={addressInputRef}
                label="Address"
                type="text"
                value={locationAddress}
                onChange={handleAddressInputChange}
                placeholder={scriptsReady ? "Search for address..." : "Loading..."}
                disabled={!scriptsReady}
                leftIcon={<Icon name="map-pin" className="h-4 w-4" />}
                autoComplete="off"
                size="md"
              />

              {/* Address Suggestions */}
              {suggestions.length > 0 && (
                <ul className="relative z-50 mt-2 max-h-60 overflow-hidden overflow-y-auto rounded-md border bg-white shadow-sm">
                  {suggestions.map((s, idx) => (
                    <li key={idx}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelect.bind(null, s)}
                        className="w-full cursor-pointer justify-start px-3 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        {s.description}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <Input
                label="Max Commute Time (minutes)"
                type="number"
                value={commuteTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  if (value === "" || /^\d*$/.test(value)) {
                    setCommuteTime(value);
                  }
                }}
                placeholder="30"
                min="0"
                max="180"
                leftIcon={<Icon name="clock" className="h-4 w-4" />}
                autoComplete="off"
                size="md"
                helperText="Maximum acceptable commute time to this location"
              />

              <div className="flex space-x-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleFormSubmit}
                  disabled={!locationAddress.trim()}
                >
                  {editingIndex !== null ? "Save" : "Add Location"}
                </Button>
                <CancelButton onClick={handleCancel} size="md">
                  Cancel
                </CancelButton>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default ImportantLocationsInput;
