import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PreferencesSubmitResult } from "packages/features/profile/types/submitHandler";

import { handleSubmit, postOnboardingPathForForm } from "./submitHandler";

const { removeItemMock, patchClientSettingsMock } = vi.hoisted(() => ({
  removeItemMock: vi.fn(),
  patchClientSettingsMock: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("packages/utils/storage/platformStorage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("packages/utils/storage/platformStorage")>();
  return {
    ...actual,
    getLocalStorage: () => ({
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: removeItemMock,
      clear: vi.fn(),
    }),
  };
});

vi.mock("packages/features/homeauth/api/clientSettings", () => ({
  clientSettingsApi: {
    get: vi.fn(),
    patch: patchClientSettingsMock,
  },
}));

describe("postOnboardingPathForForm", () => {
  it("routes seller to dashboard", () => {
    expect(
      postOnboardingPathForForm({
        primary_onboarding_role: "seller",
        is_agent: "no",
        why_joining_silverkey: ["buying_house", "selling_house"],
      })
    ).toBe("/dashboard");
  });

  it("routes buyer to search", () => {
    expect(
      postOnboardingPathForForm({
        primary_onboarding_role: "buyer",
        is_agent: "no",
        why_joining_silverkey: ["buying_house"],
      })
    ).toBe("/search");
  });
});

describe("onboarding submission validation bypass", () => {
  beforeEach(() => {
    removeItemMock.mockReset();
    patchClientSettingsMock.mockClear();
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
    const navigate = vi.fn<(path: string) => void>();

    await handleSubmit({
      formData: { primary_onboarding_role: "buyer", is_agent: "no" },
      submitPreferences,
      setLoading,
      setValidationResult,
      setShowValidationWarning,
      validateFunction,
      navigate,
      skipValidation: true,
    });

    expect(navigate).toHaveBeenCalledWith("/search");

    expect(validateFunction).not.toHaveBeenCalled();
    expect(submitPreferences).toHaveBeenCalledTimes(1);
    expect(setShowValidationWarning).not.toHaveBeenCalled();
    expect(setValidationResult).not.toHaveBeenCalled();
    expect(setLoading).toHaveBeenNthCalledWith(1, true);
    expect(setLoading).toHaveBeenLastCalledWith(false);
    expect(removeItemMock).toHaveBeenCalledWith("onboardingDraft");
    expect(patchClientSettingsMock).toHaveBeenCalledWith({ onboarding_draft: null });
  });
});
