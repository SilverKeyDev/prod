import { GooglePlacesAutocompleteField } from "packages/ui/components";
import { Box } from "packages/ui/components/primitives";

import { BodyText } from "@/components/ui";
import { ViewingRoutePlanEditor } from "@/features/calendar/components/viewings/ViewingRoutePlanEditor";
import {
  type ViewingStop,
  ViewingStopList,
} from "@/features/calendar/components/viewings/ViewingStopList";
import type {
  ViewingRouteEndMode,
  ViewingRouteEndpoint,
  ViewingTourAnchor,
  ViewingTourStartSelection,
} from "@/features/calendar/utils/viewing/viewingRoutePlan";

export type CreateEventModalFormViewingOrLocationProps = {
  isPropertyViewing: boolean;
  viewingStops: ViewingStop[];
  onViewingStopsChange?: (next: ViewingStop[]) => void;
  viewingStartSelection: ViewingTourStartSelection;
  onViewingStartSelectionChange?: (next: ViewingTourStartSelection) => void;
  viewingEndMode: ViewingRouteEndMode;
  onViewingEndModeChange?: (next: ViewingRouteEndMode) => void;
  viewingEndFixed: ViewingRouteEndpoint | null;
  onViewingEndFixedChange?: (next: ViewingRouteEndpoint | null) => void;
  viewingTourAnchors: ViewingTourAnchor[];
  eventLocation: string;
  onEventLocationChange: (value: string) => void;
  locationScriptsReady: boolean;
  loadError: string | null;
};

export function CreateEventModalFormViewingOrLocation({
  isPropertyViewing,
  viewingStops,
  onViewingStopsChange,
  viewingStartSelection,
  onViewingStartSelectionChange,
  viewingEndMode,
  onViewingEndModeChange,
  viewingEndFixed,
  onViewingEndFixedChange,
  viewingTourAnchors,
  eventLocation,
  onEventLocationChange,
  locationScriptsReady,
  loadError,
}: CreateEventModalFormViewingOrLocationProps) {
  return (
    <Box>
      {isPropertyViewing &&
      onViewingStopsChange &&
      onViewingStartSelectionChange &&
      onViewingEndModeChange &&
      onViewingEndFixedChange ? (
        <ViewingRoutePlanEditor
          viewingStops={viewingStops}
          onViewingStopsChange={onViewingStopsChange}
          startSelection={viewingStartSelection}
          onStartSelectionChange={onViewingStartSelectionChange}
          endMode={viewingEndMode}
          onEndModeChange={onViewingEndModeChange}
          endFixed={viewingEndFixed}
          onEndFixedChange={onViewingEndFixedChange}
          savedAnchors={viewingTourAnchors}
          scriptsReady={locationScriptsReady}
          loadError={loadError}
        />
      ) : isPropertyViewing && onViewingStopsChange ? (
        <ViewingStopList
          stops={viewingStops}
          onStopsChange={onViewingStopsChange}
          scriptsReady={locationScriptsReady}
          loadError={loadError}
        />
      ) : (
        <>
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
        </>
      )}
    </Box>
  );
}
