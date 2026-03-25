import React, { useEffect, useRef, useState } from "react";

import Input from "@ui/form/Input";
import { Icon } from "@ui/icons";

import { log, LOG_CATEGORIES } from "packages/logger";
import type { GoogleMapsWindow } from "packages/types/google-maps";
import { LOCATION_INPUT_CONTAINER } from "packages/ui/components/form/fileUploadStyles";
import { Box } from "packages/ui/components/primitives";
import { asError } from "packages/utils";
import { hasProperty, isFunction, isObject } from "packages/utils";
import { getWindow } from "packages/utils/platform";

import { BodyText, Button, CancelButton, IconButton } from "@/components/ui";

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
  /** Optional label for the add button (e.g. "Add work, school, or other location") */
  addButtonLabel?: string;
};
const ImportantLocationsInput: React.FC<ImportantLocationsInputProps> = ({
  locations,
  onChange,
  scriptsReady,
  isEditMode = true,
  addButtonLabel = "Add Important Location",
}) => {
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [locationAddress, setLocationAddress] = useState("");
  const [commuteTime, setCommuteTime] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [hasSelected, setHasSelected] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [autocompleteError, setAutocompleteError] = useState<string | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const suggestionsListId = "important-locations-suggestions";
  const isFormVisible = isAddingLocation || editingIndex !== null;
  // Fetch autocomplete suggestions as the user types
  useEffect(() => {
    if (!scriptsReady || locationAddress.trim().length < 3 || hasSelected) {
      setSuggestions([]);
      setAutocompleteError(null);
      return;
    }
    setAutocompleteError(null);
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
        setAutocompleteError("Address search unavailable. You can type an address manually.");
      }
    };
    const t = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(t);
  }, [locationAddress, scriptsReady, hasSelected]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);
  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasSelected(false);
    setHighlightedIndex(-1);
    setLocationAddress(e.target.value);
  };

  const handleAddressKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (
      e.key === "Enter" &&
      highlightedIndex >= 0 &&
      highlightedIndex < suggestions.length
    ) {
      e.preventDefault();
      void handleSelect(suggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setSuggestions([]);
      setHighlightedIndex(-1);
    }
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
    setHighlightedIndex(-1);
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
    setHighlightedIndex(-1);
  };
  const handleFormSubmit = () => {
    if (editingIndex !== null) {
      handleUpdateLocation();
    } else {
      handleAddLocation();
    }
  };
  const editingLocation = editingIndex !== null ? locations[editingIndex] : null;

  return (
    <Box className="space-y-4">
      {/* Existing Locations - always visible when present */}
      {locations.length > 0 && (
        <Box className="space-y-3">
          {locations.map((location, index) => (
            <Box
              key={index}
              className={`border-border bg-accent-muted flex items-center justify-between rounded-lg border p-3 ${
                editingIndex === index ? "ring-brand-accent ring-2 ring-offset-2" : ""
              }`}
            >
              <Box className="min-w-0 flex-1 space-y-1">
                <BodyText as="span" size="sm" className="text-text-primary block break-words">
                  {location.address}
                </BodyText>
                {location.commute_tolerance != null && (
                  <BodyText as="span" size="xs" className="text-text-secondary block">
                    {location.commute_tolerance} min max
                  </BodyText>
                )}
              </Box>
              {isEditMode && (
                <Box className="flex flex-shrink-0 items-center gap-1">
                  <IconButton
                    variant="ghost"
                    size="sm"
                    icon={<Icon name="pencil" className="h-4 w-4" />}
                    onClick={() => handleEditLocation(index)}
                    title="Edit location"
                    label="Edit location"
                    className="text-text-secondary hover:text-text-secondary"
                  />
                  <IconButton
                    variant="ghost"
                    size="sm"
                    icon={<Icon name="x" className="h-4 w-4" />}
                    onClick={() => handleRemoveLocation(index)}
                    title="Remove location"
                    label="Remove location"
                    className="text-destructive hover:text-destructive-hover"
                  />
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Add / Edit Form */}
      {isEditMode && (
        <>
          {!isFormVisible ? (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsAddingLocation(true)}
              className="bg-background-surface border-border text-text-secondary hover:bg-accent-muted w-full rounded-lg border-2 border-dotted py-3"
              iconName="plus"
              iconPosition="left"
            >
              {addButtonLabel}
            </Button>
          ) : (
            <Box className={`space-y-3 ${LOCATION_INPUT_CONTAINER}`}>
              {editingIndex !== null && editingLocation && (
                <BodyText as="p" size="sm" className="text-text-secondary font-medium">
                  Editing: {editingLocation.address}
                </BodyText>
              )}
              <Input
                ref={addressInputRef}
                label="Address"
                type="text"
                value={locationAddress}
                onChange={handleAddressInputChange}
                onKeyDown={handleAddressKeyDown}
                placeholder={
                  scriptsReady ? "Search for address..." : "Setting up address search..."
                }
                disabled={!scriptsReady}
                leftIcon={<Icon name="map-pin" className="h-4 w-4" />}
                autoComplete="off"
                size="md"
                aria-autocomplete="list"
                aria-controls={suggestionsListId}
                aria-expanded={suggestions.length > 0}
                aria-activedescendant={
                  suggestions.length > 0 && highlightedIndex >= 0
                    ? `${suggestionsListId}-option-${highlightedIndex}`
                    : undefined
                }
              />

              {autocompleteError && (
                <BodyText as="p" size="xs" className="mt-1 text-amber-600">
                  {autocompleteError}
                </BodyText>
              )}

              {/* Address Suggestions */}
              {suggestions.length > 0 && (
                <ul
                  id={suggestionsListId}
                  role="listbox"
                  className="bg-background-surface relative z-50 mt-2 flex max-h-60 flex-col gap-1 overflow-hidden overflow-y-auto rounded-md shadow-sm"
                >
                  {suggestions.map((s, idx) => (
                    <li
                      key={idx}
                      id={`${suggestionsListId}-option-${idx}`}
                      role="option"
                      aria-selected={highlightedIndex === idx}
                      className="rounded border border-dotted border-neutral-300"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleSelect(s)}
                        className={`w-full cursor-pointer !justify-start px-3 py-2 text-sm [&>div>div]:!justify-start [&>div>div]:!text-left [&>div]:w-full [&>div]:!justify-start ${
                          highlightedIndex === idx ? "bg-primary-muted" : "hover:bg-primary-muted"
                        }`}
                      >
                        <Box className="flex w-full items-center justify-start gap-2 text-left">
                          <Icon name="map-pin" className="h-4 w-4 shrink-0 text-neutral-500" />
                          <BodyText as="span" size="sm" className="min-w-0 flex-1 text-left">
                            {s.description}
                          </BodyText>
                        </Box>
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
                placeholder="30 (optional)"
                min="0"
                max="180"
                leftIcon={<Icon name="clock" className="h-4 w-4" />}
                autoComplete="off"
                size="md"
                helperText="Max drive time to this location (minutes). Optional."
              />

              <Box className="flex space-x-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleFormSubmit}
                  disabled={!locationAddress.trim()}
                  title={!locationAddress.trim() ? "Enter an address to save" : undefined}
                >
                  {editingIndex !== null ? "Save" : "Add Location"}
                </Button>
                <CancelButton onClick={handleCancel} size="md">
                  Cancel
                </CancelButton>
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
export default ImportantLocationsInput;
