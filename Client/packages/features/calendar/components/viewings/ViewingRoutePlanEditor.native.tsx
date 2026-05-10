import { useEffect, useMemo, useState } from "react";

import { buildViewingRoute } from "packages/api/viewings";
import { log, LOG_CATEGORIES } from "packages/logger";
import Button from "packages/ui/components/button/Button";
import { AddressInput } from "packages/ui/components/form/AddressInput";
import Dropdown, { type DropdownOption } from "packages/ui/components/form/dropdown";
import { Box, Text } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

import {
  estimateViewingItineraryMinutes,
  formatMinutesHuman,
  sumLegDriveMinutes,
} from "@/features/calendar/utils/agenda/estimateViewingItineraryDuration";
import {
  buildViewingItineraryDraftFromForm,
  emptyViewingRouteEndpoint,
  viewingEndpointHasRoutingInput,
  type ViewingTourStartSelection,
} from "@/features/calendar/utils/viewing/viewingRoutePlan";

import type { ViewingRoutePlanEditorProps } from "./viewingRoutePlanEditor.types";
import { ViewingStopList } from "./ViewingStopList";

const START_OPT_OMIT = "__omit";
const START_OPT_CUSTOM = "__custom";

function startDropdownValue(sel: ViewingTourStartSelection): string {
  if (sel.kind === "omit") {
    return START_OPT_OMIT;
  }
  if (sel.kind === "saved") {
    return sel.anchorId;
  }
  return START_OPT_CUSTOM;
}

export function ViewingRoutePlanEditor({
  viewingStops,
  onViewingStopsChange,
  startSelection,
  onStartSelectionChange,
  endMode,
  onEndModeChange,
  endFixed,
  onEndFixedChange,
  savedAnchors,
  scriptsReady,
  loadError,
}: ViewingRoutePlanEditorProps) {
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewLegsMinutes, setPreviewLegsMinutes] = useState<number | null>(null);
  const [previewOrdered, setPreviewOrdered] = useState(false);

  const draft = useMemo(
    () =>
      buildViewingItineraryDraftFromForm({
        stops: viewingStops,
        startSelection,
        anchors: savedAnchors,
        endMode,
        endFixed,
      }),
    [viewingStops, startSelection, savedAnchors, endMode, endFixed]
  );

  const canCallRoute = useMemo(() => {
    if (!draft) {
      return false;
    }
    const n = draft.stops.length;
    const hasStart = viewingEndpointHasRoutingInput(draft.start ?? null);
    if (n >= 2) {
      return true;
    }
    return n >= 1 && hasStart;
  }, [draft]);

  const durationEstimate = useMemo(() => {
    if (!draft) {
      return null;
    }
    return estimateViewingItineraryMinutes({
      stops: draft.stops,
      legs: null,
      includeStartAnchor: viewingEndpointHasRoutingInput(draft.start ?? null),
    });
  }, [draft]);

  useEffect(() => {
    if (!canCallRoute || !draft) {
      setPreviewError(null);
      setPreviewLoading(false);
      setPreviewLegsMinutes(null);
      setPreviewOrdered(false);
      return;
    }

    let cancelled = false;
    const t = setTimeout(() => {
      void (async () => {
        setPreviewLoading(true);
        setPreviewError(null);
        try {
          const res = await buildViewingRoute({
            stops: draft.stops,
            start: draft.start ?? null,
            end: draft.end ?? null,
            end_mode: draft.end_mode,
          });
          if (cancelled) {
            return;
          }
          if (!res.success || !res.data) {
            setPreviewLegsMinutes(null);
            setPreviewOrdered(false);
            setPreviewError(res.error ?? "Could not preview route");
            return;
          }
          const { minutes, complete } = sumLegDriveMinutes(res.data.legs);
          setPreviewOrdered(Boolean(res.data.ordered));
          setPreviewLegsMinutes(complete ? minutes : null);
        } catch (e) {
          if (!cancelled) {
            log.warn(LOG_CATEGORIES.HTTP, "Viewing route preview failed", e);
            setPreviewLegsMinutes(null);
            setPreviewOrdered(false);
            setPreviewError("Could not preview route");
          }
        } finally {
          if (!cancelled) {
            setPreviewLoading(false);
          }
        }
      })();
    }, 420);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [canCallRoute, draft]);

  const onSiteLine = useMemo(() => {
    if (!durationEstimate) {
      return null;
    }
    return `Est. ${formatMinutesHuman(durationEstimate.onSiteMinutes)} on-site (${
      durationEstimate.minutesPerProperty
    } min avg × ${durationEstimate.stopCount} tours).`;
  }, [durationEstimate]);

  const driveLine = useMemo(() => {
    if (previewLoading) {
      return "Calculating drive times…";
    }
    if (previewError) {
      return previewError;
    }
    if (previewLegsMinutes != null) {
      const ord = previewOrdered ? " Optimized stop order." : "";
      return `Drive time (preview): ~${previewLegsMinutes} min.${ord}`;
    }
    if (canCallRoute) {
      return "Drive time will appear when the route can be computed.";
    }
    return null;
  }, [previewLoading, previewError, previewLegsMinutes, previewOrdered, canCallRoute]);

  const startOptions: DropdownOption<string>[] = useMemo(() => {
    const anchorOpts = savedAnchors.map((a) => ({
      value: a.id,
      label: a.label,
    }));
    return [
      { value: START_OPT_OMIT, label: "No start anchor (property stops only)" },
      { value: START_OPT_CUSTOM, label: "Custom start address" },
      ...anchorOpts,
    ];
  }, [savedAnchors]);

  const onStartDropdownChange = (value: string) => {
    if (value === START_OPT_OMIT) {
      onStartSelectionChange({ kind: "omit" });
      return;
    }
    if (value === START_OPT_CUSTOM) {
      onStartSelectionChange({
        kind: "custom",
        endpoint:
          startSelection.kind === "custom" ? startSelection.endpoint : emptyViewingRouteEndpoint(),
      });
      return;
    }
    onStartSelectionChange({ kind: "saved", anchorId: value });
  };

  const showCustomStart = startSelection.kind === "custom";

  return (
    <Box className="space-y-6">
      <Box className="bg-accent-muted/40 border-border space-y-3 rounded-lg border p-3">
        <Text className="text-text-primary text-base font-semibold">Start</Text>
        <BodyText size="xs" className="text-text-secondary">
          Meet-up or departure point.
        </BodyText>
        <Dropdown<string>
          label="Starting location"
          options={startOptions}
          value={startDropdownValue(startSelection)}
          onChange={onStartDropdownChange}
          variant="mobile"
        />
        {showCustomStart ? (
          <AddressInput
            label="Start address"
            value={startSelection.endpoint.address ?? ""}
            onChange={(v) =>
              onStartSelectionChange({
                kind: "custom",
                endpoint: { ...startSelection.endpoint, address: v, lat: null, lng: null },
              })
            }
            scriptsReady={scriptsReady}
            placeholder="Type meet-up address"
          />
        ) : null}
      </Box>

      <ViewingStopList stops={viewingStops} onStopsChange={onViewingStopsChange} />

      <Box className="border-border bg-muted/30 space-y-3 rounded-lg border p-3">
        <Text className="text-text-primary text-base font-semibold">End</Text>
        <BodyText size="xs" className="text-text-secondary">
          After the last property showing.
        </BodyText>
        <Box className="flex flex-row flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            iconName="flag"
            className={
              endMode === "last_property"
                ? "border border-neutral-400 bg-neutral-100"
                : "text-text-secondary border border-transparent"
            }
            onPress={() => onEndModeChange("last_property")}
          >
            Last property
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            iconName="refresh-cw"
            className={
              endMode === "return_to_start"
                ? "border border-neutral-400 bg-neutral-100"
                : "text-text-secondary border border-transparent"
            }
            onPress={() => onEndModeChange("return_to_start")}
          >
            Return to start
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            iconName="map-pin"
            className={
              endMode === "fixed"
                ? "border border-neutral-400 bg-neutral-100"
                : "text-text-secondary border border-transparent"
            }
            onPress={() => onEndModeChange("fixed")}
          >
            Fixed location
          </Button>
        </Box>
        {endMode === "fixed" ? (
          <AddressInput
            label="End address"
            value={endFixed?.address ?? ""}
            onChange={(v) =>
              onEndFixedChange({
                ...(endFixed ?? emptyViewingRouteEndpoint()),
                address: v,
                lat: null,
                lng: null,
              })
            }
            scriptsReady={scriptsReady}
            placeholder="Next stop after showings"
          />
        ) : null}
      </Box>

      {onSiteLine ? <Text className="text-text-secondary text-xs">{onSiteLine}</Text> : null}
      {driveLine ? (
        <Text
          className={`text-xs ${previewError ? "text-rose-600" : "text-text-secondary"} border-border rounded-lg border px-3 py-2`}
        >
          {driveLine}
        </Text>
      ) : null}
      {loadError ? <Text className="text-xs text-rose-600">{loadError}</Text> : null}
    </Box>
  );
}
