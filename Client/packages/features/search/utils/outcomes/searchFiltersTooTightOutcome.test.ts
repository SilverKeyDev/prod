import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SearchByPolygonResponse } from "packages/types/domain/api";

import {
  handlePolygonSearchFiltersTooTightOutcome,
  isPolygonSearchFiltersTooTight,
  warnSearchFiltersTooTight,
} from "./searchFiltersTooTightOutcome";

const showWarningToast = vi.fn();
const requestOpenSearchPreferencesPanel = vi.fn();

vi.mock("packages/hooks/ui/toast/useToast", () => ({
  showWarningToast: (...args: unknown[]) => showWarningToast(...args),
}));

vi.mock("packages/features/search/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("packages/features/search/store")>();
  return {
    ...actual,
    requestOpenSearchPreferencesPanel: (...args: unknown[]) =>
      requestOpenSearchPreferencesPanel(...args),
  };
});

describe("searchFiltersTooTightOutcome", () => {
  beforeEach(() => {
    showWarningToast.mockClear();
    requestOpenSearchPreferencesPanel.mockClear();
  });

  it("detects filters-too-tight when meta flag is set and results are empty", () => {
    const response = {
      success: true,
      properties: [],
      meta: { filtersTooTight: true, preFilterCount: 11, postFilterCount: 0 },
    } as SearchByPolygonResponse;

    expect(isPolygonSearchFiltersTooTight(response)).toBe(true);
  });

  it("does not flag when results are present", () => {
    const response = {
      success: true,
      properties: [{ id: "1" }],
      meta: { filtersTooTight: true },
    } as SearchByPolygonResponse;

    expect(isPolygonSearchFiltersTooTight(response)).toBe(false);
  });

  it("does not flag when meta.filtersTooTight is absent", () => {
    const response = {
      success: true,
      properties: [],
      meta: { cached: false },
    } as SearchByPolygonResponse;

    expect(isPolygonSearchFiltersTooTight(response)).toBe(false);
  });

  it("shows toast and requests preferences panel open", () => {
    warnSearchFiltersTooTight();

    expect(showWarningToast).toHaveBeenCalledWith(
      "Your filters are too tight. Try relaxing them to see more homes."
    );
    expect(requestOpenSearchPreferencesPanel).toHaveBeenCalledOnce();
  });

  it("handlePolygonSearchFiltersTooTightOutcome returns true when handled", () => {
    const response = {
      success: true,
      properties: [],
      meta: { filtersTooTight: true },
    } as SearchByPolygonResponse;

    expect(handlePolygonSearchFiltersTooTightOutcome(response)).toBe(true);
    expect(showWarningToast).toHaveBeenCalledOnce();
    expect(requestOpenSearchPreferencesPanel).toHaveBeenCalledOnce();
  });

  it("handlePolygonSearchFiltersTooTightOutcome returns false when not tight", () => {
    const response = {
      success: true,
      properties: [],
      meta: {},
    } as SearchByPolygonResponse;

    expect(handlePolygonSearchFiltersTooTightOutcome(response)).toBe(false);
    expect(showWarningToast).not.toHaveBeenCalled();
  });
});
