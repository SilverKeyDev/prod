import { describe, expect, it } from "vitest";

import { dateParseISO, dayjs } from "packages/utils/core/date";

import {
  calculateCalendarDateRange,
  getVisibleDateRange,
  getWeekStart,
  stepFocusedDate,
} from "./date";

describe("calculateCalendarDateRange", () => {
  it("includes past weeks when anchor is in the past (no clamp)", () => {
    const anchor = dayjs("2020-01-15").toDate();
    const { timeMin, timeMax } = calculateCalendarDateRange(anchor);
    const min = dateParseISO(timeMin).toDate();
    const max = dateParseISO(timeMax).toDate();
    expect(min.getFullYear()).toBeLessThanOrEqual(2020);
    expect(max.getTime()).toBeGreaterThan(anchor.getTime());
  });

  it("centers four-week window on the week containing the anchor", () => {
    const wed = dayjs("2026-06-10").toDate();
    const { timeMin, timeMax } = calculateCalendarDateRange(wed);
    const weekStart = getWeekStart(wed);
    const bufferStart = dayjs(weekStart).subtract(7, "day");
    expect(dateParseISO(timeMin).toISOString()).toBe(bufferStart.toISOString());
    const weekEnd = dayjs(weekStart).add(28, "day").hour(23).minute(59).second(59).millisecond(999);
    const expectedMax = weekEnd.add(7, "day").startOf("day");
    expect(dateParseISO(timeMax).valueOf()).toBeGreaterThanOrEqual(expectedMax.valueOf());
  });
});

describe("getVisibleDateRange", () => {
  it("does not clamp week start to today when viewing a past month", () => {
    const inPast = dayjs("2019-03-15").toDate();
    const { start, gridDays } = getVisibleDateRange(inPast, "month");
    expect(start.getFullYear()).toBe(2019);
    expect(gridDays).toBeDefined();
    expect(gridDays!.length).toBe(28);
    expect(gridDays![0].date.getDay()).toBe(0);
  });

  it("marks isCurrentMonth from anchor month not today", () => {
    const feb2027 = dayjs("2027-02-10").toDate();
    const { gridDays } = getVisibleDateRange(feb2027, "month");
    expect(gridDays).toBeDefined();
    const febDays = gridDays!.filter(
      (g) => g.date.getMonth() === 1 && g.date.getFullYear() === 2027
    );
    expect(febDays.every((g) => g.isCurrentMonth)).toBe(true);
  });
});

describe("stepFocusedDate", () => {
  it("steps week by seven days", () => {
    const d = dayjs("2026-04-10").toDate();
    expect(stepFocusedDate(d, "week", 1).getDate()).toBe(17);
  });

  it("steps month and clamps day when target month is shorter", () => {
    const jan31 = dayjs("2026-01-31").toDate();
    const next = stepFocusedDate(jan31, "month", 1);
    expect(next.getMonth()).toBe(1);
    expect(next.getDate()).toBe(28);
  });
});
