import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleSubmit, type PreferencesSubmitResult } from "packages/features/profile";

const removeItemMock = vi.fn();

vi.mock("packages/utils/storage/platformStorage", () => ({
  getLocalStorage: () => ({
    removeItem: removeItemMock,
  }),
}));

describe("onboarding submission validation bypass", () => {
  beforeEach(() => {
    removeItemMock.mockReset();
  });

  it("submits even when validation would fail if skipValidation is true", async () => {
    const submitPreferences = vi
      .fn<() => Promise<PreferencesSubmitResult>>()
      .mockResolvedValue({ success: true });
    const setLoading = vi.fn<(value: boolean) => void>();
    const setValidationResult =
      vi.fn<(value: { missingFields: string[]; errors: string[] }) => void>();
    const setShowValidationWarning = vi.fn<(value: boolean) => void>();
    const validateFunction = vi.fn(() => ({
      isValid: false,
      missingFields: ["name"],
      errors: ["Name is required"],
    }));

    await handleSubmit({
      formData: {},
      submitPreferences,
      setLoading,
      setValidationResult,
      setShowValidationWarning,
      validateFunction,
      skipValidation: true,
    });

    expect(validateFunction).not.toHaveBeenCalled();
    expect(submitPreferences).toHaveBeenCalledTimes(1);
    expect(setShowValidationWarning).not.toHaveBeenCalled();
    expect(setValidationResult).not.toHaveBeenCalled();
    expect(setLoading).toHaveBeenNthCalledWith(1, true);
    expect(setLoading).toHaveBeenLastCalledWith(false);
    expect(removeItemMock).toHaveBeenCalledWith("onboardingDraft");
  });
});
