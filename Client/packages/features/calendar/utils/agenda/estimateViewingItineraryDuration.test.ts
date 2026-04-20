import { describe, expect, it } from "vitest";

import {
  DEFAULT_VIEWING_MINUTES_PER_PROPERTY,
  estimateViewingItineraryMinutes,
  formatMinutesHuman,
  sumLegDriveMinutes,
} from "./estimateViewingItineraryDuration";

describe("sumLegDriveMinutes", () => {
  it("returns incomplete when legs missing", () => {
    expect(sumLegDriveMinutes(null)).toEqual({ minutes: 0, complete: false });
    expect(sumLegDriveMinutes([])).toEqual({ minutes: 0, complete: false });
  });

  it("returns incomplete when a leg lacks duration", () => {
    expect(sumLegDriveMinutes([{ duration_seconds: 600 }, { duration_seconds: null }])).toEqual({
      minutes: 0,
      complete: false,
    });
  });

  it("sums complete legs in minutes", () => {
    expect(sumLegDriveMinutes([{ duration_seconds: 600 }, { duration_seconds: 900 }])).toEqual({
      minutes: 25,
      complete: true,
    });
  });
});

describe("estimateViewingItineraryMinutes", () => {
  it("returns null for fewer than two addressed stops", () => {
    expect(estimateViewingItineraryMinutes({ stops: [{ address: "A" }] })).toBeNull();
    expect(
      estimateViewingItineraryMinutes({
        stops: [{ address: "" }, { address: "  " }],
      })
    ).toBeNull();
  });

  it("uses on-site only until driving is known", () => {
    const est = estimateViewingItineraryMinutes({
      stops: [{ address: "A" }, { address: "B" }, { address: "C" }],
    });
    expect(est).not.toBeNull();
    expect(est!.stopCount).toBe(3);
    expect(est!.onSiteMinutes).toBe(3 * DEFAULT_VIEWING_MINUTES_PER_PROPERTY);
    expect(est!.drivingKnown).toBe(false);
    expect(est!.totalMinutes).toBe(est!.onSiteMinutes);
  });

  it("adds driving when legs match stop count minus one", () => {
    const est = estimateViewingItineraryMinutes({
      stops: [{ address: "A" }, { address: "B" }],
      legs: [{ duration_seconds: 1200 }],
    });
    expect(est!.drivingKnown).toBe(true);
    expect(est!.drivingMinutes).toBe(20);
    expect(est!.totalMinutes).toBe(2 * DEFAULT_VIEWING_MINUTES_PER_PROPERTY + 20);
  });

  it("ignores driving when leg count does not match", () => {
    const est = estimateViewingItineraryMinutes({
      stops: [{ address: "A" }, { address: "B" }, { address: "C" }],
      legs: [{ duration_seconds: 600 }],
    });
    expect(est!.drivingKnown).toBe(false);
    expect(est!.totalMinutes).toBe(est!.onSiteMinutes);
  });
});

describe("formatMinutesHuman", () => {
  it("formats hours and minutes", () => {
    expect(formatMinutesHuman(45)).toBe("45 min");
    expect(formatMinutesHuman(60)).toBe("1 hr");
    expect(formatMinutesHuman(90)).toBe("1 hr 30 min");
    expect(formatMinutesHuman(150)).toBe("2 hrs 30 min");
  });
});
