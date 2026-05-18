import { describe, expect, it } from "vitest";

import { getChecklistPhaseIconName, isChecklistTabId } from "./checklistPhaseIcons";

describe("checklistPhaseIcons", () => {
  it("maps known checklist tabs to icons", () => {
    expect(getChecklistPhaseIconName("search")).toBe("search");
    expect(getChecklistPhaseIconName("offer")).toBe("file-signature");
    expect(getChecklistPhaseIconName("closing")).toBe("home");
  });

  it("returns null for unknown phase ids", () => {
    expect(getChecklistPhaseIconName("unknown")).toBeNull();
    expect(isChecklistTabId("unknown")).toBe(false);
  });
});
