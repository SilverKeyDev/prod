import { describe, expect, it } from "vitest";

import {
  isEventMeetLinkPending,
  isVirtualMeetingEnabled,
  resolveEventMeetLink,
} from "./eventMeetLink";

const timedStart = { dateTime: "2026-04-10T15:00:00-05:00", timeZone: "America/Chicago" };
const timedEnd = { dateTime: "2026-04-10T16:00:00-05:00", timeZone: "America/Chicago" };

function baseEvent(overrides: Record<string, unknown> = {}) {
  return {
    summary: "Test",
    start: timedStart,
    end: timedEnd,
    ...overrides,
  };
}

describe("isVirtualMeetingEnabled", () => {
  it("returns true when silverKeyVirtualMeetingEnabled is true", () => {
    expect(isVirtualMeetingEnabled(baseEvent({ silverKeyVirtualMeetingEnabled: true }))).toBe(true);
  });

  it("returns false when silverKeyVirtualMeetingEnabled is false", () => {
    expect(
      isVirtualMeetingEnabled(
        baseEvent({
          silverKeyVirtualMeetingEnabled: false,
          hangoutLink: "https://meet.google.com/abc-defg-hij",
        })
      )
    ).toBe(false);
  });

  it("falls back to hangoutLink when overlay is omitted", () => {
    expect(
      isVirtualMeetingEnabled(baseEvent({ hangoutLink: "https://meet.google.com/abc-defg-hij" }))
    ).toBe(true);
  });
});

describe("resolveEventMeetLink", () => {
  it("returns hangoutLink when virtual meeting is enabled", () => {
    expect(
      resolveEventMeetLink(
        baseEvent({
          silverKeyVirtualMeetingEnabled: true,
          hangoutLink: "https://meet.google.com/abc-defg-hij",
        })
      )
    ).toBe("https://meet.google.com/abc-defg-hij");
  });

  it("returns null when virtual meeting is disabled", () => {
    expect(
      resolveEventMeetLink(
        baseEvent({
          silverKeyVirtualMeetingEnabled: false,
          hangoutLink: "https://meet.google.com/abc-defg-hij",
        })
      )
    ).toBeNull();
  });
});

describe("isEventMeetLinkPending", () => {
  it("returns true when enabled and conference provisioning is pending", () => {
    expect(
      isEventMeetLinkPending(
        baseEvent({
          silverKeyVirtualMeetingEnabled: true,
          conferenceData: {
            createRequest: { status: { statusCode: "pending" } },
          },
        })
      )
    ).toBe(true);
  });
});
