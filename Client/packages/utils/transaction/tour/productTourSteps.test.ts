import { describe, expect, it } from "vitest";

import { getSearchProductTourSteps } from "./productTourSteps";
import { TOUR_TARGETS_DESKTOP, TOUR_TARGETS_MOBILE } from "./tourTargets";

describe("getSearchProductTourSteps", () => {
  it("returns a single preferences step on desktop (display merged into preferences)", () => {
    const steps = getSearchProductTourSteps("desktop");
    expect(steps).toHaveLength(1);
    expect(steps[0]?.stepId).toBe("search.desktop.preferences");
    expect(steps[0]?.element).toBe(`#${TOUR_TARGETS_DESKTOP.preferencesControl}`);
    expect(steps[0]?.popover.description).toMatch(/ordered and shown on the map/i);
  });

  it("returns a single filters step on mobile (display merged into filters)", () => {
    const steps = getSearchProductTourSteps("mobile");
    expect(steps).toHaveLength(1);
    expect(steps[0]?.stepId).toBe("search.mobile.preferences");
    expect(steps[0]?.element).toBe(`#${TOUR_TARGETS_MOBILE.preferencesControl}`);
    expect(steps[0]?.popover.description).toMatch(/result ordering/i);
  });

  it("does not reference removed display tour targets", () => {
    const steps = [...getSearchProductTourSteps("desktop"), ...getSearchProductTourSteps("mobile")];
    for (const step of steps) {
      expect(step.element).not.toContain("display");
      expect(step.stepId).not.toContain(".display");
    }
  });
});
