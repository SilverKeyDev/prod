import { describe, expect, it } from "vitest";

import {
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
  });

  it("exposes data attribute for CSS ::before olive stripe", () => {
    expect(sidebarInsetListRowSelectedProps(true)).toEqual({
      [SK_INSET_ROW_SELECTED_DATA_ATTR]: "true",
    });
    expect(sidebarInsetListRowSelectedProps(false)).toEqual({});
  });
});
