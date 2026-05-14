import { useEffect, useRef } from "react";

import type { ViewingStop } from "@/features/calendar/components/viewings/ViewingStopList";
import type {
  ViewingRouteEndMode,
  ViewingRouteEndpoint,
  ViewingTourAnchor,
  ViewingTourStartSelection,
} from "@/features/calendar/utils/viewing/viewingRoutePlan";
import {
  viewingEndpointHasRoutingInput,
  viewingTourStartToEndpoint,
} from "@/features/calendar/utils/viewing/viewingRoutePlan";

type ClientSettingsViewingTour = {
  default_start_anchor_id?: string;
  anchors?: ViewingTourAnchor[];
} | null;

type UseCreateEventModalViewingRouteEffectsArgs = {
  isOpen: boolean;
  mode?: "create" | "edit";
  isPropertyViewing: boolean;
  viewingStops: ViewingStop[];
  setViewingStops: (v: ViewingStop[]) => void;
  setViewingStartSelection: (v: ViewingTourStartSelection) => void;
  setViewingEndMode: (v: ViewingRouteEndMode) => void;
  setViewingEndFixed: (v: ViewingRouteEndpoint | null) => void;
  viewingTourAnchors: ViewingTourAnchor[];
  clientSettingsViewingTour: ClientSettingsViewingTour;
  viewingEndMode: ViewingRouteEndMode;
  viewingStartSelection: ViewingTourStartSelection;
};

export function useCreateEventModalViewingRouteEffects({
  isOpen,
  mode,
  isPropertyViewing,
  viewingStops: _viewingStops,
  setViewingStops,
  setViewingStartSelection,
  setViewingEndMode,
  setViewingEndFixed,
  viewingTourAnchors,
  clientSettingsViewingTour,
  viewingEndMode,
  viewingStartSelection,
}: UseCreateEventModalViewingRouteEffectsArgs) {
  const defaultStartAnchorAppliedRef = useRef(false);

  useEffect(() => {
    if (!isPropertyViewing) {
      setViewingStops([]);
      setViewingStartSelection({ kind: "omit" });
      setViewingEndMode("last_property");
      setViewingEndFixed(null);
      defaultStartAnchorAppliedRef.current = false;
    }
  }, [
    isPropertyViewing,
    setViewingEndFixed,
    setViewingEndMode,
    setViewingStartSelection,
    setViewingStops,
  ]);

  useEffect(() => {
    if (!isOpen) {
      defaultStartAnchorAppliedRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isPropertyViewing || mode !== "create") {
      return;
    }
    if (defaultStartAnchorAppliedRef.current) {
      return;
    }
    const vt = clientSettingsViewingTour ?? undefined;
    const defId = vt?.default_start_anchor_id;
    const anchors = vt?.anchors;
    if (!defId || !anchors?.length) {
      return;
    }
    const match = anchors.find((a) => a.id === defId);
    if (match) {
      setViewingStartSelection({ kind: "saved", anchorId: defId });
      defaultStartAnchorAppliedRef.current = true;
    }
  }, [isOpen, isPropertyViewing, mode, clientSettingsViewingTour, setViewingStartSelection]);

  useEffect(() => {
    if (viewingEndMode !== "return_to_start") {
      return;
    }
    const ep = viewingTourStartToEndpoint(viewingStartSelection, viewingTourAnchors);
    if (!viewingEndpointHasRoutingInput(ep)) {
      setViewingEndMode("last_property");
    }
  }, [viewingEndMode, viewingStartSelection, viewingTourAnchors, setViewingEndMode]);
}
