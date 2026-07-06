import React, { useEffect, useState } from "react";

import { Icon } from "@ui/icons";

import { showWarningToast } from "packages/hooks/ui/toast/useToast";
import { log } from "packages/logger";
import { Box } from "packages/ui/components/structure/primitives";
import { SUPPORTED_SERVICE_AREA_WARNING } from "packages/utils/product/search/locations/serviceAreaAvailability";

import { BodyText, Button, IconButton } from "@/components/ui";

import { ImportantLocationEditorPanel } from "./ImportantLocationEditorPanel.web";
import type {
  ImportantLocation,
  ImportantLocationsInputProps,
} from "./importantLocationsInputTypes";
import { useImportantLocationsAutocomplete } from "./useImportantLocationsAutocomplete";

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
  const [hasSelected, setHasSelected] = useState(false);
  const [hasSupportedLocationSelection, setHasSupportedLocationSelection] = useState(false);
  const [isSpecificAddress, setIsSpecificAddress] = useState(false);
  const suggestionsListId = "important-locations-suggestions";
  const isFormVisible = isAddingLocation || editingIndex !== null;
  const editingLocation = editingIndex !== null ? locations[editingIndex] : null;

  const {
    suggestions,
    highlightedIndex,
    autocompleteError,
    handleSelect,
    handleAddressKeyDown,
    clearSuggestions,
  } = useImportantLocationsAutocomplete({
    scriptsReady,
    locationAddress,
    hasSelected,
    setLocationAddress,
    setIsSpecificAddress,
    setHasSelected,
    setHasSupportedLocationSelection,
  });

  useEffect(() => {
    if (
      isSpecificAddress &&
      commuteTime &&
      !(editingIndex !== null && editingLocation?.commute_tolerance != null)
    ) {
      setCommuteTime("");
    }
  }, [isSpecificAddress, commuteTime, editingIndex, editingLocation]);

  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasSelected(false);
    setHasSupportedLocationSelection(false);
    setIsSpecificAddress(false);
    setLocationAddress(e.target.value);
  };

  const parseCommuteTolerance = (): number | undefined => {
    const parsed = commuteTime.trim() === "" ? undefined : parseInt(commuteTime.trim(), 10);
    return parsed !== undefined && !isNaN(parsed) && parsed >= 0 ? parsed : undefined;
  };

  const handleCancel = () => {
    setLocationAddress("");
    setCommuteTime("");
    setIsAddingLocation(false);
    setEditingIndex(null);
    setHasSelected(false);
    setHasSupportedLocationSelection(false);
    clearSuggestions();
    setIsSpecificAddress(false);
  };

  const handleAddLocation = () => {
    if (locationAddress.trim()) {
      if (scriptsReady && !hasSupportedLocationSelection) {
        showWarningToast(SUPPORTED_SERVICE_AREA_WARNING);
        return;
      }
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
      if (scriptsReady && !hasSupportedLocationSelection) {
        showWarningToast(SUPPORTED_SERVICE_AREA_WARNING);
        return;
      }
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
    setHasSupportedLocationSelection(false);
  };

  const handleRemoveLocation = (index: number) => {
    log.info("PROFILE_PREFERENCES", "importantLocationsInput.remove", {
      index,
      countBefore: locations.length,
      editingIndex,
    });
    if (editingIndex === index) {
      handleCancel();
    }
    const updatedLocations = locations.filter((_, i) => i !== index);
    log.info("PROFILE_PREFERENCES", "importantLocationsInput.remove.filtered", {
      countAfter: updatedLocations.length,
    });
    onChange(updatedLocations);
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
                    size="md"
                    icon={<Icon name="x" className="h-4 w-4" />}
                    onClick={() => handleRemoveLocation(index)}
                    title="Remove location"
                    label="Remove location"
                    className="text-destructive hover:text-destructive-hover min-h-11 min-w-11 touch-manipulation"
                  />
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}

      {isEditMode && (
        <>
          {!isFormVisible ? (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsAddingLocation(true)}
              className="bg-background-surface border-border text-text-secondary w-full rounded-lg border-2 border-dotted py-3 hover:bg-neutral-100"
              iconName="plus"
              iconPosition="left"
            >
              {addButtonLabel}
            </Button>
          ) : (
            <ImportantLocationEditorPanel
              scriptsReady={scriptsReady}
              editingIndex={editingIndex}
              editingLocation={editingLocation ?? null}
              locationAddress={locationAddress}
              commuteTime={commuteTime}
              isSpecificAddress={isSpecificAddress}
              suggestionsListId={suggestionsListId}
              suggestions={suggestions}
              highlightedIndex={highlightedIndex}
              autocompleteError={autocompleteError}
              onAddressChange={handleAddressInputChange}
              onAddressKeyDown={handleAddressKeyDown}
              onCommuteTimeChange={setCommuteTime}
              onSelectSuggestion={handleSelect}
              onSubmit={handleFormSubmit}
              onCancel={handleCancel}
            />
          )}
        </>
      )}
    </Box>
  );
};

export { ImportantLocationsInput };
export default ImportantLocationsInput;
