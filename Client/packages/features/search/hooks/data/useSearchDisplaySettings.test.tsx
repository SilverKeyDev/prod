import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { queryKeys } from "packages/config/query/keys";
import { searchDisplayApi } from "packages/features/search/api/searchDisplay";
import { useFiltersStore } from "packages/features/search/store/filters.slice";

import { useSearchDisplaySettings } from "./useSearchDisplaySettings";

vi.mock("packages/features/search/api/searchDisplay", () => ({
  searchDisplayApi: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock("packages/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("packages/store")>();
  return {
    ...actual,
    useAuthStore: (selector: (s: { isAuthenticated: boolean }) => unknown) =>
      selector({ isAuthenticated: true }),
  };
});

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useSearchDisplaySettings", () => {
  let filtersSnapshot: {
    showCommuteOverlay: boolean;
    resultsOrderBy: string;
    preferencesStrictFilter: boolean;
    mapHomeCardsCount: number;
  };
  let unsubscribeFilters: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    useFiltersStore.setState({
      showCommuteOverlay: true,
      resultsOrderBy: "match_score",
      preferencesStrictFilter: false,
      mapHomeCardsCount: 1,
    });
    unsubscribeFilters = useFiltersStore.subscribe((state) => {
      filtersSnapshot = {
        showCommuteOverlay: state.showCommuteOverlay,
        resultsOrderBy: state.resultsOrderBy,
        preferencesStrictFilter: state.preferencesStrictFilter,
        mapHomeCardsCount: state.mapHomeCardsCount,
      };
    });
  });

  afterEach(() => {
    unsubscribeFilters();
  });

  it("loads search display from the API and syncs the filters store", async () => {
    vi.mocked(searchDisplayApi.get).mockResolvedValue({
      success: true,
      search_display: {
        show_commute_overlay: false,
        map_home_cards_count: 2,
        results_order_by: "price",
        preferences_strict_filter: true,
      },
    });

    renderHook(() => useSearchDisplaySettings(true), { wrapper });

    await waitFor(() => {
      expect(searchDisplayApi.get).toHaveBeenCalled();
      expect(filtersSnapshot.showCommuteOverlay).toBe(false);
      expect(filtersSnapshot.resultsOrderBy).toBe("price");
      expect(filtersSnapshot.preferencesStrictFilter).toBe(true);
      expect(filtersSnapshot.mapHomeCardsCount).toBe(2);
    });
  });

  it("patches search display and updates query cache plus filters store", async () => {
    vi.mocked(searchDisplayApi.get).mockResolvedValue({
      success: true,
      search_display: {
        show_commute_overlay: true,
        map_home_cards_count: 1,
        results_order_by: "match_score",
        preferences_strict_filter: false,
      },
    });
    vi.mocked(searchDisplayApi.patch).mockResolvedValue({
      success: true,
      search_display: {
        show_commute_overlay: false,
        map_home_cards_count: 1,
        results_order_by: "distance",
        preferences_strict_filter: false,
      },
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const localWrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useSearchDisplaySettings(true), { wrapper: localWrapper });

    await waitFor(() => {
      expect(searchDisplayApi.get).toHaveBeenCalled();
    });

    await act(async () => {
      result.current.patchSearchDisplay({
        show_commute_overlay: false,
        results_order_by: "distance",
      });
    });

    await waitFor(() => {
      expect(searchDisplayApi.patch).toHaveBeenCalledWith({
        show_commute_overlay: false,
        results_order_by: "distance",
      });
      expect(filtersSnapshot.showCommuteOverlay).toBe(false);
      expect(filtersSnapshot.resultsOrderBy).toBe("distance");
      expect(queryClient.getQueryData(queryKeys.user.searchDisplay())).toEqual({
        show_commute_overlay: false,
        map_home_cards_count: 1,
        results_order_by: "distance",
        preferences_strict_filter: false,
      });
    });
  });
});
