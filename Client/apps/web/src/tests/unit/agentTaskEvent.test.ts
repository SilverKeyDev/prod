/**
 * Import utils directly: the calendar feature barrel re-exports components that Vitest cannot
 * resolve in this app test graph (see Calendar.tsx → hooks). These tests cover pure date helpers only.
 */
/* eslint-disable silverkey/no-cross-feature-internals */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildAgentTodoGoogleEvent,
  parseAgendaDeadlineTime,
} from "packages/features/calendar/utils/agentTaskEvent";
import { dateParseISO } from "packages/utils/date";

describe("parseAgendaDeadlineTime", () => {
  it("returns null for empty", () => {
    expect(parseAgendaDeadlineTime(null)).toBeNull();
    expect(parseAgendaDeadlineTime("")).toBeNull();
    expect(parseAgendaDeadlineTime("   ")).toBeNull();
  });

  it("parses HH:mm", () => {
    expect(parseAgendaDeadlineTime("14:30")).toEqual({ hour: 14, minute: 30 });
    expect(parseAgendaDeadlineTime("9:05")).toEqual({ hour: 9, minute: 5 });
  });

  it("rejects invalid values", () => {
    expect(parseAgendaDeadlineTime("24:00")).toBeNull();
    expect(parseAgendaDeadlineTime("12:60")).toBeNull();
    expect(parseAgendaDeadlineTime("bad")).toBeNull();
  });
});

describe("buildAgentTodoGoogleEvent", () => {
  let resolvedSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resolvedSpy = vi
      .spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions")
      .mockReturnValue({
        locale: "en-US",
        calendar: "gregory",
        numberingSystem: "latn",
        timeZone: "UTC",
      } as Intl.ResolvedDateTimeFormatOptions);
  });

  afterEach(() => {
    resolvedSpy.mockRestore();
  });

  it("uses all-day date fields when deadlineTime is absent", () => {
    const event = buildAgentTodoGoogleEvent({
      title: "Review listing",
      deadlineDate: "2026-06-15",
      deadlineTime: null,
      calendarId: "primary",
    });
    expect(event.start.date).toBe("2026-06-15");
    expect(event.end.date).toBe("2026-06-16");
    expect(event.start.dateTime).toBeUndefined();
    expect(event.end.dateTime).toBeUndefined();
    expect(event.summary).toBe("Review listing");
    expect(event.description).toBe("Added from SilverKey to-dos.");
  });

  it("prepends optional description before the SilverKey footer", () => {
    const event = buildAgentTodoGoogleEvent({
      title: "Review",
      deadlineDate: "2026-06-15",
      deadlineTime: null,
      calendarId: "primary",
      description: "Bring contract",
    });
    expect(event.description).toBe(
      "Bring contract\n\nAdded from SilverKey to-dos.",
    );
  });

  it("throws when deadlineDate is missing or invalid", () => {
    expect(() =>
      buildAgentTodoGoogleEvent({
        title: "x",
        deadlineDate: "",
        deadlineTime: null,
        calendarId: "primary",
      }),
    ).toThrow();
    expect(() =>
      buildAgentTodoGoogleEvent({
        title: "x",
        deadlineDate: "not-a-date",
        deadlineTime: null,
        calendarId: "primary",
      }),
    ).toThrow();
  });

  it("uses timed dateTime with 1-hour duration when deadlineTime is set", () => {
    const event = buildAgentTodoGoogleEvent({
      title: "Call",
      deadlineDate: "2026-06-15",
      deadlineTime: "14:30",
      calendarId: "primary",
    });
    expect(event.start.date).toBeUndefined();
    expect(event.end.date).toBeUndefined();
    expect(event.start.dateTime).toBeDefined();
    expect(event.end.dateTime).toBeDefined();
    expect(event.start.timeZone).toBe("UTC");
    const startMs = dateParseISO(event.start.dateTime!).valueOf();
    const endMs = dateParseISO(event.end.dateTime!).valueOf();
    expect(endMs - startMs).toBe(60 * 60 * 1000);
  });
});
