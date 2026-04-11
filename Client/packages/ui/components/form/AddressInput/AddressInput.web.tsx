import React, { useEffect, useState } from "react";

import Input from "@ui/form/Input";
import { Icon } from "@ui/icons";

import { log, LOG_CATEGORIES } from "packages/logger";
import type { GoogleMapsWindow } from "packages/types/google-maps";
import Button from "packages/ui/components/button/Button";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import { asError } from "packages/utils";
import { hasProperty, isFunction, isObject } from "packages/utils";
import { getWindow } from "packages/utils/platform";

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

/** Parse addressComponents from Google Place into structured AddressData.
 * New API uses longText/shortText; legacy uses long_name/short_name. */
function parseAddressComponents(
  components:
    | Array<{
        longText?: string;
        shortText?: string;
        long_name?: string;
        short_name?: string;
        types?: string[];
      }>
    | undefined,
  _formattedAddress: string,
): Pick<AddressData, "street" | "city" | "state" | "postal_code" | "country"> {
  const result: Pick<
    AddressData,
    "street" | "city" | "state" | "postal_code" | "country"
  > = {};
  if (!Array.isArray(components)) return result;

  const getByType = (type: string): string | undefined => {
    const comp = components.find((c) => c.types?.includes(type));
    return (
      comp?.longText ?? comp?.shortText ?? comp?.long_name ?? comp?.short_name
    );
  };

  const streetNumber = getByType("street_number");
  const route = getByType("route");
  result.street =
    streetNumber && route
      ? `${streetNumber} ${route}`
      : streetNumber ?? route ?? undefined;
  result.city =
    getByType("locality") ??
    getByType("sublocality") ??
    getByType("sublocality_level_1");
  result.state = getByType("administrative_area_level_1");
  result.postal_code = getByType("postal_code");
  result.country = getByType("country");

  return result;
}

function AddressInputAutocomplete({
  value,
  onChange,
  onSelect,
  scriptsReady,
  placeholder = "Search for address...",
  disabled,
  label,
}: AddressInputWebProps & { scriptsReady: true }) {
  const [localValue, setLocalValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [hasSelected, setHasSelected] = useState(false);

  // Sync controlled value from parent
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

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
        const sessionToken =
          new googleMapsWindow.google.maps.places.AutocompleteSessionToken();
        const request = {
          input: localValue,
          sessionToken,
          includedRegionCodes: ["US"],
        };
        const { suggestions: fetched } =
          await googleMapsWindow.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            request,
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
        log.error(
          LOG_CATEGORIES.ERRORS,
          "Address autocomplete fetch error",
          error,
        );
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
        ? (
            placePrediction as {
              toPlace: () => unknown;
            }
          ).toPlace()
        : null;

    let addressData: AddressData = {
      address: localValue.trim(),
    };

    if (
      isObject(place) &&
      hasProperty(place, "fetchFields") &&
      isFunction(place.fetchFields)
    ) {
      try {
        const fetchFieldsMethod = place.fetchFields;
        if (typeof fetchFieldsMethod === "function") {
          await fetchFieldsMethod.call(place, {
            fields: ["formattedAddress", "addressComponents", "id"],
          });
        }
      } catch (error) {
        log.warn(LOG_CATEGORIES.ERRORS, "Error fetching place fields", error);
      }

      const formattedAddr =
        hasProperty(place, "formattedAddress") &&
        typeof place.formattedAddress === "string"
          ? place.formattedAddress
          : localValue.trim();
      const placeId =
        hasProperty(place, "id") && typeof place.id === "string"
          ? place.id
          : undefined;
      const components = hasProperty(place, "addressComponents")
        ? (place.addressComponents as Array<{
            longText?: string;
            shortText?: string;
            long_name?: string;
            short_name?: string;
            types?: string[];
          }>)
        : undefined;

      const parsed = parseAddressComponents(components, formattedAddr);
      addressData = {
        address: formattedAddr,
        place_id: placeId,
        ...parsed,
      };

      setLocalValue(formattedAddr);
      onChange(formattedAddr);
    }

    setSuggestions([]);
    onSelect?.(addressData);
  };

  return (
    <Box className="w-full space-y-2">
      <Input
        label={label}
        type="text"
        value={localValue}
        onChange={handleInputChange}
        placeholder={scriptsReady ? placeholder : "Loading..."}
        disabled={disabled ?? !scriptsReady}
        leftIcon={<Icon name="map-pin" className="h-4 w-4" />}
        autoComplete="off"
        size="md"
      />

      {suggestions.length > 0 && (
        <ul className="z-dropdown relative flex max-h-60 flex-col gap-1 overflow-hidden overflow-y-auto rounded-md bg-white shadow-sm">
          {suggestions.map((s, idx) => (
            <li
              key={idx}
              className="rounded border border-dotted border-neutral-300"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleSelect(s)}
                className="w-full cursor-pointer !justify-start px-3 py-2 text-sm hover:bg-gray-100 active:bg-gray-200 [&>div>div]:!justify-start [&>div>div]:!text-left [&>div]:w-full [&>div]:!justify-start"
              >
                <Box className="flex w-full items-center justify-start gap-2 text-left">
                  <Icon
                    name="map-pin"
                    className="h-4 w-4 shrink-0 text-neutral-500"
                  />
                  <BodyText
                    as="span"
                    size="sm"
                    className="min-w-0 flex-1 text-left"
                  >
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
export type { AddressInputProps } from "./AddressInput.tsx";
