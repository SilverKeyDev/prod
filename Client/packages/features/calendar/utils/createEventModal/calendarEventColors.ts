import { color } from "packages/design-tokens";
import { detectEventTypeFromTitle } from "packages/utils/calendar/detectEventTypeFromTitle";

import type { GoogleCalendar } from "@/features/calendar/api/types";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";

import {
  CALENDAR_EVENT_KINDS,
  calendarEventKindFromSummary,
  type CalendarEventKindId,
} from "./calendarEventKinds";

const HEX = /^#?([0-9a-fA-F]{6})$/;

/** Google Calendar API default event colors (colorId 1–11). */
const GOOGLE_CALENDAR_EVENT_COLOR_ID_HEX: Record<string, string> = {
  "1": "#7986cb",
  "2": "#33b679",
  "3": "#8e24aa",
  "4": "#e67c73",
  "5": "#f6bf26",
  "6": "#f4511e",
  "7": "#039be5",
  "8": "#616161",
  "9": "#3f51b5",
  "10": "#0b8043",
  "11": "#d50000",
};

/** Maps SilverKey create payload `eventType` / DB `event_type` to design-token paths. */
const SILVER_KEY_BACKEND_EVENT_TYPE_TO_COLOR_PATH: Record<string, string> = {
  property_viewing: CALENDAR_EVENT_KINDS.property_viewings.uiColorPath,
  inspection: CALENDAR_EVENT_KINDS.home_inspection.uiColorPath,
  closing: CALENDAR_EVENT_KINDS.closing_signing.uiColorPath,
  meeting: CALENDAR_EVENT_KINDS.meeting.uiColorPath,
  appointment: CALENDAR_EVENT_KINDS.phone_consultation.uiColorPath,
  open_house: CALENDAR_EVENT_KINDS.open_house.uiColorPath,
};

function parseHexRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.trim().match(HEX);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function hexFromGoogleColorId(colorId: unknown): string | null {
  if (colorId == null) return null;
  const key = String(colorId).trim();
  const hex = GOOGLE_CALENDAR_EVENT_COLOR_ID_HEX[key];
  return hex && parseHexRgb(hex) ? hex : null;
}

function normalizeBackendEventType(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim().toLowerCase();
  return t || null;
}

function colorPathForSilverKeyBackendType(hint: string | null | undefined): string | null {
  const n = normalizeBackendEventType(hint);
  if (!n) return null;
  return SILVER_KEY_BACKEND_EVENT_TYPE_TO_COLOR_PATH[n] ?? null;
}

function colorPathForCalendarEventKindId(id: CalendarEventKindId): string {
  return CALENDAR_EVENT_KINDS[id].uiColorPath;
}

/**
 * Resolve tint for an event:
 * 1. Google `colorId` when the event has its own calendar color
 * 2. Title matching a known SilverKey kind label (precise palette per kind)
 * 3. `silverKeyEventType` from the app DB (when the title was customized)
 * 4. Heuristic type from free-text title (`detectEventTypeFromTitle`)
 * 5. Calendar list color, then brand accent
 */
export function calendarColorForEvent(
  event: ExtendedGoogleEvent,
  calendars: GoogleCalendar[]
): string {
  const fromGoogleColorId = hexFromGoogleColorId(event.colorId);
  if (fromGoogleColorId) return fromGoogleColorId;

  const kindFromSummary = calendarEventKindFromSummary(event.summary ?? "");
  if (kindFromSummary) {
    const fromKind = color(colorPathForCalendarEventKindId(kindFromSummary));
    if (fromKind) return fromKind;
  }

  const pathFromDb = colorPathForSilverKeyBackendType(event.silverKeyEventType ?? undefined);
  if (pathFromDb) {
    const fromPath = color(pathFromDb);
    if (fromPath) return fromPath;
  }

  const pathFromTitle = colorPathForSilverKeyBackendType(
    detectEventTypeFromTitle(event.summary ?? "")
  );
  if (pathFromTitle) {
    const fromPath = color(pathFromTitle);
    if (fromPath) return fromPath;
  }

  const calId =
    "calendarId" in event && typeof event.calendarId === "string" ? event.calendarId : undefined;
  if (calId) {
    const cal = calendars.find((c) => c.id === calId);
    const bg = cal?.backgroundColor;
    if (bg && parseHexRgb(bg)) return bg.startsWith("#") ? bg : `#${bg}`;
  }
  return color("brand.accent");
}

export function hexToRgba(hex: string, alpha: number): string {
  const rgb = parseHexRgb(hex);
  if (!rgb) return `rgba(0,0,0,${alpha})`;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}
