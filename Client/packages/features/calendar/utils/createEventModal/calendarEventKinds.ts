/** Backend hint for create/update; aligns with detectEventTypeFromTitle categories where applicable. */
export type CalendarEventKindId =
  | "agent_consultation"
  | "phone_consultation"
  | "meeting"
  | "open_house"
  | "property_viewings"
  | "home_inspection"
  | "appraisal"
  | "walkthrough"
  | "closing_signing"
  | "other";

export type CalendarBackendEventTypeHint =
  | "property_viewing"
  | "inspection"
  | "closing"
  | "meeting"
  | "appointment"
  | "open_house"
  | undefined;

export type CalendarEventKindDefinition = {
  id: CalendarEventKindId;
  label: string;
  backendEventTypeHint: CalendarBackendEventTypeHint;
  /** When true, show multi-stop viewing UI (single-calendar itinerary). */
  usesViewingStops: boolean;
  /** Path for design-tokens `color()`, e.g. calendar.eventKind.lavender */
  uiColorPath: string;
};

export const CALENDAR_EVENT_KINDS: Record<CalendarEventKindId, CalendarEventKindDefinition> = {
  agent_consultation: {
    id: "agent_consultation",
    label: "Agent consultation",
    backendEventTypeHint: "meeting",
    usesViewingStops: false,
    uiColorPath: "calendar.eventKind.mauve",
  },
  phone_consultation: {
    id: "phone_consultation",
    label: "Phone consultation",
    backendEventTypeHint: "appointment",
    usesViewingStops: false,
    uiColorPath: "calendar.eventKind.slateBlue",
  },
  meeting: {
    id: "meeting",
    label: "Meeting",
    backendEventTypeHint: "meeting",
    usesViewingStops: false,
    uiColorPath: "calendar.eventKind.dustyRose",
  },
  open_house: {
    id: "open_house",
    label: "Open house",
    backendEventTypeHint: "open_house",
    usesViewingStops: false,
    uiColorPath: "calendar.eventKind.mutedOrange",
  },
  property_viewings: {
    id: "property_viewings",
    label: "Property viewings",
    backendEventTypeHint: "property_viewing",
    usesViewingStops: true,
    uiColorPath: "calendar.eventKind.warmBrown",
  },
  home_inspection: {
    id: "home_inspection",
    label: "Home inspection",
    backendEventTypeHint: "inspection",
    usesViewingStops: false,
    uiColorPath: "calendar.eventKind.sage",
  },
  appraisal: {
    id: "appraisal",
    label: "Appraisal",
    backendEventTypeHint: "appointment",
    usesViewingStops: false,
    uiColorPath: "calendar.eventKind.goldMuted",
  },
  walkthrough: {
    id: "walkthrough",
    label: "Final walkthrough",
    backendEventTypeHint: "meeting",
    usesViewingStops: false,
    uiColorPath: "calendar.eventKind.terracotta",
  },
  closing_signing: {
    id: "closing_signing",
    label: "Closing / signing",
    backendEventTypeHint: "closing",
    usesViewingStops: false,
    uiColorPath: "calendar.eventKind.maroon",
  },
  other: {
    id: "other",
    label: "Other",
    backendEventTypeHint: undefined,
    usesViewingStops: false,
    uiColorPath: "neutral.500",
  },
};

export const CALENDAR_EVENT_KIND_ORDER: CalendarEventKindId[] = [
  "agent_consultation",
  "phone_consultation",
  "meeting",
  "open_house",
  "property_viewings",
  "home_inspection",
  "appraisal",
  "walkthrough",
  "closing_signing",
  "other",
];

export function getCalendarEventKind(id: CalendarEventKindId): CalendarEventKindDefinition {
  return CALENDAR_EVENT_KINDS[id];
}

/** Match saved event summary to a known kind (case-insensitive). */
/** Maps kind to API `eventType` string when present. */
export function explicitEventTypeForCalendarKind(id: CalendarEventKindId): string | undefined {
  const hint = CALENDAR_EVENT_KINDS[id].backendEventTypeHint;
  return hint;
}

export function calendarEventKindFromSummary(summary: string): CalendarEventKindId | null {
  const t = summary.trim().toLowerCase();
  if (!t) return null;
  for (const id of CALENDAR_EVENT_KIND_ORDER) {
    if (id === "other") continue;
    const label = CALENDAR_EVENT_KINDS[id].label.toLowerCase();
    if (t === label) return id;
  }
  return null;
}
