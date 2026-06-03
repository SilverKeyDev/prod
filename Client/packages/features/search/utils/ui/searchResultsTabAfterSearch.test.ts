import { describe, expect, it, vi } from "vitest";

import {
  applyFocusResultsTabAfterSearchComplete,
  shouldFocusResultsTabAfterSearch,
} from "./searchResultsTabAfterSearch";

describe("searchResultsTabAfterSearch", () => {
  describe("shouldFocusResultsTabAfterSearch", () => {
    it("returns true only on the saved tab", () => {
      expect(shouldFocusResultsTabAfterSearch("saved")).toBe(true);
      expect(shouldFocusResultsTabAfterSearch("results")).toBe(false);
    });
  });

  describe("applyFocusResultsTabAfterSearchComplete", () => {
    it("switches to results and resets page when on saved", () => {
      const setActiveTab = vi.fn();
      const setCurrentPage = vi.fn();

      const applied = applyFocusResultsTabAfterSearchComplete({
        activeTab: "saved",
        setActiveTab,
        setCurrentPage,
      });

      expect(applied).toBe(true);
      expect(setActiveTab).toHaveBeenCalledWith("results");
      expect(setCurrentPage).toHaveBeenCalledWith(0);
    });

    it("does nothing when already on results", () => {
      const setActiveTab = vi.fn();
      const setCurrentPage = vi.fn();

      const applied = applyFocusResultsTabAfterSearchComplete({
        activeTab: "results",
        setActiveTab,
        setCurrentPage,
      });

      expect(applied).toBe(false);
      expect(setActiveTab).not.toHaveBeenCalled();
      expect(setCurrentPage).not.toHaveBeenCalled();
    });
  });
});
