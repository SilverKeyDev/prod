import React from "react";

import { View, type ViewStyle } from "react-native";

import { useLocalization } from "packages/contexts";
import { color, Z_LAYERS } from "packages/design-tokens";
import Button from "packages/ui/components/button/Button";

import type { PropertyDetailsMapOverlayControlsProps } from "./PropertyDetailsMapOverlayControls.types";

const mapControlsOverlayStyle: ViewStyle = {
  position: "absolute",
  top: 8,
  right: 8,
  zIndex: Z_LAYERS.dropdown,
  alignItems: "flex-end",
  gap: 8,
};

const mapControlsSegmentStyle: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: 4,
  padding: 4,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: color("neutral.200"),
  backgroundColor: color("neutral.50"),
};

/**
 * Map / Satellite / Street View controls overlaid on the property details location map (native).
 */
export function PropertyDetailsMapOverlayControls({
  satelliteMode,
  onRoadMap,
  onSatellite,
  onStreetView,
}: PropertyDetailsMapOverlayControlsProps): React.ReactElement {
  const { t } = useLocalization();

  return (
    <View pointerEvents="box-none" style={mapControlsOverlayStyle}>
      <View style={mapControlsSegmentStyle}>
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
      </View>
      <Button
        variant="outline"
        size="sm"
        label={t("property_details.map_street_view")}
        onPress={onStreetView}
        iconName="map-pin"
      >
        {t("property_details.map_street_view")}
      </Button>
    </View>
  );
}
