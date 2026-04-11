import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { preferencesApi, userApi } from "packages/config/http/api";
import type { UserPreferences, UserProfile } from "packages/schemas";
import { useAuthStore } from "packages/store";

import { useUserData, useUserPreferences } from "./useUserData";

// Mock dependencies
vi.mock("packages/store");
vi.mock("packages/config/http/api");
vi.mock("packages/utils/media/prefetchRemoteImage", () => ({
  prefetchRemoteImage: vi.fn(),
}));

function mockAuthSelectors(
  partial: { isAuthenticated?: boolean; authReady?: boolean } = {},
): void {
  const isAuthenticated = partial.isAuthenticated ?? true;
  const authReady = partial.authReady ?? true;
  vi.mocked(useAuthStore).mockImplementation((selector) =>
    selector({
      isAuthenticated,
      authReady,
    } as ReturnType<typeof useAuthStore>),
  );
}

describe("useUserData", () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthSelectors({ isAuthenticated: true, authReady: true });
  });

  afterEach(() => {
    queryClient?.clear();
  });

  describe("loading user profile", () => {
    it("should fetch user profile successfully", async () => {
      const mockUser: UserProfile = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        has_subscription: true,
        subscription: null,
        has_preferences: true,
        is_agent: false,
        is_closing_mode: false,
        client_ids: "client1,client2",
        profile_picture_url: null,
        roles: [],
      };

      vi.mocked(userApi.getProfile).mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const { result } = renderHook(() => useUserData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.userProfileLoading).toBe(false);
      });

      expect(result.current.userProfile).toEqual(mockUser);
      expect(result.current.userProfileError).toBe(null);
    });

    it("should not fetch when not authenticated", async () => {
      mockAuthSelectors({ isAuthenticated: false, authReady: true });

      const { result } = renderHook(() => useUserData(), {
        wrapper: createWrapper(),
      });

      expect(result.current.userProfile).toBe(null);
      expect(userApi.getProfile).not.toHaveBeenCalled();
    });

    it("should not fetch when auth not ready", async () => {
      mockAuthSelectors({ isAuthenticated: true, authReady: false });

      const { result } = renderHook(() => useUserData(), {
        wrapper: createWrapper(),
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
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.userProfileError).toBeTruthy();
      });

      expect(result.current.userProfile).toBe(null);
      expect(result.current.userProfileError).toContain("Network error");
    });

    it("should normalize User to UserProfile with defaults", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        // Missing optional fields
      };

      vi.mocked(userApi.getProfile).mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const { result } = renderHook(() => useUserData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.userProfileLoading).toBe(false);
      });

      expect(result.current.userProfile).toEqual({
        ...mockUser,
        has_subscription: false,
        subscription: null,
        has_preferences: false,
        is_agent: false,
        is_closing_mode: false,
        client_ids: undefined,
        roles: [],
      });
    });

    it("should refresh user profile on demand", async () => {
      const mockUser: UserProfile = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        has_subscription: false,
        subscription: null,
        has_preferences: false,
        is_agent: false,
        is_closing_mode: false,
        client_ids: null,
        profile_picture_url: null,
        roles: [],
      };

      vi.mocked(userApi.getProfile).mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const { result } = renderHook(() => useUserData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.userProfileLoading).toBe(false);
      });

      // Update mock for refresh
      const updatedUser = { ...mockUser, name: "Updated User" };
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
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthSelectors({ isAuthenticated: true, authReady: true });
  });

  afterEach(() => {
    queryClient?.clear();
  });

  describe("loading preferences", () => {
    it("should fetch user preferences successfully", async () => {
      const mockPreferences: UserPreferences = {
        budget_max: 500000,
        budget_min: 300000,
        preferred_bedrooms_min: 2,
        preferred_bedrooms_max: 4,
        preferred_bathrooms_min: 2,
        preferred_bathrooms_max: 3,
        important_locations: [
          { address: "123 Main St", max_commute_minutes: 30 },
        ],
      };

      vi.mocked(preferencesApi.get).mockResolvedValue({
        success: true,
        preferences: mockPreferences,
      });

      const { result } = renderHook(() => useUserPreferences(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.preferencesLoading).toBe(false);
      });

      expect(result.current.userPreferences).toEqual(mockPreferences);
      expect(result.current.preferencesError).toBe(null);
    });

    it("should fetch preferences for specific user when clientId provided", async () => {
      const mockPreferences: UserPreferences = {
        budget_max: 400000,
        budget_min: 200000,
        preferred_bedrooms_min: 2,
        preferred_bedrooms_max: 4,
        preferred_bathrooms_min: 2,
        preferred_bathrooms_max: 3,
      };

      vi.mocked(preferencesApi.getByUserId).mockResolvedValue({
        success: true,
        preferences: mockPreferences,
      });

      const { result } = renderHook(
        () => useUserPreferences({ preferencesSubjectUserId: "client-456" }),
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(result.current.preferencesLoading).toBe(false);
      });

      expect(preferencesApi.getByUserId).toHaveBeenCalledWith("client-456");
      expect(result.current.userPreferences).toEqual(mockPreferences);
    });

    it("should handle preferences API error", async () => {
      vi.mocked(preferencesApi.get).mockResolvedValue({
        success: false,
        error: "Preferences not found",
      });

      const { result } = renderHook(() => useUserPreferences(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.preferencesError).toBeTruthy();
      });

      expect(result.current.userPreferences).toBe(null);
    });
  });

  describe("updating preferences", () => {
    it("should update preferences and invalidate cache", async () => {
      const initialPreferences: UserPreferences = {
        budget_max: 500000,
        budget_min: 300000,
        preferred_bedrooms_min: 2,
        preferred_bedrooms_max: 4,
        preferred_bathrooms_min: 2,
        preferred_bathrooms_max: 3,
      };

      const updatedPreferences: UserPreferences = {
        budget_max: 600000,
        budget_min: 350000,
        preferred_bedrooms_min: 2,
        preferred_bedrooms_max: 4,
        preferred_bathrooms_min: 2,
        preferred_bathrooms_max: 3,
      };

      vi.mocked(preferencesApi.get).mockResolvedValue({
        success: true,
        preferences: initialPreferences,
      });

      vi.mocked(preferencesApi.createOrUpdate).mockResolvedValue({
        success: true,
        preferences: updatedPreferences,
      });

      const { result } = renderHook(() => useUserPreferences(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.preferencesLoading).toBe(false);
      });

      expect(result.current.userPreferences).toEqual(initialPreferences);

      await result.current.updatePreferences({
        budget_max: 600000,
        budget_min: 350000,
      });

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });

      expect(result.current.userPreferences).toEqual(updatedPreferences);
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
          }),
      );

      const { result } = renderHook(() => useUserPreferences(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.preferencesLoading).toBe(false);
      });

      const updatePromise = result.current.updatePreferences({
        budget_max: 600000,
      });

      // Should be updating
      await waitFor(() => {
        expect(result.current.isUpdating).toBe(true);
      });

      await updatePromise;

      // Should finish updating
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
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.preferencesLoading).toBe(false);
      });

      await expect(
        result.current.updatePreferences({ budget_max: 600000 }),
      ).rejects.toThrow("Update failed");
    });
  });
});
