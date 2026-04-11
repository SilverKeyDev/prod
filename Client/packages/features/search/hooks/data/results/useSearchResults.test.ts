import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useFiltersStore } from "packages/store";
import type { SearchResult } from "packages/types";

import { useSearchResults } from "./useSearchResults";

// Mock dependencies
vi.mock("packages/store");

describe("useSearchResults", () => {
  const mockSearchResults: SearchResult[] = [
    {
      id: "result-1",
      address: "123 Main St",
      city: "San Francisco",
      state: "CA",
      price: "$500,000",
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1500,
      lat: 37.7749,
      lng: -122.4194,
    } as SearchResult,
    {
      id: "result-2",
      address: "456 Oak Ave",
      city: "San Francisco",
      state: "CA",
      price: "$600,000",
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2000,
      lat: 37.7849,
      lng: -122.4294,
    } as SearchResult,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Default store state
    vi.mocked(useFiltersStore).mockImplementation(
      (selector: (state: Record<string, unknown>) => unknown) => {
        const state = {
          favoriteAddresses: [],
          setFavoriteAddresses: vi.fn(),
          isSearching: false,
          setIsSearching: vi.fn(),
          searchStage: "",
          setSearchStage: vi.fn(),
          currentPage: 0,
          setCurrentPage: vi.fn(),
          activeTab: "results" as const,
          setActiveTab: vi.fn(),
        };
        return selector(state);
      },
    );
  });

  describe("initialization", () => {
    it("should initialize with empty results", () => {
      const { result } = renderHook(() => useSearchResults());

      expect(result.current.searchResults).toEqual([]);
      expect(result.current.savedHomes).toEqual([]);
      expect(result.current.hasSearched).toBe(false);
      expect(result.current.isLocalStorageLoaded).toBe(true);
    });

    it("should provide filter store state", () => {
      const mockFavoriteAddresses = ["123 Main St", "456 Oak Ave"];
      vi.mocked(useFiltersStore).mockImplementation(
        (selector: (state: Record<string, unknown>) => unknown) => {
          const state = {
            favoriteAddresses: mockFavoriteAddresses,
            setFavoriteAddresses: vi.fn(),
            isSearching: true,
            setIsSearching: vi.fn(),
            searchStage: "fetching",
            setSearchStage: vi.fn(),
            currentPage: 2,
            setCurrentPage: vi.fn(),
            activeTab: "saved" as const,
            setActiveTab: vi.fn(),
          };
          return selector(state);
        },
      );

      const { result } = renderHook(() => useSearchResults());

      expect(result.current.favoriteAddresses).toEqual(mockFavoriteAddresses);
      expect(result.current.isSearching).toBe(true);
      expect(result.current.searchStage).toBe("fetching");
      expect(result.current.currentPage).toBe(2);
      expect(result.current.activeTab).toBe("saved");
    });
  });

  describe("setting search results", () => {
    it("should set search results", () => {
      const { result } = renderHook(() => useSearchResults());

      act(() => {
        result.current.setSearchResults(mockSearchResults);
      });

      expect(result.current.searchResults).toEqual(mockSearchResults);
    });

    it("should set has searched flag", () => {
      const { result } = renderHook(() => useSearchResults());

      expect(result.current.hasSearched).toBe(false);

      act(() => {
        result.current.setHasSearched(true);
      });

      expect(result.current.hasSearched).toBe(true);
    });

    it("should clear search results", () => {
      const { result } = renderHook(() => useSearchResults());

      act(() => {
        result.current.setSearchResults(mockSearchResults);
      });

      expect(result.current.searchResults).toHaveLength(2);

      act(() => {
        result.current.setSearchResults([]);
      });

      expect(result.current.searchResults).toEqual([]);
    });
  });

  describe("pagination", () => {
    it("should paginate search results correctly", () => {
      const { result } = renderHook(() => useSearchResults());

      act(() => {
        result.current.setSearchResults(mockSearchResults);
      });

      // PROPERTIES_PER_PAGE is 1, so first page should show first result
      expect(result.current.paginatedSearchResults).toHaveLength(1);
      expect(result.current.paginatedSearchResults[0].id).toBe("result-1");
    });

    it("should show next page when currentPage changes", () => {
      const setCurrentPage = vi.fn();
      vi.mocked(useFiltersStore).mockImplementation(
        (selector: (state: Record<string, unknown>) => unknown) => {
          const state = {
            favoriteAddresses: [],
            setFavoriteAddresses: vi.fn(),
            isSearching: false,
            setIsSearching: vi.fn(),
            searchStage: "",
            setSearchStage: vi.fn(),
            currentPage: 1,
            setCurrentPage,
            activeTab: "results" as const,
            setActiveTab: vi.fn(),
          };
          return selector(state);
        },
      );

      const { result } = renderHook(() => useSearchResults());

      act(() => {
        result.current.setSearchResults(mockSearchResults);
      });

      // Page 1 should show second result
      expect(result.current.paginatedSearchResults).toHaveLength(1);
      expect(result.current.paginatedSearchResults[0].id).toBe("result-2");
    });

    it("should paginate saved homes independently", () => {
      const mockSavedHomes = mockSearchResults.map((r, i) => ({
        ...r,
        id: `saved-${i}`,
      }));

      const { result } = renderHook(() => useSearchResults());

      act(() => {
        result.current.setSearchResults(mockSearchResults);
        result.current.setSavedHomes(mockSavedHomes);
      });

      expect(result.current.paginatedSearchResults[0].id).toBe("result-1");
      expect(result.current.paginatedSavedHomes[0].id).toBe("saved-0");
    });
  });

  describe("tab management", () => {
    it("should handle tab change and reset page", () => {
      const setActiveTab = vi.fn();
      const setCurrentPage = vi.fn();

      vi.mocked(useFiltersStore).mockImplementation(
        (selector: (state: Record<string, unknown>) => unknown) => {
          const state = {
            favoriteAddresses: [],
            setFavoriteAddresses: vi.fn(),
            isSearching: false,
            setIsSearching: vi.fn(),
            searchStage: "",
            setSearchStage: vi.fn(),
            currentPage: 3,
            setCurrentPage,
            activeTab: "results" as const,
            setActiveTab,
          };
          return selector(state);
        },
      );

      const { result } = renderHook(() => useSearchResults());

      act(() => {
        result.current.handleTabChange("saved");
      });

      expect(setActiveTab).toHaveBeenCalledWith("saved");
      expect(setCurrentPage).toHaveBeenCalledWith(0);
    });
  });

  describe("isHomeSaved", () => {
    it("should check if home is in saved homes", () => {
      const { result } = renderHook(() => useSearchResults());

      act(() => {
        result.current.setSavedHomes(mockSearchResults);
      });

      expect(result.current.isHomeSaved("result-1")).toBe(true);
      expect(result.current.isHomeSaved("result-2")).toBe(true);
      expect(result.current.isHomeSaved("nonexistent")).toBe(false);
    });

    it("should return false when no saved homes", () => {
      const { result } = renderHook(() => useSearchResults());

      expect(result.current.isHomeSaved("result-1")).toBe(false);
    });
  });

  describe("search state management", () => {
    it("should manage searching state", () => {
      const setIsSearching = vi.fn();

      vi.mocked(useFiltersStore).mockImplementation(
        (selector: (state: Record<string, unknown>) => unknown) => {
          const state = {
            favoriteAddresses: [],
            setFavoriteAddresses: vi.fn(),
            isSearching: false,
            setIsSearching,
            searchStage: "",
            setSearchStage: vi.fn(),
            currentPage: 0,
            setCurrentPage: vi.fn(),
            activeTab: "results" as const,
            setActiveTab: vi.fn(),
          };
          return selector(state);
        },
      );

      const { result } = renderHook(() => useSearchResults());

      act(() => {
        result.current.setIsSearching(true);
      });

      expect(setIsSearching).toHaveBeenCalledWith(true);
    });

    it("should manage search stage", () => {
      const setSearchStage = vi.fn();

      vi.mocked(useFiltersStore).mockImplementation(
        (selector: (state: Record<string, unknown>) => unknown) => {
          const state = {
            favoriteAddresses: [],
            setFavoriteAddresses: vi.fn(),
            isSearching: false,
            setIsSearching: vi.fn(),
            searchStage: "",
            setSearchStage,
            currentPage: 0,
            setCurrentPage: vi.fn(),
            activeTab: "results" as const,
            setActiveTab: vi.fn(),
          };
          return selector(state);
        },
      );

      const { result } = renderHook(() => useSearchResults());

      act(() => {
        result.current.setSearchStage("processing");
      });

      expect(setSearchStage).toHaveBeenCalledWith("processing");
    });
  });

  describe("constants", () => {
    it("should expose PROPERTIES_PER_PAGE constant", () => {
      const { result } = renderHook(() => useSearchResults());

      expect(result.current.PROPERTIES_PER_PAGE).toBe(1);
    });
  });
});
