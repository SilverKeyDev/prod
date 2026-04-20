import React, { useCallback, useEffect, useRef, useState } from "react";

import { useLocalization } from "packages/contexts";
import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { PropertySectionHeader } from "packages/features/propertyDetails/components/visualizations";
import { usePropertyDetailsLocationMap } from "packages/hooks/data/property/usePropertyDetailsLocationMap.web";
import { log, LOG_CATEGORIES } from "packages/logger";
import Button from "packages/ui/components/button/Button";
import { Box, Loading } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import { getWindow } from "packages/utils/platform";
import {
  getListingCoords,
  getListingCoordsUnavailableDiagnostics,
} from "packages/utils/propertyDetails/location/listingCoords";

import { PropertyDetailsMapOverlayControls } from "./PropertyDetailsMapOverlayControls.web";

function buildGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}&ll=${lat},${lng}&z=15`;
}

export type PropertyLocationMapSectionProps = PropertyComponentProps & {
  isLoading?: boolean;
};

export function PropertyLocationMapSection({
  property,
  isLoading = false,
}: PropertyLocationMapSectionProps): React.ReactElement {
  const { t } = useLocalization();
  const [mapHost, setMapHost] = useState<HTMLDivElement | null>(null);
  const [streetViewHost, setStreetViewHost] = useState<HTMLDivElement | null>(null);
  const [satelliteMode, setSatelliteMode] = useState(false);
  const [streetViewOpen, setStreetViewOpen] = useState(false);
  const coords = getListingCoords(property);
  const enabled = coords != null;
  const address = typeof property.address === "string" ? property.address : "";

  const loggedLocationUnavailableKeyRef = useRef<string | null>(null);
  const listingId = typeof property.id === "string" ? property.id : undefined;
  useEffect(() => {
    setStreetViewOpen(false);
  }, [listingId]);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (enabled) {
      loggedLocationUnavailableKeyRef.current = null;
      return;
    }
    const diagnostics = getListingCoordsUnavailableDiagnostics(property);
    if (!diagnostics) return;
    const dedupeKey = `${listingId ?? ""}:${diagnostics.reason}:${
      diagnostics.parsedLat
    }:${diagnostics.parsedLng}:${diagnostics.fields.lat}:${
      diagnostics.fields.latitude
    }:${diagnostics.fields.lng}:${diagnostics.fields.longitude}`;
    if (loggedLocationUnavailableKeyRef.current === dedupeKey) return;
    loggedLocationUnavailableKeyRef.current = dedupeKey;
    log.info(LOG_CATEGORIES.PROPERTY_DETAILS, "Property location map unavailable", {
      listingId,
      ...diagnostics,
    });
  }, [enabled, isLoading, listingId, property]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const mapRect =
      mapHost && typeof mapHost.getBoundingClientRect === "function"
        ? mapHost.getBoundingClientRect()
        : null;
    log.debug(LOG_CATEGORIES.PROPERTY_DETAILS, "PropertyDetailsMapSection web hosts", {
      listingId,
      hasMapHost: mapHost != null,
      hasStreetViewHost: streetViewHost != null,
      mapHostConnected: mapHost?.isConnected ?? false,
      streetViewHostConnected: streetViewHost?.isConnected ?? false,
      mapWidth: mapRect?.width ?? null,
      mapHeight: mapRect?.height ?? null,
      coords: coords ? { lat: coords.lat, lng: coords.lng } : null,
      satelliteMode,
      streetViewOpen,
    });
  }, [coords, enabled, listingId, mapHost, satelliteMode, streetViewHost, streetViewOpen]);

  usePropertyDetailsLocationMap({
    mapContainer: mapHost,
    streetViewContainer: streetViewHost,
    lat: coords?.lat ?? 0,
    lng: coords?.lng ?? 0,
    markerTitle: address,
    enabled,
    satelliteMode,
    streetViewOpen,
    onStreetViewVisibilityChange: setStreetViewOpen,
  });

  const showRoadMap = useCallback(() => {
    setStreetViewOpen(false);
    setSatelliteMode(false);
  }, []);

  const showSatellite = useCallback(() => {
    setStreetViewOpen(false);
    setSatelliteMode(true);
  }, []);

  const openStreetView = useCallback(() => {
    setStreetViewOpen(true);
  }, []);

  const openInFullScreen = useCallback(() => {
    if (!coords) return;
    const url = buildGoogleMapsUrl(coords.lat, coords.lng);
    getWindow()?.open(url, "_blank");
  }, [coords]);

  const title = t("property_details.location_map_heading");
  const subtitle = t("property_details.location_map_subtitle");

  return (
    <Box className="p-6">
      <PropertySectionHeader
        iconName="map-pin"
        title={title}
        subtitle={subtitle}
        className="!mb-4"
      />
      <SectionTintWrapper className="mt-2">
        {isLoading && !enabled ? (
          <Box className="flex min-h-52 items-center justify-center py-8">
            <Loading />
          </Box>
        ) : !enabled ? (
          <BodyText as="p" size="sm" className="text-text-secondary">
            {t("property_details.location_unavailable")}
          </BodyText>
        ) : (
          <Box className="gap-3">
            <Box className="border-border-card-subtle bg-background-surface aspect-square overflow-hidden rounded-lg border">
              <Box className="relative h-full w-full">
                <Box ref={setMapHost} className="absolute inset-0" />
                <Box
                  ref={setStreetViewHost}
                  className="absolute inset-0 z-10 h-full w-full"
                  aria-hidden
                />
                <PropertyDetailsMapOverlayControls
                  satelliteMode={satelliteMode}
                  onRoadMap={showRoadMap}
                  onSatellite={showSatellite}
                  onStreetView={openStreetView}
                />
              </Box>
            </Box>
            <Button variant="outline" size="sm" onPress={openInFullScreen}>
              {t("property_details.open_in_full_screen")}
            </Button>
          </Box>
        )}
      </SectionTintWrapper>
    </Box>
  );
}
