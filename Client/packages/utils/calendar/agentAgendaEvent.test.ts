import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { dateParseISO } from "packages/utils/date";

import { buildAgentTodoGoogleEvent, parseAgendaDeadlineTime } from "./agentAgendaEvent";

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
    resolvedSpy = vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({
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
    const start = event.start as { date?: string; dateTime?: string };
    const end = event.end as { date?: string; dateTime?: string };
    expect(start.date).toBe("2026-06-15");
    expect(end.date).toBe("2026-06-16");
    expect(start.dateTime).toBeUndefined();
    expect(end.dateTime).toBeUndefined();
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
    expect(event.description).toBe("Bring contract\n\nAdded from SilverKey to-dos.");
  });

  it("throws when deadlineDate is missing or invalid", () => {
    expect(() =>
      buildAgentTodoGoogleEvent({
        title: "x",
        deadlineDate: "",
        deadlineTime: null,
        calendarId: "primary",
      })
    ).toThrow();
    expect(() =>
      buildAgentTodoGoogleEvent({
        title: "x",
        deadlineDate: "not-a-date",
        deadlineTime: null,
        calendarId: "primary",
      })
    ).toThrow();
  });

  it("uses timed dateTime with 1-hour duration when deadlineTime is set", () => {
    const event = buildAgentTodoGoogleEvent({
      title: "Call",
      deadlineDate: "2026-06-15",
      deadlineTime: "14:30",
      calendarId: "primary",
    });
    const start = event.start as { date?: string; dateTime?: string; timeZone?: string };
    const end = event.end as { date?: string; dateTime?: string };
    expect(start.date).toBeUndefined();
    expect(end.date).toBeUndefined();
    expect(start.dateTime).toBeDefined();
    expect(end.dateTime).toBeDefined();
    expect(start.timeZone).toBe("UTC");
    const startMs = dateParseISO(start.dateTime!).valueOf();
    const endMs = dateParseISO(end.dateTime!).valueOf();
    expect(endMs - startMs).toBe(60 * 60 * 1000);
  });

  it("includes addGoogleMeet when set", () => {
    const event = buildAgentTodoGoogleEvent({
      title: "Call",
      deadlineDate: "2026-06-15",
      deadlineTime: "14:30",
      calendarId: "primary",
      addGoogleMeet: true,
    });
    expect(event.addGoogleMeet).toBe(true);
  });

  it("does not pass addGoogleMeet for all-day agenda events", () => {
    const event = buildAgentTodoGoogleEvent({
      title: "Deadline",
      deadlineDate: "2026-06-15",
      deadlineTime: null,
      calendarId: "primary",
      addGoogleMeet: true,
    });
    expect(event.addGoogleMeet).toBeUndefined();
    expect((event.start as { date?: string }).date).toBeDefined();
  });
});
