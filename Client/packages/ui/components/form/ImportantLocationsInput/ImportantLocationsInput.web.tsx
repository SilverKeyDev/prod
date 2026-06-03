import React, { useEffect, useRef, useState } from "react";

import Input from "@ui/form/Input";
import { Icon } from "@ui/icons";

import { log } from "packages/logger";
import type { GoogleMapsWindow } from "packages/types/integrations/google-maps";
import Button from "packages/ui/components/button/Button";
import CancelButton from "packages/ui/components/button/CancelButton";
import IconButton from "packages/ui/components/button/IconButton";
import { LOCATION_INPUT_CONTAINER } from "packages/ui/components/form/styles/fileUploadStyles";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import { asError } from "packages/utils";
import { hasProperty, isFunction, isObject } from "packages/utils";
import { getWindow } from "packages/utils/platform";
import type { ImportantLocation } from "packages/utils/profile";

import { ImportantLocationsInputManual } from "./ImportantLocationsInputManual";

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
  /** When true (Google Maps loaded), enables address autocomplete. When false/undefined, uses manual entry. */
  scriptsReady?: boolean;
  isEditMode?: boolean;
};

function ImportantLocationsInputAutocomplete({
  locations,
  onChange,
  scriptsReady,
  isEditMode = true,
}: ImportantLocationsInputProps & { scriptsReady: true }) {
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
        log.error("ERRORS", "Autocomplete fetch error", error);
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
        log.warn("ERRORS", "Error fetching place fields", error);
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
    <Box className="space-y-4">
      {/* Existing Locations */}
      {locations.length > 0 && (
        <Box className="space-y-3">
          {locations.map((location, index) => (
            <Box
              key={index}
              className="border-border-input bg-bg-card-subtle flex items-center justify-between rounded-lg border p-3"
            >
              <Box className="min-w-0 flex-1 space-y-1">
                <BodyText as="span" size="sm" className="block break-words text-black">
                  {location.address}
                </BodyText>
                {location.commute_tolerance != null && (
                  <BodyText as="span" size="xs" className="text-brown block">
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
                    className="text-text-tertiary hover:text-brown active:text-brown"
                  />
                  <IconButton
                    variant="ghost"
                    size="md"
                    icon={<Icon name="x" className="h-4 w-4" />}
                    onClick={() => handleRemoveLocation(index)}
                    title="Remove location"
                    label="Remove location"
                    className="text-destructive hover:text-destructive-hover active:text-destructive-hover min-h-11 min-w-11 touch-manipulation"
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
              className={`bg-background-surface w-full rounded-lg border-2 border-dotted border-neutral-300 py-3 text-neutral-700 hover:bg-neutral-100`}
              iconName="plus"
              iconPosition="left"
            >
              Add Important Location
            </Button>
          ) : (
            <Box className={`space-y-3 ${LOCATION_INPUT_CONTAINER}`}>
              <Input
                ref={addressInputRef}
                label="Address"
                type="text"
                value={locationAddress}
                onChange={handleAddressInputChange}
                placeholder={
                  scriptsReady
                    ? "Search or type an address..."
                    : "Type an address (map search when ready)"
                }
                leftIcon={<Icon name="map-pin" className="h-4 w-4" />}
                autoComplete="off"
                size="md"
              />

              {/* Address Suggestions */}
              {suggestions.length > 0 && (
                <ul className="z-dropdown relative mt-2 flex max-h-60 flex-col gap-1 overflow-hidden overflow-y-auto rounded-md bg-white shadow-sm">
                  {suggestions.map((s, idx) => (
                    <li key={idx} className="rounded border border-dotted border-neutral-300">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelect.bind(null, s)}
                        className="w-full cursor-pointer !justify-start px-3 py-2 text-sm hover:bg-gray-100 active:bg-gray-200 [&>div>div]:!justify-start [&>div>div]:!text-left [&>div]:w-full [&>div]:!justify-start"
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
                placeholder="Minutes (e.g. 30)"
                min="0"
                max="180"
                leftIcon={<Icon name="clock" className="h-4 w-4" />}
                autoComplete="off"
                size="md"
                helperText="Maximum commute time to this address (minutes)."
              />

              <Box className="flex space-x-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleFormSubmit}
                  disabled={!locationAddress.trim()}
                  iconName="save"
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
}

function ImportantLocationsInput(props: ImportantLocationsInputProps) {
  if (props.scriptsReady) {
    return <ImportantLocationsInputAutocomplete {...props} scriptsReady={true} />;
  }
  return (
    <ImportantLocationsInputManual
      locations={props.locations}
      onChange={props.onChange}
      isEditMode={props.isEditMode}
    />
  );
}

export default ImportantLocationsInput;
export { ImportantLocationsInput };
