import { describe, expect, it } from "vitest";

import {
  getChecklistItemBorderVariant,
  getChecklistItemLabelClass,
} from "./checklistCheckboxPresentation";

const LAYOUT_CLASS_PATTERN =
  /\b(p[xytblr]?-\d|m[xytblr]?-\d|border(?:-\w+)?-\d|w-|min-w-|max-w-|flex-|grid-cols-|gap-)/;

function layoutAffectingClasses(className: string): string[] {
  return className.split(/\s+/).filter((token) => LAYOUT_CLASS_PATTERN.test(token));
}

describe("getChecklistItemBorderVariant", () => {
  it("returns dotted or light only, never a no-border variant", () => {
    expect(getChecklistItemBorderVariant(false)).toBe("light");
    expect(getChecklistItemBorderVariant(true)).toBe("dotted");
    expect(getChecklistItemBorderVariant(false)).not.toBe("none");
    expect(getChecklistItemBorderVariant(true)).not.toBe("none");
  });
});

describe("getChecklistItemLabelClass", () => {
  it("keeps layout-affecting classes identical for checked vs unchecked", () => {
    const unchecked = getChecklistItemLabelClass({ checked: false });
    const checked = getChecklistItemLabelClass({ checked: true });
    expect(layoutAffectingClasses(unchecked)).toEqual(layoutAffectingClasses(checked));
  });

  it("applies completed color on label only when checked", () => {
    expect(getChecklistItemLabelClass({ checked: true })).toContain("text-text-secondary");
    expect(getChecklistItemLabelClass({ checked: false })).not.toContain("text-text-secondary");
  });

  it("applies opacity on label for disabled and roadmap-soft-blocked states", () => {
    expect(getChecklistItemLabelClass({ disabled: true })).toContain("opacity-75");
    expect(getChecklistItemLabelClass({ roadmapSoftBlocked: true })).toContain("opacity-70");
  });
});
