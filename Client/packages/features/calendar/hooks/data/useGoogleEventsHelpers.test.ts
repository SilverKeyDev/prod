import { describe, expect, it, vi } from "vitest";

import type { GoogleCalendar, GoogleEvent } from "packages/config/http/api";

import {
  aggregateFetchedEvents,
  buildEventsListQueryFn,
  getCalendarsWithoutCache,
  getFirstFetchError,
  resolveCalendarId,
  resolveCalendarIds,
} from "./useGoogleEventsHelpers";

vi.mock("packages/features/calendar/api", () => ({
  googleCalendarApi: {
    listEvents: vi.fn(),
  },
}));

vi.mock("packages/logger", () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  LOG_CATEGORIES: { CALENDAR: "calendar" },
}));

describe("useGoogleEventsHelpers", () => {
  describe("resolveCalendarId", () => {
    const calendars: GoogleCalendar[] = [
      { id: "primary-id", summary: "Primary", primary: true } as GoogleCalendar,
      { id: "other", summary: "Other", primary: false } as GoogleCalendar,
    ];

    it("returns non-primary ids unchanged", () => {
      expect(resolveCalendarId(calendars, "other")).toBe("other");
    });

    it("resolves primary to the primary calendar id", () => {
      expect(resolveCalendarId(calendars, "primary")).toBe("primary-id");
    });

    it("returns null when primary requested but not in cache", () => {
      expect(resolveCalendarId([], "primary")).toBeNull();
    });
  });

  describe("resolveCalendarIds", () => {
    it("maps calendarIds through resolve", () => {
      const resolved = resolveCalendarIds({ calendarIds: ["a", "b"] }, (id) =>
        id === "a" ? "a1" : "b1",
      );
      expect(resolved).toEqual(["a1", "b1"]);
    });

    it("returns null when every id resolves to null", () => {
      const resolved = resolveCalendarIds({ calendarIds: ["x"] }, () => null);
      expect(resolved).toBeNull();
    });

    it("handles single calendarId", () => {
      const resolved = resolveCalendarIds(
        { calendarId: "z" },
        (id) => `_${id}`,
      );
      expect(resolved).toEqual(["_z"]);
    });

    it("returns empty array when no ids provided", () => {
      expect(resolveCalendarIds({}, () => null)).toEqual([]);
    });
  });

  describe("getCalendarsWithoutCache", () => {
    it("returns ids with no cached entry", () => {
      const getCached = (id: string) => (id === "a" ? [] : undefined);
      expect(getCalendarsWithoutCache(["a", "b"], getCached)).toEqual(["b"]);
    });

    it("returns empty when calendarIds is null", () => {
      expect(getCalendarsWithoutCache(null, () => undefined)).toEqual([]);
    });
  });

  describe("aggregateFetchedEvents", () => {
    it("flattens data arrays from query results", () => {
      const e1 = { id: "1" } as GoogleEvent;
      const e2 = { id: "2" } as GoogleEvent;
      const out = aggregateFetchedEvents([
        { data: [e1], error: null } as never,
        { data: [e2], error: null } as never,
      ]);
      expect(out).toEqual([e1, e2]);
    });
  });

  describe("getFirstFetchError", () => {
    it("returns first Error message", () => {
      const msg = getFirstFetchError([
        { error: null } as never,
        { error: new Error("boom") } as never,
      ]);
      expect(msg).toBe("boom");
    });

    it("returns null when no errors", () => {
      expect(getFirstFetchError([{ error: null } as never])).toBeNull();
    });
  });

  describe("buildEventsListQueryFn", () => {
    it("fetches and maps events from googleCalendarApi.listEvents", async () => {
      const { googleCalendarApi } = await import(
        "packages/features/calendar/api"
      );
      vi.mocked(googleCalendarApi.listEvents).mockResolvedValue({
        success: true,
        data: {
          items: [{ id: "evt-1", calendarId: "" } as GoogleEvent],
        },
      } as never);

      const qf = buildEventsListQueryFn("cal-1", "2026-01-01", "2026-01-31");
      const events = await qf();

      expect(googleCalendarApi.listEvents).toHaveBeenCalledWith({
        calendarId: "cal-1",
        timeMin: "2026-01-01",
        timeMax: "2026-01-31",
      });
      expect(events).toEqual([{ id: "evt-1", calendarId: "cal-1" }]);
    });
  });
});
