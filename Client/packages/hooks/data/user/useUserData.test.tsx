import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { preferencesApi, userApi } from "packages/api";

import { useUserData, useUserPreferences } from "./useUserData";
import {
  initialPreferencesForUpdate,
  partialUserFromApi,
  updatedPreferencesAfterMutation,
  userPreferencesForClient,
  userPreferencesFull,
  userProfileForRefresh,
  userProfileFull,
} from "./useUserData.test.fixtures";
import { createUserDataTestQueryContext, mockAuthSelectors } from "./useUserData.test.helpers";

// Mock dependencies
vi.mock("packages/store");
vi.mock("packages/api");
vi.mock("packages/utils/media/prefetchRemoteImage", () => ({
  prefetchRemoteImage: vi.fn(),
}));

describe("useUserData", () => {
  const queryCtx = createUserDataTestQueryContext();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthSelectors({ isAuthenticated: true, authReady: true });
  });

  afterEach(() => {
    queryCtx.getQueryClient()?.clear();
  });

  describe("loading user profile", () => {
    it("should fetch user profile successfully", async () => {
      vi.mocked(userApi.getProfile).mockResolvedValue({
        success: true,
        user: userProfileFull,
      });

      const { result } = renderHook(() => useUserData(), {
        wrapper: queryCtx.createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.userProfileLoading).toBe(false);
      });

      expect(result.current.userProfile).toEqual(userProfileFull);
      expect(result.current.userProfileError).toBe(null);
    });

    it("should not fetch when not authenticated", async () => {
      mockAuthSelectors({ isAuthenticated: false, authReady: true });

      const { result } = renderHook(() => useUserData(), {
        wrapper: queryCtx.createWrapper(),
      });

      expect(result.current.userProfile).toBe(null);
      expect(userApi.getProfile).not.toHaveBeenCalled();
    });

    it("should not fetch when auth not ready", async () => {
      mockAuthSelectors({ isAuthenticated: true, authReady: false });

      const { result } = renderHook(() => useUserData(), {
        wrapper: queryCtx.createWrapper(),
      });

      expect(result.current.userProfile).toBe(null);
      expect(userApi.getProfile).not.toHaveBeenCalled();
    });

    it("should handle API error gracefully", async () => {
      vi.mocked(userApi.getProfile).mockResolvedValue({
        success: false,
        error: "Network error",
      });

      const { result } = renderHook(() => useUserData(), {
        wrapper: queryCtx.createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.userProfileError).toBeTruthy();
      });

      expect(result.current.userProfile).toBe(null);
      expect(result.current.userProfileError).toContain("Network error");
    });

    it("should normalize User to UserProfile with defaults", async () => {
      vi.mocked(userApi.getProfile).mockResolvedValue({
        success: true,
        user: partialUserFromApi,
      });

      const { result } = renderHook(() => useUserData(), {
        wrapper: queryCtx.createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.userProfileLoading).toBe(false);
      });

      expect(result.current.userProfile).toEqual({
        ...partialUserFromApi,
        has_subscription: false,
        subscription: null,
        has_preferences: false,
        is_agent: false,
        is_closing_mode: false,
        client_ids: undefined,
        roles: [],
        brokerage_org_ids: null,
      });
    });

    it("should refresh user profile on demand", async () => {
      vi.mocked(userApi.getProfile).mockResolvedValue({
        success: true,
        user: userProfileForRefresh,
      });

      const { result } = renderHook(() => useUserData(), {
        wrapper: queryCtx.createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.userProfileLoading).toBe(false);
      });

      const updatedUser = { ...userProfileForRefresh, name: "Updated User" };
      vi.mocked(userApi.getProfile).mockResolvedValue({
        success: true,
        user: updatedUser,
      });

      await result.current.refreshUserProfile();

      await waitFor(() => {
        expect(result.current.userProfile?.name).toBe("Updated User");
      });
    });
  });
});

describe("useUserPreferences", () => {
  const queryCtx = createUserDataTestQueryContext();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthSelectors({ isAuthenticated: true, authReady: true });
  });

  afterEach(() => {
    queryCtx.getQueryClient()?.clear();
  });

  describe("loading preferences", () => {
    it("should fetch user preferences successfully", async () => {
      vi.mocked(preferencesApi.get).mockResolvedValue({
        success: true,
        preferences: userPreferencesFull,
      });

      const { result } = renderHook(() => useUserPreferences(), {
        wrapper: queryCtx.createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.preferencesLoading).toBe(false);
      });

      expect(result.current.userPreferences).toEqual(userPreferencesFull);
      expect(result.current.preferencesError).toBe(null);
    });

    it("should fetch preferences for specific user when clientId provided", async () => {
      vi.mocked(preferencesApi.getByUserId).mockResolvedValue({
        success: true,
        preferences: userPreferencesForClient,
      });

      const { result } = renderHook(
        () => useUserPreferences({ preferencesSubjectUserId: "client-456" }),
        {
          wrapper: queryCtx.createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.preferencesLoading).toBe(false);
      });

      expect(preferencesApi.getByUserId).toHaveBeenCalledWith("client-456");
      expect(result.current.userPreferences).toEqual(userPreferencesForClient);
    });

    it("should handle preferences API error", async () => {
      vi.mocked(preferencesApi.get).mockResolvedValue({
        success: false,
        error: "Preferences not found",
      });

      const { result } = renderHook(() => useUserPreferences(), {
        wrapper: queryCtx.createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.preferencesError).toBeTruthy();
      });

      expect(result.current.userPreferences).toBe(null);
    });
  });

  describe("updating preferences", () => {
    it("should update preferences and invalidate cache", async () => {
      vi.mocked(preferencesApi.get).mockResolvedValue({
        success: true,
        preferences: initialPreferencesForUpdate,
      });

      vi.mocked(preferencesApi.createOrUpdate).mockResolvedValue({
        success: true,
        preferences: updatedPreferencesAfterMutation,
      });

      const { result } = renderHook(() => useUserPreferences(), {
        wrapper: queryCtx.createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.preferencesLoading).toBe(false);
      });

      expect(result.current.userPreferences).toEqual(initialPreferencesForUpdate);

      await result.current.updatePreferences({
        budget_max: 600000,
        budget_min: 350000,
      });

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });

      expect(result.current.userPreferences).toEqual(updatedPreferencesAfterMutation);
    });

    it("should track updating state", async () => {
      vi.mocked(preferencesApi.get).mockResolvedValue({
        success: true,
        preferences: { budget_max: 500000 },
      });

      vi.mocked(preferencesApi.createOrUpdate).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ success: true, preferences: { budget_max: 600000 } });
            }, 100);
          })
      );

      const { result } = renderHook(() => useUserPreferences(), {
        wrapper: queryCtx.createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.preferencesLoading).toBe(false);
      });

      const updatePromise = result.current.updatePreferences({
        budget_max: 600000,
      });

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(true);
      });

      await updatePromise;

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });
    });

    it("should handle update error gracefully", async () => {
      vi.mocked(preferencesApi.get).mockResolvedValue({
        success: true,
        preferences: { budget_max: 500000 },
      });

      vi.mocked(preferencesApi.createOrUpdate).mockResolvedValue({
        success: false,
        error: "Update failed",
      });

      const { result } = renderHook(() => useUserPreferences(), {
        wrapper: queryCtx.createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.preferencesLoading).toBe(false);
      });

      await expect(result.current.updatePreferences({ budget_max: 600000 })).rejects.toThrow(
        "Update failed"
      );
    });
  });
});
