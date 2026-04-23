import type { components } from "packages/types/api.generated";

export type ViewingRouteEndMode = components["schemas"]["ViewingRouteEndMode"];
export type ViewingRouteEndpoint = components["schemas"]["ViewingRouteEndpoint"];
export type ViewingItinerary = components["schemas"]["ViewingItinerary"];
export type ViewingStop = components["schemas"]["ViewingStop"];

export type ViewingTourAnchor = NonNullable<
  components["schemas"]["ViewingTourClientSettings"]["anchors"]
>[number];

export type ViewingTourStartSelection =
  | { kind: "omit" }
  | { kind: "saved"; anchorId: string }
  | { kind: "custom"; endpoint: ViewingRouteEndpoint };

export function emptyViewingRouteEndpoint(): ViewingRouteEndpoint {
  return { label: null, address: null, lat: null, lng: null };
}

export function viewingEndpointHasRoutingInput(
  ep: ViewingRouteEndpoint | null | undefined
): boolean {
  if (!ep) {
    return false;
  }
  const addr = (ep.address ?? "").trim();
  if (addr.length > 0) {
    return true;
  }
  return ep.lat != null && ep.lng != null;
}

export function viewingTourStartToEndpoint(
  sel: ViewingTourStartSelection,
  anchors: ViewingTourAnchor[]
): ViewingRouteEndpoint | null {
  if (sel.kind === "omit") {
    return null;
  }
  if (sel.kind === "saved") {
    const a = anchors.find((x) => x.id === sel.anchorId);
    return a?.endpoint ?? null;
  }
  return sel.endpoint;
}

function endpointsRoughlyMatch(a: ViewingRouteEndpoint, b: ViewingRouteEndpoint): boolean {
  const addrA = (a.address ?? "").trim();
  const addrB = (b.address ?? "").trim();
  if (addrA && addrB && addrA === addrB) {
    return true;
  }
  if (a.lat != null && a.lng != null && b.lat != null && b.lng != null) {
    return Math.abs(a.lat - b.lat) < 1e-5 && Math.abs(a.lng - b.lng) < 1e-5;
  }
  return false;
}

export function inferViewingTourStartSelection(
  start: ViewingRouteEndpoint | null | undefined,
  anchors: ViewingTourAnchor[]
): ViewingTourStartSelection {
  if (!start || !viewingEndpointHasRoutingInput(start)) {
    return { kind: "omit" };
  }
  for (const a of anchors) {
    if (endpointsRoughlyMatch(start, a.endpoint)) {
      return { kind: "saved", anchorId: a.id };
    }
  }
  return { kind: "custom", endpoint: { ...start } };
}

export type BuildViewingItineraryDraftInput = {
  stops: ViewingStop[];
  startSelection: ViewingTourStartSelection;
  anchors: ViewingTourAnchor[];
  endMode: ViewingRouteEndMode;
  endFixed: ViewingRouteEndpoint | null;
};

/** Build itinerary payload sent to the server before route resolution. */
export function buildViewingItineraryDraftFromForm(
  input: BuildViewingItineraryDraftInput
): ViewingItinerary | null {
  const nonEmptyStops = input.stops.filter((s) => (s.address ?? "").trim().length > 0);
  if (nonEmptyStops.length < 1) {
    return null;
  }

  const start = viewingTourStartToEndpoint(input.startSelection, input.anchors);
  const end =
    input.endMode === "fixed" && viewingEndpointHasRoutingInput(input.endFixed)
      ? input.endFixed
      : null;

  const itinerary: ViewingItinerary = {
    stops: nonEmptyStops,
    ordered: false,
    legs: null,
    start: start ?? null,
    end,
    end_mode: input.endMode,
  };
  return itinerary;
}

/** Calendar / request location line: meet-up first, else first property. */
export function primaryLocationLabelFromItinerary(itinerary: ViewingItinerary): string | null {
  if (viewingEndpointHasRoutingInput(itinerary.start ?? null)) {
    const s = itinerary.start;
    return (s?.label ?? s?.address ?? "").trim() || null;
  }
  const first = itinerary.stops[0];
  if (!first) {
    return null;
  }
  return (first.label ?? first.address).trim() || null;
}

function stopHasCoords(s: ViewingStop): boolean {
  return s.lat != null && s.lng != null;
}

/**
 * Counts routable nodes (matches server `itinerary_path_coordinates` / navigate eligibility).
 */
export function countItineraryNavigationNodes(
  itinerary: ViewingItinerary | null | undefined
): number {
  if (!itinerary?.stops?.length) {
    return 0;
  }
  const endMode = itinerary.end_mode ?? "last_property";
  const hasExplicitStart = viewingEndpointHasRoutingInput(itinerary.start ?? null);

  if (hasExplicitStart) {
    let n = 0;
    if (viewingEndpointHasRoutingInput(itinerary.start ?? null)) {
      n += 1;
    }
    for (const s of itinerary.stops) {
      if (stopHasCoords(s)) {
        n += 1;
      }
    }
    if (endMode === "return_to_start" && viewingEndpointHasRoutingInput(itinerary.start ?? null)) {
      n += 1;
    } else if (endMode === "fixed" && viewingEndpointHasRoutingInput(itinerary.end ?? null)) {
      n += 1;
    }
    return n;
  }

  return itinerary.stops.filter((s) => stopHasCoords(s)).length;
}

export function itineraryCanOpenNavigation(
  itinerary: ViewingItinerary | null | undefined
): boolean {
  return countItineraryNavigationNodes(itinerary) >= 2;
}

/** Short lines for agenda / event cards. */
export function formatViewingItinerarySummaryLines(itinerary: ViewingItinerary): string[] {
  const lines: string[] = [];
  if (viewingEndpointHasRoutingInput(itinerary.start ?? null)) {
    const s = itinerary.start!;
    lines.push(`Start: ${(s.label ?? s.address ?? "Meet-up").trim()}`);
  }
  itinerary.stops.forEach((stop, i) => {
    lines.push(`${i + 1}. ${(stop.label ?? stop.address ?? `Property ${i + 1}`).trim()}`);
  });
  const em = itinerary.end_mode ?? "last_property";
  if (em === "return_to_start") {
    lines.push("End: Return to start");
  } else if (em === "fixed" && viewingEndpointHasRoutingInput(itinerary.end ?? null)) {
    const e = itinerary.end!;
    lines.push(`End: ${(e.label ?? e.address ?? "Destination").trim()}`);
  } else {
    lines.push("End: Last property");
  }
  return lines;
}
