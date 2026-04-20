import { describe, expect, it } from "vitest";

import { color } from "packages/design-tokens";

import type { GoogleCalendar } from "@/features/calendar/api/types";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";

import { calendarColorForEvent, hexToRgba } from "./calendarEventColors";
import { CALENDAR_EVENT_KINDS } from "./calendarEventKinds";

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
});

describe("hexToRgba", () => {
  it("parses 6-digit hex", () => {
    const hex = color("green.DEFAULT");
    expect(hexToRgba(hex, 0.2)).toBe("rgba(22,163,74,0.2)");
  });
});
