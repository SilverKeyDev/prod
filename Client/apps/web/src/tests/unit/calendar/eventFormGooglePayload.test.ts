import { describe, expect, it } from "vitest";

import {
  buildCreateEventGoogleStartEnd,
  googleAllDayEndExclusiveToInclusiveEndYmd,
  inclusiveRangeToGoogleAllDayDates,
  quantizeHourMinute,
} from "packages/utils/calendar/eventFormGooglePayload";

describe("inclusiveRangeToGoogleAllDayDates", () => {
  it("uses exclusive end date for single day", () => {
    expect(inclusiveRangeToGoogleAllDayDates("2026-04-10", "2026-04-10")).toEqual({
      startDate: "2026-04-10",
      endDateExclusive: "2026-04-11",
    });
  });

  it("uses exclusive end after multi-day range", () => {
    expect(inclusiveRangeToGoogleAllDayDates("2026-04-01", "2026-04-03")).toEqual({
      startDate: "2026-04-01",
      endDateExclusive: "2026-04-04",
    });
  });
});

describe("googleAllDayEndExclusiveToInclusiveEndYmd", () => {
  it("maps Google exclusive end to inclusive last day", () => {
    expect(googleAllDayEndExclusiveToInclusiveEndYmd("2026-04-11")).toBe("2026-04-10");
  });
});

describe("quantizeHourMinute", () => {
  it("snaps down to 15-minute grid", () => {
    expect(quantizeHourMinute(9, 7, 15)).toEqual({ hour: 9, minute: 0 });
    expect(quantizeHourMinute(9, 22, 15)).toEqual({ hour: 9, minute: 15 });
  });
});

describe("buildCreateEventGoogleStartEnd", () => {
  it("returns date-only start/end for all-day", () => {
    const r = buildCreateEventGoogleStartEnd({
      isAllDay: true,
      startDate: "2026-05-01",
      endDate: "2026-05-02",
      startTime: "",
      endTime: "",
    });
    expect(r.start).toEqual({ date: "2026-05-01" });
    expect(r.end).toEqual({ date: "2026-05-03" });
  });

  it("maps single inclusive day to Google exclusive end for all-day", () => {
    const r = buildCreateEventGoogleStartEnd({
      isAllDay: true,
      startDate: "2026-05-01",
      endDate: "2026-05-01",
      startTime: "",
      endTime: "",
    });
    expect(r.start).toEqual({ date: "2026-05-01" });
    expect(r.end).toEqual({ date: "2026-05-02" });
  });

  it("throws when timed and times missing", () => {
    expect(() =>
      buildCreateEventGoogleStartEnd({
        isAllDay: false,
        startDate: "2026-05-01",
        endDate: "2026-05-01",
        startTime: "",
        endTime: "10:00",
      })
    ).toThrow();
  });
});
