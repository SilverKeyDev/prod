import { describe, expect, it } from "vitest";

import { showGoogleMeetToggleForCreate } from "@/features/calendar/utils/createEventModal/googleMeetCreateEligibility";

describe("showGoogleMeetToggleForCreate", () => {
  it("is false when no schedule (unscheduled / bare agenda path)", () => {
    expect(
      showGoogleMeetToggleForCreate({
        mode: "create",
        startDate: "",
        endDate: "",
        isAllDay: false,
      })
    ).toBe(false);
  });

  it("is false for all-day when dates are set", () => {
    expect(
      showGoogleMeetToggleForCreate({
        mode: "create",
        startDate: "2026-06-01",
        endDate: "2026-06-01",
        isAllDay: true,
      })
    ).toBe(false);
  });

  it("is true for create mode with schedule and not all-day", () => {
    expect(
      showGoogleMeetToggleForCreate({
        mode: "create",
        startDate: "2026-06-01",
        endDate: "2026-06-01",
        isAllDay: false,
      })
    ).toBe(true);
  });

  it("is false in edit mode even with schedule", () => {
    expect(
      showGoogleMeetToggleForCreate({
        mode: "edit",
        startDate: "2026-06-01",
        endDate: "2026-06-01",
        isAllDay: false,
      })
    ).toBe(false);
  });
});
