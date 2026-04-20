import { color } from "packages/design-tokens";

import type { GoogleCalendar } from "@/features/calendar/api/types";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";

import { CALENDAR_EVENT_KIND_ORDER, CALENDAR_EVENT_KINDS } from "./calendarEventKinds";

const HEX = /^#?([0-9a-fA-F]{6})$/;

function parseHexRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.trim().match(HEX);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function colorPathForEventSummary(summary: string | undefined): string | null {
  const t = (summary ?? "").trim().toLowerCase();
  if (!t) return null;
  for (const id of CALENDAR_EVENT_KIND_ORDER) {
    if (id === "other") continue;
    if (t === CALENDAR_EVENT_KINDS[id].label.toLowerCase()) {
      return CALENDAR_EVENT_KINDS[id].uiColorPath;
    }
  }
  return null;
}

/**
 * Resolve tint for an event: known SilverKey event-type titles use muted palette;
 * otherwise use the calendar list color; fallback to brand accent.
 */
export function calendarColorForEvent(
  event: ExtendedGoogleEvent,
  calendars: GoogleCalendar[]
): string {
  const kindPath = colorPathForEventSummary(event.summary);
  if (kindPath) {
    const fromKind = color(kindPath);
    if (fromKind) return fromKind;
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
