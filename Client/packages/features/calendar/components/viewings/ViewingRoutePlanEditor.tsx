import { useEffect, useMemo, useState } from "react";

import { buildViewingRoute } from "packages/api/viewings";
import { log, LOG_CATEGORIES } from "packages/logger";
import Button from "packages/ui/components/button/Button";
import { AddressInput } from "packages/ui/components/form/AddressInput";
import Dropdown, { type DropdownOption } from "packages/ui/components/form/dropdown";
import { Icon } from "packages/ui/components/icons";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

import { Title } from "@/components/ui";
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
  viewingTourStartToEndpoint,
} from "@/features/calendar/utils/viewing/viewingRoutePlan";

import type { ViewingRoutePlanEditorProps } from "./viewingRoutePlanEditor.types";
import { ViewingStopList } from "./ViewingStopList";

export type { ViewingRoutePlanEditorProps } from "./viewingRoutePlanEditor.types";

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

  const startEndpoint = useMemo(
    () => viewingTourStartToEndpoint(startSelection, savedAnchors),
    [startSelection, savedAnchors]
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
      return "Drive time will appear here when the route can be computed.";
    }
    return null;
  }, [previewLoading, previewError, previewLegsMinutes, previewOrdered, canCallRoute]);

  const startOptions: DropdownOption<string>[] = useMemo(() => {
    const anchorOpts = savedAnchors.map((a) => ({
      value: a.id,
      label: a.label,
      icon: <Icon name="building-2" className="text-text-secondary h-3.5 w-3.5" aria-hidden />,
    }));
    return [
      {
        value: START_OPT_OMIT,
        label: "No start anchor (property stops only)",
        icon: <Icon name="minus" className="text-text-secondary h-3.5 w-3.5" aria-hidden />,
      },
      {
        value: START_OPT_CUSTOM,
        label: "Custom start address",
        icon: <Icon name="map-pin" className="text-text-secondary h-3.5 w-3.5" aria-hidden />,
      },
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
  const startSectionTint = "bg-accent-muted/40 border-border";

  return (
    <Box className="space-y-6">
      <Box className={`space-y-3 rounded-lg border p-3 ${startSectionTint}`}>
        <Title size="sm" as="h3" className="flex items-center gap-2">
          <Icon name="map-pin" className="text-text-secondary h-4 w-4" aria-hidden />
          Start
        </Title>
        <BodyText size="xs" muted>
          Meet-up or departure point. Saved locations come from your profile client settings.
        </BodyText>
        <Dropdown<string>
          label="Starting location"
          options={startOptions}
          value={startDropdownValue(startSelection)}
          onChange={onStartDropdownChange}
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
            onSelect={(data) =>
              onStartSelectionChange({
                kind: "custom",
                endpoint: {
                  address: data.address,
                  label: data.street ?? data.address,
                  lat: data.lat ?? null,
                  lng: data.lng ?? null,
                },
              })
            }
            scriptsReady={scriptsReady}
            placeholder="Search or type meet-up address"
          />
        ) : null}
      </Box>

      <ViewingStopList
        stops={viewingStops}
        onStopsChange={onViewingStopsChange}
        scriptsReady={scriptsReady}
        loadError={loadError}
      />

      <Box className="border-border bg-muted/30 space-y-3 rounded-lg border p-3">
        <Title size="sm" as="h3" className="flex items-center gap-2">
          <Icon name="flag" className="text-text-secondary h-4 w-4" aria-hidden />
          End
        </Title>
        <BodyText size="xs" muted>
          What happens after the last property showing.
        </BodyText>
        <Box className="flex flex-col gap-2">
          <Box className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={endMode === "last_property" ? "secondary" : "outline"}
              onClick={() => onEndModeChange("last_property")}
            >
              Last property
            </Button>
            <Button
              type="button"
              size="sm"
              variant={endMode === "return_to_start" ? "secondary" : "outline"}
              onClick={() => onEndModeChange("return_to_start")}
              disabled={!viewingEndpointHasRoutingInput(startEndpoint)}
            >
              Return to start
            </Button>
            <Button
              type="button"
              size="sm"
              variant={endMode === "fixed" ? "secondary" : "outline"}
              onClick={() => onEndModeChange("fixed")}
            >
              Fixed location
            </Button>
          </Box>
          {endMode === "return_to_start" && !viewingEndpointHasRoutingInput(startEndpoint) ? (
            <BodyText size="xs" className="text-destructive">
              Set a start location to use “Return to start”.
            </BodyText>
          ) : null}
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
            onSelect={(data) =>
              onEndFixedChange({
                address: data.address,
                label: data.street ?? data.address,
                lat: data.lat ?? null,
                lng: data.lng ?? null,
              })
            }
            scriptsReady={scriptsReady}
            placeholder="Restaurant, airport, next appointment…"
          />
        ) : null}
      </Box>

      {onSiteLine ? (
        <BodyText size="xs" muted>
          {onSiteLine}
        </BodyText>
      ) : null}
      {driveLine ? (
        <BodyText
          size="xs"
          className={`border-border rounded-lg border px-3 py-2 ${
            previewError ? "text-destructive" : "text-text-secondary"
          }`}
        >
          {driveLine}
        </BodyText>
      ) : null}
    </Box>
  );
}
