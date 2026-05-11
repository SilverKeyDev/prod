import React from "react";

import { useLocalization } from "packages/contexts";
import { Button } from "packages/ui";
import { Box } from "packages/ui/components/primitives";

import type { PropertyDetailsMapOverlayControlsProps } from "./PropertyDetailsMapOverlayControls.types";

/**
 * Map / Satellite / Street View controls overlaid on the property details location map (web).
 */
export function PropertyDetailsMapOverlayControls({
  satelliteMode,
  onRoadMap,
  onSatellite,
  onStreetView,
}: PropertyDetailsMapOverlayControlsProps): React.ReactElement {
  const { t } = useLocalization();

  return (
    <Box className="z-dropdown pointer-events-none absolute inset-0 flex flex-col items-end gap-2 p-2">
      <Box className="border-border-card-subtle bg-background-surface/95 pointer-events-auto flex gap-1 rounded-lg border p-1 shadow-sm">
        <Button
          variant={!satelliteMode ? "primary" : "outline"}
          size="sm"
          label={t("property_details.map_layer_map")}
          onPress={onRoadMap}
          iconName="map-pin"
        >
          {t("property_details.map_layer_map")}
        </Button>
        <Button
          variant={satelliteMode ? "primary" : "outline"}
          size="sm"
          label={t("property_details.map_layer_satellite")}
          onPress={onSatellite}
          iconName="map-pin"
        >
          {t("property_details.map_layer_satellite")}
        </Button>
      </Box>
      <Box className="pointer-events-auto">
        <Button
          variant="outline"
          size="sm"
          label={t("property_details.map_street_view")}
          onPress={onStreetView}
          iconName="map-pin"
        >
          {t("property_details.map_street_view")}
        </Button>
      </Box>
    </Box>
  );
}
