import { afterEach, describe, expect, it, vi } from "vitest";

import { dateParseISO, dayjs } from "packages/utils/date";

import { getCalendarDayListHeading } from "./calendarDateKeys";

describe("getCalendarDayListHeading", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses Today's schedule and subtitle when dateKey is today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(dateParseISO("2026-04-20T12:00:00.000Z").valueOf());
    const todayKey = dayjs().format("YYYY-MM-DD");

    const { title, subtitle } = getCalendarDayListHeading(todayKey);
    expect(title).toBe("Today's schedule");
    expect(subtitle).toBe(dayjs(todayKey, "YYYY-MM-DD", true).format("dddd, MMMM D, YYYY"));
  });

  it("uses long date for a non-today key", () => {
    vi.useFakeTimers();
    vi.setSystemTime(dateParseISO("2026-04-20T12:00:00.000Z").valueOf());
    const todayKey = dayjs().format("YYYY-MM-DD");
    const otherKey = dayjs(todayKey, "YYYY-MM-DD", true).add(1, "day").format("YYYY-MM-DD");

    const { title, subtitle } = getCalendarDayListHeading(otherKey);
    expect(title).toBe(dayjs(otherKey, "YYYY-MM-DD", true).format("dddd, MMMM D, YYYY"));
    expect(subtitle).toBeUndefined();
  });
});
