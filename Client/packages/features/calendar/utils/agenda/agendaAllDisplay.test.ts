import { describe, expect, it } from "vitest";

import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";

import { applyAgendaAllDisplayMode } from "./agendaAllDisplay";
import { agendaEventCompletionKey } from "./agendaEventCompletionKey";

function futureEvent(id: string): ExtendedGoogleEvent {
  const start = new Date();
  start.setDate(start.getDate() + 2);
  return {
    id,
    calendarId: "primary",
    summary: `Event ${id}`,
    start: { dateTime: start.toISOString() },
    end: { dateTime: new Date(start.getTime() + 3600000).toISOString() },
  } as ExtendedGoogleEvent;
}

describe("applyAgendaAllDisplayMode future_only", () => {
  it("excludes agenda-marked-done events in future_only mode", () => {
    const event = futureEvent("e1");
    const key = agendaEventCompletionKey(event);
    const items = [{ kind: "event" as const, event }];
    const chronological = applyAgendaAllDisplayMode(items, "chronological", {
      completedEventKeys: { [key]: true },
    });
    expect(chronological).toHaveLength(1);

    const futureOnly = applyAgendaAllDisplayMode(items, "future_only", {
      completedEventKeys: { [key]: true },
    });
    expect(futureOnly).toHaveLength(0);
  });
});
