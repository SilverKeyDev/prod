import { describe, expect, it } from "vitest";

import { expandProfileAvailabilityToEvents } from "./expandProfileAvailabilityToEvents";

describe("expandProfileAvailabilityToEvents", () => {
  it("expands a weekly rule for each matching weekday in range", () => {
    const events = expandProfileAvailabilityToEvents(
      {
        timezone: "UTC",
        weekly: [{ id: "w1", weekday: 1, start: "10:00", end: "11:00" }],
      },
      "2026-04-13T00:00:00.000Z",
      "2026-04-19T23:59:59.999Z",
      "Open"
    );
    const mondays = events.filter((e) => e.id.includes("w1"));
    expect(mondays.length).toBeGreaterThanOrEqual(1);
    expect(mondays[0]?.summary).toBe("Open");
    expect(mondays[0]?.isProfileAvailabilityEvent).toBe(true);
  });

  it("skips weekly instances covered by an exception", () => {
    const events = expandProfileAvailabilityToEvents(
      {
        timezone: "UTC",
        weekly: [{ id: "w1", weekday: 1, start: "10:00", end: "11:00" }],
        exceptions: [
          {
            id: "e1",
            scope: "weekly",
            ruleId: "w1",
            date: "2026-04-13",
          },
        ],
      },
      "2026-04-13T00:00:00.000Z",
      "2026-04-19T23:59:59.999Z"
    );
    expect(events.some((e) => e.id.endsWith("2026-04-13"))).toBe(false);
  });

  it("includes one-off slots in range", () => {
    const events = expandProfileAvailabilityToEvents(
      {
        timezone: "UTC",
        oneOff: [
          {
            id: "o1",
            date: "2026-04-15",
            start: "14:00",
            end: "15:00",
          },
        ],
      },
      "2026-04-13T00:00:00.000Z",
      "2026-04-19T23:59:59.999Z"
    );
    expect(events.some((e) => e.id === "avail-once-o1")).toBe(true);
  });

  it("returns empty when no weekly or one-off", () => {
    expect(
      expandProfileAvailabilityToEvents(
        { timezone: "UTC", exceptions: [] },
        "2026-04-13T00:00:00.000Z",
        "2026-04-19T23:59:59.999Z"
      ).length
    ).toBe(0);
  });
});
