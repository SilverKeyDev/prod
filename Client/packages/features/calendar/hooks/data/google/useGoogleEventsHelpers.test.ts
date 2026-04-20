import { describe, expect, it, vi } from "vitest";

import type { GoogleEvent } from "packages/config/http/api";

import { buildEventsListQueryFn } from "./useGoogleEventsHelpers";

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
  describe("buildEventsListQueryFn", () => {
    it("fetches and maps events from googleCalendarApi.listEvents", async () => {
      const { googleCalendarApi } = await import("packages/features/calendar/api");
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
