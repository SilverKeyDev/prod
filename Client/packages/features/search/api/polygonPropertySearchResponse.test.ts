import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { handlePolygonSearchFiltersTooTightOutcome } from "packages/features/search/utils/outcomes/searchFiltersTooTightOutcome";
import { warnSearchEmptyResults } from "packages/features/search/utils/outcomes/searchOutcomeToast";
import type { SearchByPolygonResponse } from "packages/types/domain/api";

import { handlePolygonSearchResponse } from "./polygonPropertySearchResponse";
import type { SearchResult } from "./propertySearchTypes";

vi.mock("packages/logger", () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  LOG_CATEGORIES: { SEARCH: "search" },
}));

vi.mock("packages/features/search/utils/outcomes/searchOutcomeToast", () => ({
  warnSearchEmptyResults: vi.fn(),
}));

vi.mock("packages/features/search/utils/outcomes/searchFiltersTooTightOutcome", () => ({
  handlePolygonSearchFiltersTooTightOutcome: vi.fn(() => false),
}));

vi.mock("packages/features/search/utils/transform/searchTransform", () => ({
  transformPropertySearchResult: vi.fn(
    (property: { id?: string }, index: number) =>
      ({
        id: property.id ?? `row-${index}`,
        address: "Test",
        price: "$1",
        bedrooms: 1,
        bathrooms: 1,
        sqft: 100,
        lat: 0,
        lng: 0,
        propertyType: "Single Family",
        listingStatus: "FOR_SALE",
        imageUrl: "/default.jpg",
        _score: 50,
      }) satisfies SearchResult
  ),
}));

function createSetters() {
  return {
    setSearchStage: vi.fn(),
    setSearchResults: vi.fn(),
    setIsSearching: vi.fn(),
    setHasSearched: vi.fn(),
    setCurrentPage: vi.fn(),
    setShowPropertyModals: vi.fn(),
  };
}

function successResponse(
  overrides: Partial<SearchByPolygonResponse> = {}
): SearchByPolygonResponse {
  return {
    success: true,
    properties: [
      {
        id: "1",
        essentials: { bedrooms: 2, bathrooms: 1 },
        location: {
          address: "1 Main",
          city: "Austin",
          state: "TX",
          zipcode: "78701",
        },
        score: 80,
      },
    ],
    ...overrides,
  } as SearchByPolygonResponse;
}

describe("handlePolygonSearchResponse", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws when response success is false", async () => {
    const setters = createSetters();
    await expect(
      handlePolygonSearchResponse(
        { success: false, error: "Search failed" } as SearchByPolygonResponse,
        { lat: 0, lng: 0 },
        setters.setSearchStage,
        setters.setSearchResults,
        setters.setIsSearching,
        setters.setHasSearched,
        setters.setCurrentPage,
        setters.setShowPropertyModals,
        true
      )
    ).rejects.toThrow("Search failed");
    expect(setters.setSearchResults).not.toHaveBeenCalled();
  });

  it("commits transformed results after uncached staging delays", async () => {
    const setters = createSetters();
    const onResultsCommittedEnablePreviews = vi.fn();

    const promise = handlePolygonSearchResponse(
      successResponse({ meta: { cached: false } }),
      { lat: 30, lng: -97 },
      setters.setSearchStage,
      setters.setSearchResults,
      setters.setIsSearching,
      setters.setHasSearched,
      setters.setCurrentPage,
      setters.setShowPropertyModals,
      true,
      { onResultsCommittedEnablePreviews }
    );

    await vi.advanceTimersByTimeAsync(2000);
    await promise;

    expect(setters.setSearchStage).toHaveBeenCalledWith("Evaluating scores...");
    expect(setters.setSearchResults).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: "1" })])
    );
    expect(setters.setIsSearching).toHaveBeenCalledWith(false);
    expect(setters.setHasSearched).toHaveBeenCalledWith(true);
    expect(onResultsCommittedEnablePreviews).toHaveBeenCalled();
  });

  it("uses shorter delay path for cached results", async () => {
    const setters = createSetters();

    const promise = handlePolygonSearchResponse(
      successResponse({ meta: { cached: true } }),
      { lat: 0, lng: 0 },
      setters.setSearchStage,
      setters.setSearchResults,
      setters.setIsSearching,
      setters.setHasSearched,
      setters.setCurrentPage,
      setters.setShowPropertyModals,
      false
    );

    await vi.advanceTimersByTimeAsync(500);
    await promise;

    expect(setters.setSearchStage).toHaveBeenCalledWith("Loading cached results...");
    expect(setters.setSearchResults).toHaveBeenCalled();
  });

  it("aborts during staged delay without committing results", async () => {
    const setters = createSetters();
    const controller = new AbortController();

    const promise = handlePolygonSearchResponse(
      successResponse({ meta: { cached: false } }),
      { lat: 0, lng: 0 },
      setters.setSearchStage,
      setters.setSearchResults,
      setters.setIsSearching,
      setters.setHasSearched,
      setters.setCurrentPage,
      setters.setShowPropertyModals,
      true,
      undefined,
      controller.signal
    );

    await vi.advanceTimersByTimeAsync(100);
    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
    expect(setters.setSearchResults).not.toHaveBeenCalled();
  });

  it("throws AbortError when signal is already aborted", async () => {
    const setters = createSetters();
    const controller = new AbortController();
    controller.abort();

    await expect(
      handlePolygonSearchResponse(
        successResponse(),
        { lat: 0, lng: 0 },
        setters.setSearchStage,
        setters.setSearchResults,
        setters.setIsSearching,
        setters.setHasSearched,
        setters.setCurrentPage,
        setters.setShowPropertyModals,
        true,
        undefined,
        controller.signal
      )
    ).rejects.toMatchObject({ name: "AbortError" });
  });

  it("handles filters-too-tight outcome instead of generic empty toast", async () => {
    vi.mocked(handlePolygonSearchFiltersTooTightOutcome).mockReturnValueOnce(true);
    const setters = createSetters();

    const promise = handlePolygonSearchResponse(
      successResponse({ properties: [], meta: { filtersTooTight: true, cached: false } }),
      { lat: 0, lng: 0 },
      setters.setSearchStage,
      setters.setSearchResults,
      setters.setIsSearching,
      setters.setHasSearched,
      setters.setCurrentPage,
      setters.setShowPropertyModals,
      true
    );

    await vi.advanceTimersByTimeAsync(2000);
    await promise;

    expect(handlePolygonSearchFiltersTooTightOutcome).toHaveBeenCalled();
    expect(warnSearchEmptyResults).not.toHaveBeenCalled();
  });

  it("shows generic empty toast when filters are not too tight", async () => {
    vi.mocked(handlePolygonSearchFiltersTooTightOutcome).mockReturnValueOnce(false);
    const setters = createSetters();

    const promise = handlePolygonSearchResponse(
      successResponse({ properties: [], meta: { cached: false } }),
      { lat: 0, lng: 0 },
      setters.setSearchStage,
      setters.setSearchResults,
      setters.setIsSearching,
      setters.setHasSearched,
      setters.setCurrentPage,
      setters.setShowPropertyModals,
      false
    );

    await vi.advanceTimersByTimeAsync(2000);
    await promise;

    expect(warnSearchEmptyResults).toHaveBeenCalledWith({ preferencesStrictFilter: false });
  });
});
