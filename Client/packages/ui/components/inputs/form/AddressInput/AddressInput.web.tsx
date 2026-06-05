import React, { useEffect, useId, useState } from "react";

import Input from "@ui/form/Input";
import { Icon } from "@ui/icons";

import { log } from "packages/logger";
import type { GoogleMapsWindow } from "packages/types/integrations/google-maps";
import Button from "packages/ui/components/actions/button/Button";
import {
  placeFromAutocompleteSuggestion,
  resolveGooglePlaceToAddressData,
} from "packages/ui/components/inputs/form/resolveGooglePlaceToAddressData";
import { LOCATION_INPUT_CONTAINER } from "packages/ui/components/inputs/form/styles/fileUploadStyles";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import { asError } from "packages/utils";
import { getWindow } from "packages/utils/core/platform";

import type { AddressData } from "./AddressInput.tsx";
import { AddressInput } from "./AddressInput.tsx";

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

type AddressInputWebProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (address: AddressData) => void;
  scriptsReady?: boolean;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
};

function AddressInputAutocomplete({
  value,
  onChange,
  onSelect,
  scriptsReady,
  placeholder = "Search for address...",
  disabled,
  label,
}: AddressInputWebProps & { scriptsReady: true }) {
  const listId = `address-suggestions-${useId().replace(/:/g, "")}`;
  const [localValue, setLocalValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [hasSelected, setHasSelected] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Sync controlled value from parent
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  // Fetch autocomplete suggestions as the user types
  useEffect(() => {
    if (!scriptsReady || localValue.trim().length < 3 || hasSelected) {
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
          input: localValue,
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
        log.error("ERRORS", "Address autocomplete fetch error", error);
        setSuggestions([]);
      }
    };
    const t = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(t);
  }, [localValue, scriptsReady, hasSelected]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasSelected(false);
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
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
    const place = placeFromAutocompleteSuggestion(suggestion);
    const addressData = await resolveGooglePlaceToAddressData(place, localValue.trim());
    setLocalValue(addressData.address);
    onChange(addressData.address);
    setSuggestions([]);
    setHighlightedIndex(-1);
    onSelect?.(addressData);
  };

  return (
    <Box className={`w-full space-y-2 ${LOCATION_INPUT_CONTAINER}`}>
      <Input
        label={label}
        type="text"
        value={localValue}
        onChange={handleInputChange}
        onKeyDown={handleAddressKeyDown}
        placeholder={scriptsReady ? placeholder : "Loading..."}
        disabled={disabled ?? !scriptsReady}
        leftIcon={<Icon name="map-pin" className="h-4 w-4" />}
        autoComplete="off"
        size="md"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={suggestions.length > 0}
        aria-activedescendant={
          suggestions.length > 0 && highlightedIndex >= 0
            ? `${listId}-option-${highlightedIndex}`
            : undefined
        }
      />

      {suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="bg-background-surface z-dropdown relative mt-2 flex max-h-60 flex-col gap-1 overflow-hidden overflow-y-auto rounded-md shadow-sm"
        >
          {suggestions.map((s, idx) => (
            <li
              key={idx}
              id={`${listId}-option-${idx}`}
              role="option"
              aria-selected={highlightedIndex === idx}
              className="rounded border border-dotted border-neutral-300 first:border-t-0"
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
    </Box>
  );
}

function AddressInputWeb(props: AddressInputWebProps) {
  if (props.scriptsReady) {
    return <AddressInputAutocomplete {...props} scriptsReady={true} />;
  }
  return (
    <AddressInput
      value={props.value}
      onChange={props.onChange}
      placeholder={props.placeholder}
      disabled={props.disabled}
      label={props.label}
    />
  );
}

export default AddressInputWeb;
export { AddressInputWeb };
export type { AddressData, AddressInputProps } from "./AddressInput.tsx";
export { AddressInput } from "./AddressInput.tsx";
