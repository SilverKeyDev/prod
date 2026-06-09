import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PreferencesFormActionsRef } from "packages/features/profile/components/settings/inputs/preferencesFormContentTypes";

import { useEmbeddedPreferencesForm } from "./useEmbeddedPreferencesForm";

const mockUserData = vi.fn();
const mockUserPreferences = vi.fn();
const mockAutoSave = vi.fn();
const mockUpdateFormDataWithAutoSave = vi.fn();
const mockGoogleMaps = vi.fn();

vi.mock("packages/hooks/data/auth/useUserData", () => ({
  useUserData: () => mockUserData(),
  useUserPreferences: () => mockUserPreferences(),
}));

vi.mock("packages/hooks/data/auth/useAutoSavePreferences", () => ({
  useAutoSavePreferences: () => ({
    saveStatus: "idle" as const,
    isSaving: false,
    autoSave: mockAutoSave,
    cancelPendingSave: vi.fn(),
    flushSave: vi.fn(),
    updateFormData: mockUpdateFormDataWithAutoSave,
  }),
}));

vi.mock("packages/hooks/data", () => ({
  useGoogleMaps: () => mockGoogleMaps(),
}));

describe("useEmbeddedPreferencesForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserData.mockReturnValue({ userProfile: { name: "Alex" } });
    mockGoogleMaps.mockReturnValue({ isLoaded: false });
    mockUserPreferences.mockReturnValue({
      userPreferences: {
        preferences_version: "v1",
        home_budget_min: 300000,
      },
      refreshUserPreferences: vi.fn(),
    });
  });

  it("hydrates form data from user preferences", async () => {
    const { result } = renderHook(() => useEmbeddedPreferencesForm());

    await waitFor(() => {
      expect(result.current.formData.home_budget_min).toBe(300000);
    });
  });

  it("reloads preferences when preferences subject changes", async () => {
    const { result, rerender } = renderHook(
      ({ subjectId }: { subjectId: string | null }) =>
        useEmbeddedPreferencesForm({ preferencesSubjectUserId: subjectId }),
      { initialProps: { subjectId: null as string | null } }
    );

    await waitFor(() => {
      expect(result.current.formData.home_budget_min).toBe(300000);
    });

    mockUserPreferences.mockReturnValue({
      userPreferences: { preferences_version: "v2", home_budget_min: 500000 },
      refreshUserPreferences: vi.fn(),
    });

    rerender({ subjectId: "client-1" });

    await waitFor(() => {
      expect(result.current.formData.home_budget_min).toBe(500000);
      expect(result.current.formData.preferences_version).toBe("v2");
    });
  });

  it("exposes replaceFormData via preferencesFormActionsRef", async () => {
    const actionsRef = { current: null as PreferencesFormActionsRef | null };

    const { result } = renderHook(() =>
      useEmbeddedPreferencesForm({
        preferencesFormActionsRef: actionsRef,
      })
    );

    await waitFor(() => {
      expect(actionsRef.current?.replaceFormData).toBeTypeOf("function");
    });

    act(() => {
      actionsRef.current?.replaceFormData({ home_budget_min: 999000 });
    });

    expect(result.current.formData.home_budget_min).toBe(999000);
  });
});
