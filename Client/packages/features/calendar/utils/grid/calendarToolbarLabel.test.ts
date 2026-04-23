import { describe, expect, it } from "vitest";

import { formatCalendarToolbarLabel, formatToolbarDateRange } from "./calendarToolbarLabel";

describe("formatToolbarDateRange", () => {
  it("shows month and day for both ends in the same year", () => {
    expect(formatToolbarDateRange(new Date(2026, 3, 6), new Date(2026, 3, 12))).toBe(
      "Apr 6 – Apr 12, 2026"
    );
  });

  it("includes both months across a month boundary", () => {
    expect(formatToolbarDateRange(new Date(2026, 3, 27), new Date(2026, 4, 10))).toBe(
      "Apr 27 – May 10, 2026"
    );
  });
});

describe("formatCalendarToolbarLabel", () => {
  /** Local calendar day to avoid TZ drift from UTC strings. */
  const apr152026 = new Date(2026, 3, 15);

  it("shows full visible 28-day range in month view (start month/day – end month/day, year)", () => {
    const label = formatCalendarToolbarLabel(apr152026, "month");
    // Grid starts Sunday of week containing anchor; Apr 15 2026 is Wed → week starts Apr 12.
    // 28 days: Apr 12 through May 9.
    expect(label).toBe("Apr 12 – May 9, 2026");
  });

  it("shows full week range with month and day for start and end", () => {
    const label = formatCalendarToolbarLabel(apr152026, "week");
    expect(label).toBe("Apr 12 – Apr 18, 2026");
  });
});
