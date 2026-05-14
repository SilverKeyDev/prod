import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAutoSavePreferences } from "./useAutoSavePreferences";

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({ t: (k: string) => k }),
}));

vi.mock("packages/hooks/ui", () => ({
  showErrorToast: vi.fn(),
  showSuccessToast: vi.fn(),
}));

vi.mock("packages/logger", () => ({
  log: { info: vi.fn(), error: vi.fn() },
  LOG_CATEGORIES: { PROFILE_PREFERENCES: "p", ERRORS: "e" },
}));

const createOrUpdate = vi.fn();

vi.mock("@/features/homeauth/api/preferences", () => ({
  preferencesApi: { createOrUpdate: (...args: unknown[]) => createOrUpdate(...args) },
}));

describe("useAutoSavePreferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    createOrUpdate.mockResolvedValue({ success: true, preferences: {} });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("flushSave clears pending debounce and persists before debounce fires", async () => {
    const refreshUserPreferences = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutoSavePreferences({
        refreshUserPreferences,
        debounceMs: 400,
        showSuccessToastOnSave: false,
      })
    );

    act(() => {
      result.current.autoSave({ budget_min: 100 } as never);
    });

    expect(createOrUpdate).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.flushSave({ budget_min: 200 } as never);
    });

    expect(createOrUpdate).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(createOrUpdate).toHaveBeenCalledTimes(1);
  });
});
