import { afterEach, describe, expect, it } from "vitest";

import {
  abortActiveSearch,
  beginSearchAbortScope,
  endSearchAbortScope,
  getSearchAbortSignal,
  isActiveSearchController,
  resetSearchAbortControllerForTests,
  shouldClearLoadingOnSearchAbort,
} from "./searchAbortController";

describe("searchAbortController", () => {
  afterEach(() => {
    resetSearchAbortControllerForTests();
  });
  it("beginSearchAbortScope aborts the previous controller", () => {
    const first = beginSearchAbortScope();
    let firstAborted = false;
    first.signal.addEventListener("abort", () => {
      firstAborted = true;
    });

    const second = beginSearchAbortScope();

    expect(firstAborted).toBe(true);
    expect(getSearchAbortSignal()).toBe(second.signal);
    expect(isActiveSearchController(second)).toBe(true);
    expect(isActiveSearchController(first)).toBe(false);
  });

  it("shouldClearLoadingOnSearchAbort is false when a newer search superseded the aborted one", () => {
    const first = beginSearchAbortScope();
    beginSearchAbortScope();
    first.signal.aborted; // superseded abort already fired
    expect(shouldClearLoadingOnSearchAbort()).toBe(false);
  });

  it("shouldClearLoadingOnSearchAbort is true after explicit cancel", () => {
    const controller = beginSearchAbortScope();
    abortActiveSearch();
    endSearchAbortScope(controller);
    expect(shouldClearLoadingOnSearchAbort()).toBe(true);
  });
});
