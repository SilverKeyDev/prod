import { describe, expect, it, vi } from "vitest";

import { submitAfterTopSuggestionIfNeeded } from "./autocompleteSubmit";

describe("submitAfterTopSuggestionIfNeeded", () => {
  it("only submits when a suggestion was already selected", async () => {
    const selectSuggestion = vi.fn();
    const submit = vi.fn();
    await submitAfterTopSuggestionIfNeeded({
      suggestions: [{ id: "a" }],
      hasSelectedSuggestion: true,
      selectSuggestion,
      submit,
    });
    expect(selectSuggestion).not.toHaveBeenCalled();
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("submits without selecting when there are no suggestions", async () => {
    const selectSuggestion = vi.fn();
    const submit = vi.fn();
    await submitAfterTopSuggestionIfNeeded({
      suggestions: [],
      hasSelectedSuggestion: false,
      selectSuggestion,
      submit,
    });
    expect(selectSuggestion).not.toHaveBeenCalled();
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("selects the first suggestion then submits when none was selected", async () => {
    const selectSuggestion = vi.fn();
    const submit = vi.fn();
    await submitAfterTopSuggestionIfNeeded({
      suggestions: [{ id: "first" }, { id: "second" }],
      hasSelectedSuggestion: false,
      selectSuggestion,
      submit,
    });
    expect(selectSuggestion).toHaveBeenCalledTimes(1);
    expect(selectSuggestion).toHaveBeenCalledWith({ id: "first" });
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("does not submit when selectSuggestion returns true (skip viewport search)", async () => {
    const selectSuggestion = vi.fn().mockResolvedValue(true);
    const submit = vi.fn();
    await submitAfterTopSuggestionIfNeeded({
      suggestions: [{ id: "first" }],
      hasSelectedSuggestion: false,
      selectSuggestion,
      submit,
    });
    expect(selectSuggestion).toHaveBeenCalledTimes(1);
    expect(submit).not.toHaveBeenCalled();
  });
});
