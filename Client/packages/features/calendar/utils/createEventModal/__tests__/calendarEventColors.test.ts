import { describe, expect, it } from "vitest";

import { color } from "packages/design-tokens";

import type { GoogleCalendar } from "@/features/calendar/api/types";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import {
  calendarColorForEvent,
  hexToRgba,
} from "@/features/calendar/utils/createEventModal/calendarEventColors";
import { CALENDAR_EVENT_KINDS } from "@/features/calendar/utils/createEventModal/calendarEventKinds";

describe("calendarColorForEvent", () => {
  it("uses event kind palette when summary matches a known type label", () => {
    const cals: GoogleCalendar[] = [];
    const ev: ExtendedGoogleEvent = {
      id: "e1",
      summary: CALENDAR_EVENT_KINDS.agent_consultation.label,
      start: { dateTime: "2026-06-01T10:00:00Z" },
      end: { dateTime: "2026-06-01T11:00:00Z" },
    };
    expect(calendarColorForEvent(ev, cals)).toBe(
      color(CALENDAR_EVENT_KINDS.agent_consultation.uiColorPath)
    );
  });

  it("uses matching calendar backgroundColor", () => {
    const calendarBg = color("green.DEFAULT");
    const cals: GoogleCalendar[] = [
      {
        id: "cal-1",
        summary: "Work",
        accessRole: "owner",
        backgroundColor: calendarBg,
      },
    ];
    const ev: ExtendedGoogleEvent = {
      id: "e1",
      summary: "Meet",
      start: { dateTime: "2026-06-01T10:00:00Z" },
      end: { dateTime: "2026-06-01T11:00:00Z" },
      calendarId: "cal-1",
    };
    expect(calendarColorForEvent(ev, cals)).toBe(calendarBg);
  });

  it("prefers Google Calendar colorId when set", () => {
    const cals: GoogleCalendar[] = [];
    const ev: ExtendedGoogleEvent = {
      id: "e1",
      summary: CALENDAR_EVENT_KINDS.agent_consultation.label,
      start: { dateTime: "2026-06-01T10:00:00Z" },
      end: { dateTime: "2026-06-01T11:00:00Z" },
      colorId: "9",
    };
    expect(calendarColorForEvent(ev, cals)).toBe(
      // eslint-disable-next-line silverkey/no-literal-hex-colors -- Google Calendar colorId 9 reference hex
      "#3f51b5"
    );
  });

  it("uses silverKeyEventType when the title no longer matches a kind label", () => {
    const cals: GoogleCalendar[] = [];
    const ev: ExtendedGoogleEvent = {
      id: "e1",
      summary: "Lunch with buyer",
      start: { dateTime: "2026-06-01T10:00:00Z" },
      end: { dateTime: "2026-06-01T11:00:00Z" },
      silverKeyEventType: "property_viewing",
    };
    expect(calendarColorForEvent(ev, cals)).toBe(
      color(CALENDAR_EVENT_KINDS.property_viewings.uiColorPath)
    );
  });

  it("infers type color from free-text title when there is no DB hint", () => {
    const cals: GoogleCalendar[] = [];
    const ev: ExtendedGoogleEvent = {
      id: "e1",
      summary: "Showing — 123 Main St",
      start: { dateTime: "2026-06-01T10:00:00Z" },
      end: { dateTime: "2026-06-01T11:00:00Z" },
    };
    expect(calendarColorForEvent(ev, cals)).toBe(
      color(CALENDAR_EVENT_KINDS.property_viewings.uiColorPath)
    );
  });
});

describe("hexToRgba", () => {
  it("parses 6-digit hex", () => {
    const hex = color("green.DEFAULT");
    expect(hexToRgba(hex, 0.2)).toBe("rgba(22,163,74,0.2)");
  });

  it("parses hsl design-token event kind colors", () => {
    const hsl = color(CALENDAR_EVENT_KINDS.agent_consultation.uiColorPath);
    expect(hexToRgba(hsl, 0.18)).toMatch(/^rgba\(\d+,\d+,\d+,0\.18\)$/);
    expect(hexToRgba(hsl, 0.18)).not.toBe("rgba(0,0,0,0.18)");
  });
});
