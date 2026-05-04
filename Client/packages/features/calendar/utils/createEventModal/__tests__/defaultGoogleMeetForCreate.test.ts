import { describe, expect, it } from "vitest";

import { defaultGoogleMeetForCreate } from "@/features/calendar/utils/createEventModal/defaultGoogleMeetForCreate";

describe("defaultGoogleMeetForCreate", () => {
  it("is false for property viewings kind", () => {
    expect(
      defaultGoogleMeetForCreate({
        eventKindId: "property_viewings",
        eventTitle: "Anything",
      })
    ).toBe(false);
  });

  it("is false when title suggests property viewing", () => {
    expect(
      defaultGoogleMeetForCreate({
        eventKindId: "meeting",
        eventTitle: "Sunday showing",
      })
    ).toBe(false);
  });

  it("is true for typical meeting kind", () => {
    expect(
      defaultGoogleMeetForCreate({
        eventKindId: "meeting",
        eventTitle: "Lender call",
      })
    ).toBe(true);
  });
});
