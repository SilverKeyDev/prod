import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { userApi } from "packages/config";

import { useSavedHomesData } from "./useSavedHomesData";
import {
  clientScopedSavedHomes,
  existingHomeForDuplicateTest,
  newHomeForSave,
  newHomeMinimalForRollback,
  savedHomeMainSt,
  savedHomesFetchList,
  twoSavedHomes,
} from "./useSavedHomesData.test.fixtures";
import {
  createSavedHomesTestQueryContext,
  mockSavedHomesAuth,
} from "./useSavedHomesData.test.helpers";

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
  const actual = await importOriginal<typeof import("packages/utils/storage/platformStorage")>();
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
  const queryCtx = createSavedHomesTestQueryContext();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSavedHomesAuth({ isAuthenticated: true, authReady: true });
  });

  afterEach(() => {
    queryCtx.getQueryClient()?.clear();
  });

  describe("loading saved homes", () => {
    it("should fetch saved homes successfully", async () => {
      vi.mocked(userApi.getFavoriteHomes).mockResolvedValue({
        success: true,
        favorites: [...savedHomesFetchList],
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: queryCtx.createWrapper(),
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
        wrapper: queryCtx.createWrapper(),
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
        wrapper: queryCtx.createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesError).toBeTruthy();
      });

      expect(result.current.savedHomes).toEqual([]);
    });

    it("should fetch client saved homes when clientId provided", async () => {
      vi.mocked(userApi.getFavoriteHomes).mockResolvedValue({
        success: true,
        favorites: [...clientScopedSavedHomes],
      });

      const { result } = renderHook(() => useSavedHomesData("client-456"), {
        wrapper: queryCtx.createWrapper(),
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
        wrapper: queryCtx.createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      expect(result.current.savedHomes).toEqual([]);

      await result.current.saveHome(newHomeForSave);

      await waitFor(() => {
        expect(result.current.savedHomes.length).toBeGreaterThan(0);
      });
    });

    it("should not duplicate saved home", async () => {
      vi.mocked(userApi.getFavoriteHomes).mockResolvedValue({
        success: true,
        favorites: [existingHomeForDuplicateTest],
      });

      vi.mocked(userApi.addFavoriteHome).mockResolvedValue({
        success: true,
        favorite: existingHomeForDuplicateTest,
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: queryCtx.createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      expect(result.current.savedHomes).toHaveLength(1);

      await result.current.saveHome(existingHomeForDuplicateTest);

      await waitFor(() => {
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
        wrapper: queryCtx.createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      await expect(result.current.saveHome(newHomeMinimalForRollback)).rejects.toThrow();

      expect(result.current.savedHomes).toEqual([]);
    });
  });

  describe("removing saved homes", () => {
    it("should remove saved home by id", async () => {
      vi.mocked(userApi.getFavoriteHomes).mockResolvedValue({
        success: true,
        favorites: twoSavedHomes,
      });

      vi.mocked(userApi.removeFavoriteHome).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: queryCtx.createWrapper(),
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
      vi.mocked(userApi.getFavoriteHomes).mockResolvedValue({
        success: true,
        favorites: [savedHomeMainSt],
      });

      vi.mocked(userApi.removeFavoriteHome).mockResolvedValue({
        success: false,
        error: "Remove failed",
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: queryCtx.createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      await expect(result.current.removeSavedHome("home-1")).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.savedHomes).toHaveLength(1);
      });
    });
  });

  describe("home saved check", () => {
    it("should check if home is saved by id", async () => {
      vi.mocked(userApi.getFavoriteHomes).mockResolvedValue({
        success: true,
        favorites: [savedHomeMainSt],
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: queryCtx.createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.savedHomesLoading).toBe(false);
      });

      expect(result.current.isHomeSaved("home-1")).toBe(true);
      expect(result.current.isHomeSaved("home-999")).toBe(false);
    });

    it("should get saved home by id", async () => {
      const mockHome = savedHomeMainSt;

      vi.mocked(userApi.getFavoriteHomes).mockResolvedValue({
        success: true,
        favorites: [mockHome],
      });

      const { result } = renderHook(() => useSavedHomesData(), {
        wrapper: queryCtx.createWrapper(),
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
