import { describe, expect, it } from "vitest";

import { localYOffsetToRoundedMinutesFromMidnight } from "./calendarQuickCreateSnap";

describe("localYOffsetToRoundedMinutesFromMidnight", () => {
  const hourRowHeight = 48;
  const total = 24 * hourRowHeight;
  const step = 15;

  it("clamps above-grid Y to midnight (0)", () => {
    expect(localYOffsetToRoundedMinutesFromMidnight(-200, hourRowHeight, total, step)).toBe(0);
  });

  it("clamps below-grid Y to last15-minute start slot", () => {
    expect(localYOffsetToRoundedMinutesFromMidnight(total + 9999, hourRowHeight, total, step)).toBe(
      24 * 60 - 15
    );
  });

  it("at 7.5 minutes from midnight rounds to 15 (nearest step)", () => {
    const y = (7.5 / (24 * 60)) * total;
    expect(localYOffsetToRoundedMinutesFromMidnight(y, hourRowHeight, total, step)).toBe(15);
  });
});
