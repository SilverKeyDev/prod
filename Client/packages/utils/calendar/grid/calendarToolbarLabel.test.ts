import { describe, expect, it } from "vitest";

import { dayjs } from "packages/utils/date";

import { formatCalendarToolbarLabel, formatToolbarDateRange } from "./calendarToolbarLabel";

describe("formatToolbarDateRange", () => {
  it("shows month and day for both ends in the same year", () => {
    const a = dayjs().year(2026).month(3).date(6).startOf("day");
    const b = dayjs().year(2026).month(3).date(12).startOf("day");
    expect(formatToolbarDateRange(a, b)).toBe("Apr 6 – Apr 12, 2026");
  });

  it("includes both months across a month boundary", () => {
    const a = dayjs().year(2026).month(3).date(27).startOf("day");
    const b = dayjs().year(2026).month(4).date(10).startOf("day");
    expect(formatToolbarDateRange(a, b)).toBe("Apr 27 – May 10, 2026");
  });
});

describe("formatCalendarToolbarLabel", () => {
  it("shows full visible 28-day range in month view (start month/day – end month/day, year)", () => {
    const apr152026 = dayjs().year(2026).month(3).date(15).toDate();
    const label = formatCalendarToolbarLabel(apr152026, "month");
    expect(label).toBe("Apr 12 – May 9, 2026");
  });

  it("shows full week range with month and day for start and end", () => {
    const apr152026 = dayjs().year(2026).month(3).date(15).toDate();
    const label = formatCalendarToolbarLabel(apr152026, "week");
    expect(label).toBe("Apr 12 – Apr 18, 2026");
  });
});
