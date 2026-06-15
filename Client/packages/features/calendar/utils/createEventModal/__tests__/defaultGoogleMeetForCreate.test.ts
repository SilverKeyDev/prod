import { describe, expect, it } from "vitest";

import { defaultGoogleMeetForCreate } from "@/features/calendar/utils/createEventModal/defaultGoogleMeetForCreate";

describe("defaultGoogleMeetForCreate", () => {
  it("defaults Meet on for create flow", () => {
    expect(defaultGoogleMeetForCreate()).toBe(true);
  });
});
