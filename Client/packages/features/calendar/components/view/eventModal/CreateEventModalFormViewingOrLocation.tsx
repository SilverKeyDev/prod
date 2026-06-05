import { GooglePlacesAutocompleteField } from "packages/ui/components";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText } from "@/components/ui";

export type CreateEventModalFormLocationProps = {
  eventLocation: string;
  onEventLocationChange: (value: string) => void;
  locationScriptsReady: boolean;
  loadError: string | null;
};

export function CreateEventModalFormLocation({
  eventLocation,
  onEventLocationChange,
  locationScriptsReady,
  loadError,
}: CreateEventModalFormLocationProps) {
  return (
    <Box>
      <GooglePlacesAutocompleteField
        label="Location (optional)"
        value={eventLocation}
        onChange={onEventLocationChange}
        onSelect={(data) => onEventLocationChange(data.address)}
        scriptsReady={locationScriptsReady}
        placeholder="Search for an address or type a place or link"
      />
      {loadError ? (
        <BodyText as="p" size="xs" className="text-destructive mt-1">
          {loadError} You can still type an address or link manually.
        </BodyText>
      ) : null}
    </Box>
  );
}
