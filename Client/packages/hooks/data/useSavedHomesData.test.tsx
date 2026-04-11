import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { userApi } from "packages/config";
import { useAuthStore } from "packages/store";
import type { SavedHome } from "packages/types";

import { useSavedHomesData } from "./useSavedHomesData";

function mockSavedHomesAuth(
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

// Mock dependencies
vi.mock("packages/store");
vi.mock("packages/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("packages/config")>();
  return {
    ...actual,
    userApi: {
      ...actual.userApi,
      getFavoriteHomes: vi.fn(),
      addFavoriteHome: vi.fn(),
      removeFavoriteHome: vi.fn(),
    },
  };
});
vi.mock("packages/logger", () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    security: vi.fn(),
    reloadConfig: vi.fn(),
    updateConfig: vi.fn(),
    getConfig: vi.fn(() => ({})),
  },
  LOG_CATEGORIES: {
    MAP_RENDERING: "map_rendering",
  },
}));
vi.mock("packages/utils/platform", () => ({
  getWindow: vi.fn(() => null),
}));
vi.mock("packages/utils/storage/platformStorage", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("packages/utils/storage/platformStorage")
    >();
  const memory = () => ({
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  });
  return {
    ...actual,
    getSessionStorage: vi.fn(memory),
    getLocalStorage: vi.fn(memory),
  };
});

describe("useSavedHomesData", () => {
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
    mockSavedHomesAuth({ isAuthenticated: true, authReady: true });
  });

  afterEach(() => {
    queryClient?.clear();
  });

  describe("loading saved homes", () => {
    it("should fetch saved homes successfully", async () => {
      const mockHomes = [
        {
          id: "home-1",
          address: "123 Main St",
          lat: 37.7749,
          lng: -122.4194,
          price: "$500,000",
          bedrooms: 3,
          bathrooms: 2,
          sqft: 1500,
        },
        {
          id: "home-2",
          address: "456 Oak Ave",
          lat: 37.7849,
          lng: -122.4294,
          price: "$600,000",
          bedrooms: 4,
          bathrooms: 3,
          sqft: 2000,
        },
      ];

      vi.mocked(userApi.getFavoriteHomes).mockResolvedValue({
        success: true,
        favorites: mockHomes,
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      expect(result.current.savedHomes).toHaveLength(2);
      expect(result.current.savedHomesError).toBe(null);
    });

    it("should not fetch when not authenticated", async () => {
      mockSavedHomesAuth({ isAuthenticated: false, authReady: true });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      expect(result.current.savedHomes).toEqual([]);
      expect(userApi.getFavoriteHomes).not.toHaveBeenCalled();
    });

    it("should handle API error gracefully", async () => {
      vi.mocked(userApi.getFavoriteHomes).mockResolvedValue({
        success: false,
        error: "Failed to load favorites",
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesError).toBeTruthy();
      });

      expect(result.current.savedHomes).toEqual([]);
    });

    it("should fetch client saved homes when clientId provided", async () => {
      const mockHomes = [
        {
          id: "home-1",
          address: "123 Main St",
          lat: 37.7749,
          lng: -122.4194,
        },
      ];

      vi.mocked(userApi.getFavoriteHomes).mockResolvedValue({
        success: true,
        favorites: mockHomes,
      });

      const { result } = renderHook(() => useSavedHomesData("client-456"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      expect(userApi.getFavoriteHomes).toHaveBeenCalledWith("client-456");
      expect(result.current.savedHomes).toHaveLength(1);
    });
  });

  describe("saving homes", () => {
    it("should save home with optimistic update", async () => {
      vi.mocked(userApi.getFavoriteHomes).mockResolvedValue({
        success: true,
        favorites: [],
      });

      vi.mocked(userApi.addFavoriteHome).mockResolvedValue({
        success: true,
        favorite: { id: "home-123", address: "789 Pine St" },
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      expect(result.current.savedHomes).toEqual([]);

      const newHome = {
        id: "home-123",
        address: "789 Pine St",
        lat: 37.7949,
        lng: -122.4394,
        price: "$700,000",
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1800,
      };

      await result.current.saveHome(newHome);

      await waitFor(() => {
        expect(result.current.savedHomes.length).toBeGreaterThan(0);
      });
    });

    it("should not duplicate saved home", async () => {
      const existingHome = {
        id: "home-1",
        address: "123 Main St",
        lat: 37.7749,
        lng: -122.4194,
      };

      vi.mocked(userApi.getFavoriteHomes).mockResolvedValue({
        success: true,
        favorites: [existingHome],
      });

      vi.mocked(userApi.addFavoriteHome).mockResolvedValue({
        success: true,
        favorite: existingHome,
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      expect(result.current.savedHomes).toHaveLength(1);

      // Try to save the same home again
      await result.current.saveHome(existingHome);

      await waitFor(() => {
        // Should still be 1, not 2
        expect(result.current.savedHomes).toHaveLength(1);
      });
    });

    it("should rollback on save error", async () => {
      vi.mocked(userApi.getFavoriteHomes).mockResolvedValue({
        success: true,
        favorites: [],
      });

      vi.mocked(userApi.addFavoriteHome).mockResolvedValue({
        success: false,
        error: "Failed to save",
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      const newHome = {
        id: "home-123",
        address: "789 Pine St",
        lat: 37.7949,
        lng: -122.4394,
      };

      await expect(result.current.saveHome(newHome)).rejects.toThrow();

      // Should rollback to empty
      expect(result.current.savedHomes).toEqual([]);
    });
  });

  describe("removing saved homes", () => {
    it("should remove saved home by id", async () => {
      const mockHomes: SavedHome[] = [
        {
          home_id: "home-1",
          address: "123 Main St",
          description: "123 Main St",
          lat: 37.7749,
          lng: -122.4194,
          price: "$500,000",
          bedrooms: 3,
          bathrooms: 2,
          sqft: 1500,
          lot_size: "",
          image_url: null,
        },
        {
          home_id: "home-2",
          address: "456 Oak Ave",
          description: "456 Oak Ave",
          lat: 37.7849,
          lng: -122.4294,
          price: "$600,000",
          bedrooms: 4,
          bathrooms: 3,
          sqft: 2000,
          lot_size: "",
          image_url: null,
        },
      ];

      vi.mocked(userApi.getFavoriteHomes).mockResolvedValue({
        success: true,
        favorites: mockHomes,
      });

      vi.mocked(userApi.removeFavoriteHome).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      expect(result.current.savedHomes).toHaveLength(2);

      await result.current.removeSavedHome("home-1");

      await waitFor(() => {
        expect(result.current.savedHomes).toHaveLength(1);
        expect(result.current.savedHomes[0].home_id).toBe("home-2");
      });
    });

    it("should handle remove error with rollback", async () => {
      const mockHomes: SavedHome[] = [
        {
          home_id: "home-1",
          address: "123 Main St",
          description: "123 Main St",
          lat: 37.7749,
          lng: -122.4194,
          price: "$500,000",
          bedrooms: 3,
          bathrooms: 2,
          sqft: 1500,
          lot_size: "",
          image_url: null,
        },
      ];

      vi.mocked(userApi.getFavoriteHomes).mockResolvedValue({
        success: true,
        favorites: mockHomes,
      });

      vi.mocked(userApi.removeFavoriteHome).mockResolvedValue({
        success: false,
        error: "Remove failed",
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      await expect(result.current.removeSavedHome("home-1")).rejects.toThrow();

      // Should rollback to original
      await waitFor(() => {
        expect(result.current.savedHomes).toHaveLength(1);
      });
    });
  });

  describe("home saved check", () => {
    it("should check if home is saved by id", async () => {
      const mockHomes: SavedHome[] = [
        {
          home_id: "home-1",
          address: "123 Main St",
          description: "123 Main St",
          lat: 37.7749,
          lng: -122.4194,
          price: "$500,000",
          bedrooms: 3,
          bathrooms: 2,
          sqft: 1500,
          lot_size: "",
          image_url: null,
        },
      ];

      vi.mocked(userApi.getFavoriteHomes).mockResolvedValue({
        success: true,
        favorites: mockHomes,
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      expect(result.current.isHomeSaved("home-1")).toBe(true);
      expect(result.current.isHomeSaved("home-999")).toBe(false);
    });

    it("should get saved home by id", async () => {
      const mockHome: SavedHome = {
        home_id: "home-1",
        address: "123 Main St",
        description: "123 Main St",
        lat: 37.7749,
        lng: -122.4194,
        price: "$500,000",
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1500,
        lot_size: "",
        image_url: null,
      };

      vi.mocked(userApi.getFavoriteHomes).mockResolvedValue({
        success: true,
        favorites: [mockHome],
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      const foundHome = result.current.getSavedHome("home-1");
      expect(foundHome).toMatchObject({
        home_id: mockHome.home_id,
        address: mockHome.address,
        description: mockHome.description,
        lat: mockHome.lat,
        lng: mockHome.lng,
        bedrooms: mockHome.bedrooms,
        bathrooms: mockHome.bathrooms,
        sqft: mockHome.sqft,
        lot_size: mockHome.lot_size,
      });
      expect(foundHome?.price).toMatch(/\b500[,.]?000\b/);

      const notFound = result.current.getSavedHome("home-999");
      expect(notFound).toBeUndefined();
    });
  });
});
