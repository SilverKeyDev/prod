import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SearchByPolygonResponse } from "packages/types/domain/api";

import {
  searchPropertiesInIsochrone,
  searchPropertiesInViewport,
} from "./propertySearch";

vi.mock("packages/logger", () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  LOG_CATEGORIES: { SEARCH: "search", ERRORS: "errors" },
}));

vi.mock("packages/features/search/utils/outcomes/searchOutcomeToast", () => ({
  warnSearchAreaInvalid: vi.fn(),
  warnSearchServerOrTimeout: vi.fn(),
}));

const mockSearchByPolygon = vi.fn();
vi.mock("packages/config/http/api", () => ({
  searchApi: {
    searchByPolygon: (...args: unknown[]) => mockSearchByPolygon(...args),
  },
}));

const mockHandlePolygonSearchResponse = vi.fn();
vi.mock("./polygonPropertySearchResponse", () => ({
  handlePolygonSearchResponse: (...args: unknown[]) =>
    mockHandlePolygonSearchResponse(...args),
}));

function createSetters() {
  return {
    setSearchStage: vi.fn(),
    setSearchResults: vi.fn(),
    setIsSearching: vi.fn(),
    setHasSearched: vi.fn(),
    setCurrentPage: vi.fn(),
    setShowPropertyModals: vi.fn(),
    saveSearchResultsToLocalStorage: vi.fn(),
  };
}

const viewportPolygon = [
  { lat: 30, lng: -97 },
  { lat: 30.1, lng: -97 },
  { lat: 30.1, lng: -96.9 },
  { lat: 30, lng: -96.9 },
];

describe("searchPropertiesInIsochrone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHandlePolygonSearchResponse.mockResolvedValue(undefined);
    mockSearchByPolygon.mockResolvedValue({ success: true, properties: [] });
  });

  it("returns early without API call when isochrone geometry is missing", async () => {
    const setters = createSetters();
    const { warnSearchAreaInvalid } =
      await import("packages/features/search/utils/outcomes/searchOutcomeToast");

    await searchPropertiesInIsochrone(
      { isochrone: {} } as never,
      {},
      setters.setSearchStage,
      setters.setSearchResults,
      setters.setIsSearching,
      setters.setHasSearched,
      setters.setCurrentPage,
      setters.setShowPropertyModals,
      setters.saveSearchResultsToLocalStorage,
      {},
      true,
    );

    expect(mockSearchByPolygon).not.toHaveBeenCalled();
    expect(setters.setIsSearching).toHaveBeenCalledWith(false);
    expect(setters.setSearchStage).toHaveBeenCalledWith("");
    expect(warnSearchAreaInvalid).toHaveBeenCalledWith("geometry");
  });

  it("builds polygon request with preferences_user_id and strict filter", async () => {
    const setters = createSetters();

    await searchPropertiesInIsochrone(
      {
        isochrone: { geometry: { type: "Polygon", coordinates: [] } },
        center: { lat: 30.2, lon: -97.7 },
      } as never,
      {},
      setters.setSearchStage,
      setters.setSearchResults,
      setters.setIsSearching,
      setters.setHasSearched,
      setters.setCurrentPage,
      setters.setShowPropertyModals,
      setters.saveSearchResultsToLocalStorage,
      { preferred_bedrooms_min: 3 },
      false,
      "client-42",
    );

    expect(mockSearchByPolygon).toHaveBeenCalledWith(
      expect.objectContaining({
        perBucketPages: 20,
        forceSearch: true,
        preferences_strict_filter: false,
        preferences_user_id: "client-42",
        user_preferences: { preferred_bedrooms_min: 3 },
      }),
      expect.objectContaining({ signal: undefined }),
    );
    expect(mockHandlePolygonSearchResponse).toHaveBeenCalled();
  });

  it("passes price and home type overrides through polygon request", async () => {
    const setters = createSetters();

    await searchPropertiesInIsochrone(
      {
        isochrone: { geometry: { type: "Polygon", coordinates: [] } },
        center: { lat: 30.2, lon: -97.7 },
      } as never,
      {},
      setters.setSearchStage,
      setters.setSearchResults,
      setters.setIsSearching,
      setters.setHasSearched,
      setters.setCurrentPage,
      setters.setShowPropertyModals,
      setters.saveSearchResultsToLocalStorage,
      {
        home_budget_min: 1000000,
        preferred_housing_type: "townhome",
        listing_type: ["new_construction"],
      },
      true,
    );

    expect(mockSearchByPolygon).toHaveBeenCalledWith(
      expect.objectContaining({
        user_preferences: {
          home_budget_min: 1000000,
          preferred_housing_type: "townhome",
          listing_type: ["new_construction"],
        },
      }),
      expect.any(Object),
    );
  });

  it("clears searching state on API error", async () => {
    const setters = createSetters();
    mockSearchByPolygon.mockRejectedValue(new Error("network"));

    await searchPropertiesInIsochrone(
      {
        isochrone: { geometry: { type: "Polygon", coordinates: [] } },
        center: { lat: 30, lon: -97 },
      } as never,
      {},
      setters.setSearchStage,
      setters.setSearchResults,
      setters.setIsSearching,
      setters.setHasSearched,
      setters.setCurrentPage,
      setters.setShowPropertyModals,
      setters.saveSearchResultsToLocalStorage,
      {},
      true,
    );

    expect(setters.setIsSearching).toHaveBeenLastCalledWith(false);
    expect(setters.setSearchStage).toHaveBeenLastCalledWith("");
  });
});

describe("searchPropertiesInViewport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHandlePolygonSearchResponse.mockResolvedValue(undefined);
    mockSearchByPolygon.mockResolvedValue({
      success: true,
      properties: [],
    } as SearchByPolygonResponse);
  });

  it("returns early when viewport polygon is too small", async () => {
    const setters = createSetters();
    const { warnSearchAreaInvalid } =
      await import("packages/features/search/utils/outcomes/searchOutcomeToast");

    await searchPropertiesInViewport(
      [{ lat: 1, lng: 2 }],
      { lat: 30, lng: -97 },
      setters.setSearchStage,
      setters.setSearchResults,
      setters.setIsSearching,
      setters.setHasSearched,
      setters.setCurrentPage,
      setters.setShowPropertyModals,
      {},
      true,
    );

    expect(mockSearchByPolygon).not.toHaveBeenCalled();
    expect(warnSearchAreaInvalid).toHaveBeenCalledWith("viewport");
  });

  it("includes viewport_polygon in search request", async () => {
    const setters = createSetters();

    await searchPropertiesInViewport(
      viewportPolygon,
      { lat: 30.05, lng: -96.95 },
      setters.setSearchStage,
      setters.setSearchResults,
      setters.setIsSearching,
      setters.setHasSearched,
      setters.setCurrentPage,
      setters.setShowPropertyModals,
      { preferred_bathrooms_min: 2 },
      true,
      "agent-client-1",
    );

    expect(mockSearchByPolygon).toHaveBeenCalledWith(
      expect.objectContaining({
        viewport_polygon: viewportPolygon,
        preferences_strict_filter: true,
        preferences_user_id: "agent-client-1",
        user_preferences: { preferred_bathrooms_min: 2 },
      }),
      expect.any(Object),
    );
  });

  it("handles AbortError without server toast", async () => {
    const setters = createSetters();
    const abortErr = new Error("aborted");
    abortErr.name = "AbortError";
    mockSearchByPolygon.mockRejectedValue(abortErr);
    const { warnSearchServerOrTimeout } =
      await import("packages/features/search/utils/outcomes/searchOutcomeToast");

    await searchPropertiesInViewport(
      viewportPolygon,
      { lat: 30, lng: -97 },
      setters.setSearchStage,
      setters.setSearchResults,
      setters.setIsSearching,
      setters.setHasSearched,
      setters.setCurrentPage,
      setters.setShowPropertyModals,
      {},
      true,
    );

    expect(warnSearchServerOrTimeout).not.toHaveBeenCalled();
    expect(setters.setIsSearching).toHaveBeenLastCalledWith(false);
  });
});
