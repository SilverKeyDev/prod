import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { dateParseISO } from "packages/utils/core/date";

import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";

import {
  eventMatchesAgendaCalendarScope,
  filterAgendaEventsAllTime,
  filterTodayEvents,
} from "./eventFiltering";

const SILVERKEY_CAL_ID = "silverkey-cal@group.calendar.google.com";

function timedEvent(id: string, startIso: string, endIso: string, calendarId = "primary") {
  return {
    id,
    calendarId,
    summary: `Event ${id}`,
    start: { dateTime: startIso },
    end: { dateTime: endIso },
  } as ExtendedGoogleEvent;
}

function allDayEvent(
  id: string,
  startYmd: string,
  endExclusiveYmd: string,
  calendarId = "primary"
) {
  return {
    id,
    calendarId,
    summary: `Event ${id}`,
    start: { date: startYmd },
    end: { date: endExclusiveYmd },
  } as ExtendedGoogleEvent;
}

describe("eventMatchesAgendaCalendarScope", () => {
  it("accepts primary-tagged events when SilverKey calendar id is set", () => {
    const event = timedEvent("1", "2026-06-09T10:00:00", "2026-06-09T11:00:00");
    expect(eventMatchesAgendaCalendarScope(event, SILVERKEY_CAL_ID)).toBe(true);
  });

  it("accepts events whose calendarId matches SilverKey id", () => {
    const event = timedEvent("1", "2026-06-09T10:00:00", "2026-06-09T11:00:00", SILVERKEY_CAL_ID);
    expect(eventMatchesAgendaCalendarScope(event, SILVERKEY_CAL_ID)).toBe(true);
  });

  it("rejects events from an unrelated calendar", () => {
    const event = timedEvent(
      "1",
      "2026-06-09T10:00:00",
      "2026-06-09T11:00:00",
      "other@group.calendar.google.com"
    );
    expect(eventMatchesAgendaCalendarScope(event, SILVERKEY_CAL_ID)).toBe(false);
  });

  it("accepts all events when silverKeyCalendarId is null", () => {
    const event = timedEvent(
      "1",
      "2026-06-09T10:00:00",
      "2026-06-09T11:00:00",
      "other@group.calendar.google.com"
    );
    expect(eventMatchesAgendaCalendarScope(event, null)).toBe(true);
  });
});

describe("filterAgendaEventsAllTime", () => {
  it("includes primary-tagged events for SilverKey scope", () => {
    const events = [timedEvent("1", "2026-06-09T10:00:00", "2026-06-09T11:00:00")];
    expect(filterAgendaEventsAllTime(events, SILVERKEY_CAL_ID)).toHaveLength(1);
  });

  it("excludes unrelated calendars", () => {
    const events = [
      timedEvent(
        "1",
        "2026-06-09T10:00:00",
        "2026-06-09T11:00:00",
        "other@group.calendar.google.com"
      ),
    ];
    expect(filterAgendaEventsAllTime(events, SILVERKEY_CAL_ID)).toHaveLength(0);
  });
});

describe("filterTodayEvents", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(dateParseISO("2026-06-09T12:00:00.000Z").valueOf());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("includes a timed event on today", () => {
    const events = [timedEvent("today", "2026-06-09T14:00:00", "2026-06-09T15:00:00")];
    expect(filterTodayEvents(events, SILVERKEY_CAL_ID)).toHaveLength(1);
  });

  it("includes a multi-day all-day event that spans today", () => {
    const events = [allDayEvent("span", "2026-06-08", "2026-06-11")];
    expect(filterTodayEvents(events, SILVERKEY_CAL_ID)).toHaveLength(1);
  });

  it("excludes events only on another day", () => {
    const events = [timedEvent("tomorrow", "2026-06-10T14:00:00", "2026-06-10T15:00:00")];
    expect(filterTodayEvents(events, SILVERKEY_CAL_ID)).toHaveLength(0);
  });
});
