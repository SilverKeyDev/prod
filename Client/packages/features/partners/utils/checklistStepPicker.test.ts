import { describe, expect, it } from "vitest";

import {
  resolveChecklistRoles,
  sectionsForChecklistRole,
  stepsForSection,
} from "./checklistStepPicker";

describe("checklistStepPicker utils", () => {
  it("filters checklist roles from target roles", () => {
    expect(resolveChecklistRoles(["buyer", "agent", "seller"])).toEqual(["buyer", "seller"]);
    expect(resolveChecklistRoles(["agent"])).toEqual([]);
  });

  it("returns buyer sections in journey order", () => {
    expect(sectionsForChecklistRole("buyer")[0]).toBe("search");
    expect(sectionsForChecklistRole("buyer").at(-1)).toBe("closing");
    expect(sectionsForChecklistRole("seller")).toEqual([]);
  });

  it("filters steps by section", () => {
    const steps = [
      { step_id: "search:1", section: "search", item_id: 1, label: "Budget" },
      { step_id: "closing:13", section: "closing", item_id: 13, label: "Concierge" },
    ];
    expect(stepsForSection(steps, "closing")).toEqual([steps[1]]);
  });
});
