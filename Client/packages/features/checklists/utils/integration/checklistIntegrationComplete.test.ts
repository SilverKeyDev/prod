import { describe, expect, it, vi } from "vitest";

import {
  completeChecklistStepAfterIntegrationSubmit,
  runChecklistIntegrationComplete,
} from "./checklistIntegrationComplete";

describe("completeChecklistStepAfterIntegrationSubmit", () => {
  it("calls commitToggleItem when the step may be marked complete", async () => {
    const commitToggleItem = vi.fn().mockResolvedValue(undefined);
    const notifyBlocked = vi.fn();
    const notifyError = vi.fn();

    await completeChecklistStepAfterIntegrationSubmit({
      canMarkChecked: () => true,
      commitToggleItem,
      itemId: 42,
      notifyBlocked,
      notifyError,
    });

    expect(commitToggleItem).toHaveBeenCalledWith(42);
    expect(notifyBlocked).not.toHaveBeenCalled();
    expect(notifyError).not.toHaveBeenCalled();
  });

  it("uses latest canMarkChecked from a getter (ref pattern)", async () => {
    const commitToggleItem = vi.fn();
    let eligible = false;

    await completeChecklistStepAfterIntegrationSubmit({
      canMarkChecked: () => eligible,
      commitToggleItem,
      itemId: 1,
      notifyBlocked: vi.fn(),
      notifyError: vi.fn(),
    });
    expect(commitToggleItem).not.toHaveBeenCalled();

    eligible = true;
    await completeChecklistStepAfterIntegrationSubmit({
      canMarkChecked: () => eligible,
      commitToggleItem,
      itemId: 1,
      notifyBlocked: vi.fn(),
      notifyError: vi.fn(),
    });
    expect(commitToggleItem).toHaveBeenCalledWith(1);
  });

  it("notifies blocked without PUT when canMarkChecked is false", async () => {
    const commitToggleItem = vi.fn();
    const notifyBlocked = vi.fn();

    await completeChecklistStepAfterIntegrationSubmit({
      canMarkChecked: () => false,
      commitToggleItem,
      itemId: 9,
      notifyBlocked,
      notifyError: vi.fn(),
    });

    expect(notifyBlocked).toHaveBeenCalledTimes(1);
    expect(commitToggleItem).not.toHaveBeenCalled();
  });

  it("notifies error when commitToggleItem rejects", async () => {
    const commitToggleItem = vi.fn().mockRejectedValue(new Error("network"));
    const notifyError = vi.fn();

    await completeChecklistStepAfterIntegrationSubmit({
      canMarkChecked: () => true,
      commitToggleItem,
      itemId: 3,
      notifyBlocked: vi.fn(),
      notifyError,
    });

    expect(commitToggleItem).toHaveBeenCalledWith(3);
    expect(notifyError).toHaveBeenCalledTimes(1);
  });
});

describe("runChecklistIntegrationComplete", () => {
  it("invokes completeChecklistStepAfterIntegrationSubmit asynchronously", async () => {
    const commitToggleItem = vi.fn().mockResolvedValue(undefined);

    runChecklistIntegrationComplete({
      canMarkChecked: () => true,
      commitToggleItem,
      itemId: 7,
      notifyBlocked: vi.fn(),
      notifyError: vi.fn(),
    });

    await vi.waitFor(() => {
      expect(commitToggleItem).toHaveBeenCalledWith(7);
    });
  });
});
