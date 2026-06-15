import { describe, expect, it } from "vitest";

import {
  getInsetNavItemClasses,
  sidebarInsetListRowClass,
  sidebarInsetListRowSelectedProps,
  SK_INSET_ROW_SELECTED_CLASS,
  SK_INSET_ROW_SELECTED_DATA_ATTR,
} from "./sidebarTheme";

describe("sidebarInsetListRowClass", () => {
  it("uses olive selection tokens, not warm/destructive border utilities", () => {
    const selected = sidebarInsetListRowClass(true);
    expect(selected).toContain(SK_INSET_ROW_SELECTED_CLASS);
    expect(selected).toContain("bg-olive/10");
    expect(selected).toContain("hover:bg-olive/15");
    expect(selected).not.toMatch(
      /border-l-(beige|gold|accent|destructive|rose|primary|border-card|olive)/
    );
    expect(selected).not.toMatch(/bg-(beige|accent|destructive|rose|card)(\/|$)/);
    expect(selected).not.toContain("hover:bg-primary-muted/70");
  });

  it("omits selection chrome when not selected", () => {
    const unselected = sidebarInsetListRowClass(false);
    expect(unselected).not.toContain(SK_INSET_ROW_SELECTED_CLASS);
    expect(unselected).toContain("hover:bg-neutral-100");
    expect(unselected).not.toContain("hover:bg-primary-muted");
  });

  it("exposes data attribute for CSS ::before olive stripe", () => {
    expect(sidebarInsetListRowSelectedProps(true)).toEqual({
      [SK_INSET_ROW_SELECTED_DATA_ATTR]: "true",
    });
    expect(sidebarInsetListRowSelectedProps(false)).toEqual({});
  });
});

describe("getInsetNavItemClasses", () => {
  it("uses neutral selected fill, not primary-muted olive", () => {
    const active = getInsetNavItemClasses({ active: true });
    expect(active).toContain("!bg-neutral-100");
    expect(active).toContain("hover:!bg-neutral-200");
    expect(active).not.toContain("primary-muted");
  });

  it("keeps inactive hover on surface without olive or gray wash", () => {
    const inactive = getInsetNavItemClasses({ active: false });
    expect(inactive).toContain("hover:!bg-background-surface");
    expect(inactive).not.toContain("primary-muted");
    expect(inactive).not.toContain("hover:!bg-neutral-100");
  });
});
