import { useMemo } from "react";

import Button from "packages/ui/components/button/Button";
import { AddressInput } from "packages/ui/components/form/AddressInput";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

import { Title } from "@/components/ui";
import {
  estimateViewingItineraryMinutes,
  formatMinutesHuman,
} from "@/features/calendar/utils/agenda/estimateViewingItineraryDuration";

import type { ViewingStop, ViewingStopListProps } from "./viewingItineraryTypes";

export type { ViewingItinerary, ViewingStop, ViewingStopListProps } from "./viewingItineraryTypes";

function emptyStop(): ViewingStop {
  return {
    address: "",
    label: null,
    lat: null,
    lng: null,
    notes: null,
    listing_id: null,
  };
}

export function ViewingStopList({
  stops,
  onStopsChange,
  scriptsReady,
  loadError,
}: ViewingStopListProps) {
  const addStop = () => {
    onStopsChange([...stops, emptyStop()]);
  };

  const removeStop = (index: number) => {
    const next = stops.filter((_, i) => i !== index);
    onStopsChange(next.length ? next : [emptyStop()]);
  };

  const updateStop = (index: number, patch: Partial<ViewingStop>) => {
    const next = stops.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onStopsChange(next);
  };

  const durationEstimateLine = useMemo(() => {
    const est = estimateViewingItineraryMinutes({
      stops,
      legs: null,
    });
    if (!est) {
      return null;
    }
    return `Est. ${formatMinutesHuman(est.onSiteMinutes)} on-site (${
      est.minutesPerProperty
    } min avg × ${est.stopCount} tours). Fastest drive route is computed when you save.`;
  }, [stops]);

  return (
    <Box className="space-y-3">
      <Title size="sm" as="h3">
        Viewing stops
      </Title>
      <BodyText size="xs" muted>
        Add addresses for each stop. Pick places from search to capture map coordinates, or type an
        address (we geocode on save when building the route).
      </BodyText>

      {stops.length === 0 ? (
        <Button type="button" variant="outline" size="sm" onClick={addStop} iconName="plus">
          Add stop
        </Button>
      ) : (
        stops.map((stop, index) => (
          <Box key={index} className="border-border space-y-2 rounded-lg border p-3">
            <Box className="flex flex-wrap items-center gap-2">
              <BodyText size="xs" className="text-text-secondary font-medium">
                Stop {index + 1}
              </BodyText>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive min-h-0 px-2 py-0"
                onClick={() => removeStop(index)}
                iconName="trash-2"
              >
                Remove
              </Button>
            </Box>
            <AddressInput
              label="Address"
              value={stop.address}
              onChange={(v) => updateStop(index, { address: v, lat: null, lng: null })}
              onSelect={(data) =>
                updateStop(index, {
                  address: data.address,
                  label: data.street ?? data.address,
                  lat: data.lat ?? null,
                  lng: data.lng ?? null,
                })
              }
              scriptsReady={scriptsReady ?? false}
              placeholder="Search or type an address"
            />
          </Box>
        ))
      )}

      {durationEstimateLine ? (
        <BodyText
          size="xs"
          className="text-text-secondary border-border bg-accent-muted rounded-lg border px-3 py-2"
        >
          {durationEstimateLine}
        </BodyText>
      ) : null}

      {loadError ? (
        <BodyText size="xs" className="text-destructive">
          {loadError}
        </BodyText>
      ) : null}

      {stops.length > 0 ? (
        <Button type="button" variant="outline" size="sm" onClick={addStop} iconName="plus">
          Add stop
        </Button>
      ) : null}
    </Box>
  );
}
