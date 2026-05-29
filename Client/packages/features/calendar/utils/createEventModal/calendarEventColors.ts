import { color } from "packages/design-tokens";
import { detectEventTypeFromTitle } from "packages/utils/calendar/parsing/detectEventTypeFromTitle";

import type { GoogleCalendar } from "@/features/calendar/api/types";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";

import {
  CALENDAR_EVENT_KINDS,
  calendarEventKindFromSummary,
  type CalendarEventKindId,
} from "./calendarEventKinds";

const HEX = /^#?([0-9a-fA-F]{6})$/;
const HSL = /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*[\d.]+\s*)?\)$/i;
const RGB = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i;

/** Google Calendar API default event colors (colorId 1–11); hex values match Google's palette. */
/* eslint-disable silverkey/no-literal-hex-colors -- external Google Calendar colorId reference */
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
/* eslint-enable silverkey/no-literal-hex-colors */

/** Maps SilverKey create payload `eventType` / DB `event_type` to design-token paths. */
const SILVER_KEY_BACKEND_EVENT_TYPE_TO_COLOR_PATH: Record<string, string> = {
  property_viewing: CALENDAR_EVENT_KINDS.property_viewings.uiColorPath,
  inspection: CALENDAR_EVENT_KINDS.home_inspection.uiColorPath,
  closing: CALENDAR_EVENT_KINDS.closing_signing.uiColorPath,
  meeting: CALENDAR_EVENT_KINDS.meeting.uiColorPath,
  appointment: CALENDAR_EVENT_KINDS.phone_consultation.uiColorPath,
  open_house: CALENDAR_EVENT_KINDS.open_house.uiColorPath,
};

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const sat = s / 100;
  const lit = l / 100;
  const c = (1 - Math.abs(2 * lit - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lit - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/** Parse hex, hsl(), or rgb() from design tokens or Google calendar hex. */
function parseColorRgb(value: string): { r: number; g: number; b: number } | null {
  const s = value.trim();
  const hexMatch = s.match(HEX);
  if (hexMatch) {
    const n = parseInt(hexMatch[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  const hslMatch = s.match(HSL);
  if (hslMatch) {
    return hslToRgb(parseFloat(hslMatch[1]), parseFloat(hslMatch[2]), parseFloat(hslMatch[3]));
  }
  const rgbMatch = s.match(RGB);
  if (rgbMatch) {
    return { r: Number(rgbMatch[1]), g: Number(rgbMatch[2]), b: Number(rgbMatch[3]) };
  }
  return null;
}

function parseHexRgb(hex: string): { r: number; g: number; b: number } | null {
  return parseColorRgb(hex);
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

/** Apply alpha to a resolved token color (hex, hsl, or rgb string). */
export function hexToRgba(colorValue: string, alpha: number): string {
  const rgb = parseColorRgb(colorValue);
  if (!rgb) {
    const fallback = parseColorRgb(color("neutral.900"));
    if (fallback) {
      return `rgba(${fallback.r},${fallback.g},${fallback.b},${alpha})`;
    }
    return `rgba(0,0,0,${alpha})`;
  }
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}
