import React, { useRef } from "react";

import Input from "@ui/form/Input";
import { Icon } from "@ui/icons";

import { LOCATION_INPUT_CONTAINER } from "packages/ui/components/inputs/form/styles/fileUploadStyles";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Button, CancelButton } from "@/components/ui";

import type { ImportantLocation, Suggestion } from "./importantLocationsInputTypes";
import { ImportantLocationSuggestionsList } from "./ImportantLocationSuggestionsList.web";

export type ImportantLocationEditorPanelProps = {
  scriptsReady?: boolean;
  editingIndex: number | null;
  editingLocation: ImportantLocation | null;
  locationAddress: string;
  commuteTime: string;
  isSpecificAddress: boolean;
  suggestionsListId: string;
  suggestions: Suggestion[];
  highlightedIndex: number;
  autocompleteError: string | null;
  onAddressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddressKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onCommuteTimeChange: (value: string) => void;
  onSelectSuggestion: (suggestion: Suggestion) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function ImportantLocationEditorPanel({
  scriptsReady,
  editingIndex,
  editingLocation,
  locationAddress,
  commuteTime,
  isSpecificAddress,
  suggestionsListId,
  suggestions,
  highlightedIndex,
  autocompleteError,
  onAddressChange,
  onAddressKeyDown,
  onCommuteTimeChange,
  onSelectSuggestion,
  onSubmit,
  onCancel,
}: ImportantLocationEditorPanelProps) {
  const addressInputRef = useRef<HTMLInputElement>(null);

  return (
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
        onChange={onAddressChange}
        onKeyDown={onAddressKeyDown}
        placeholder={
          scriptsReady
            ? "Search or type an address..."
            : "Type an address (map search will appear when ready)"
        }
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

      <ImportantLocationSuggestionsList
        suggestionsListId={suggestionsListId}
        suggestions={suggestions}
        highlightedIndex={highlightedIndex}
        onSelect={(suggestion) => void onSelectSuggestion(suggestion)}
      />

      {locationAddress.trim() &&
        (!isSpecificAddress ||
          (editingIndex !== null && editingLocation?.commute_tolerance != null)) && (
          <Input
            label="Max Commute Time (minutes)"
            type="number"
            value={commuteTime}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value;
              if (value === "" || /^\d*$/.test(value)) {
                onCommuteTimeChange(value);
              }
            }}
            placeholder="Minutes (optional, e.g. 30)"
            min="0"
            max="180"
            leftIcon={<Icon name="clock" className="h-4 w-4" />}
            autoComplete="off"
            size="md"
            helperText="Maximum commute time to this address (minutes). Optional."
          />
        )}

      <Box className="flex space-x-3">
        <Button
          variant="primary"
          size="md"
          onClick={onSubmit}
          disabled={!locationAddress.trim()}
          title={!locationAddress.trim() ? "Enter an address to save" : undefined}
          iconName="save"
        >
          {editingIndex !== null ? "Save" : "Add Location"}
        </Button>
        <CancelButton onClick={onCancel} size="md">
          Cancel
        </CancelButton>
      </Box>
    </Box>
  );
}
