import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach,describe, expect, it, vi } from "vitest";

import { useProfilePersonalizationModel } from "./useProfilePersonalizationModel";

const mockUserPreferences = vi.fn();
const mockUserProfile = vi.fn();

vi.mock("packages/hooks/data/auth/useUserData", () => ({
  useUserData: () => mockUserProfile(),
  useUserPreferences: () => mockUserPreferences(),
}));

vi.mock("packages/hooks/data/auth/usePreferencesSubmit", () => ({
  usePreferencesSubmit: () => vi.fn(),
}));

vi.mock("packages/hooks/store/useIsAgent", () => ({
  useIsAgent: () => false,
}));

vi.mock("packages/store", () => ({
  useAuthStore: () => ({ user: { id: "u1" } }),
}));

describe("useProfilePersonalizationModel", () => {
  beforeEach(() => {
    mockUserProfile.mockReturnValue({ userProfile: { name: "Alex", roles: ["buyer"] } });
    mockUserPreferences.mockReturnValue({
      userPreferences: { name: "Alex", why_joining_silverkey: ["buying_house"] },
      preferencesLoading: false,
      preferencesError: null,
      refreshUserPreferences: vi.fn(),
    });
  });

  it("initializes form data from preferences", async () => {
    const { result } = renderHook(() => useProfilePersonalizationModel());

    await waitFor(() => {
      expect(result.current.formData.primary_onboarding_role).toBe("buyer");
    });
  });

  it("filters privacy step when viewing another user profile", () => {
    const { result } = renderHook(() =>
      useProfilePersonalizationModel({
        agentSubject: { userId: "client-1", displayName: "Client" },
      })
    );

    expect(result.current.STEPS.some((s) => s.id === "privacy_data")).toBe(false);
    expect(result.current.effectiveEditMode).toBe(false);
  });
});
