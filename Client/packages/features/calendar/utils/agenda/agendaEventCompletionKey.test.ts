import { describe, expect, it } from "vitest";

import {
  agendaEventCompletionKey,
  filterAgendaEventsExcludingCompleted,
} from "./agendaEventCompletionKey";

describe("agendaEventCompletionKey", () => {
  it("builds a stable calendarId:eventId key", () => {
    expect(agendaEventCompletionKey({ id: "evt-1", calendarId: "primary" })).toBe("primary:evt-1");
    expect(agendaEventCompletionKey({ id: "evt-2" })).toBe("primary:evt-2");
  });
});

describe("filterAgendaEventsExcludingCompleted", () => {
  it("removes events whose keys are marked complete", () => {
    const events = [
      { id: "a", calendarId: "primary", summary: "A" },
      { id: "b", calendarId: "primary", summary: "B" },
    ];
    const filtered = filterAgendaEventsExcludingCompleted(events, { "primary:a": true });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("b");
  });
});
