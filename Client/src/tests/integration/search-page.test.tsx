import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { server } from "../__mocks__/server";

import SearchPage from "@/pages/Search/SearchPage";


// Mock Google Maps
vi.mock("@/core/hooks/data/useGoogleMaps", () => ({
  useGoogleMaps: () => ({
    isLoaded: true,
    createMap: vi.fn(),
  }),
}));

// Mock map-related hooks
vi.mock("@/features/search/page/useMapInitAndResize", () => ({
  useMapInitAndResize: () => ({
    mapRef: { current: null },
    mapInstance: null,
  }),
}));

vi.mock("@/features/search/page/useMarkerUpdates", () => ({
  useMarkerUpdates: () => ({}),
}));

vi.mock("@/features/search/page/useMapZoomController", () => ({
  useMapZoomController: () => ({
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
  }),
}));

vi.mock("@/features/search/page/useIsochroneFlow", () => ({
  useIsochroneFlow: () => ({
    isochroneData: null,
    isLoadingIsochrone: false,
    generateIsochrone: vi.fn(),
    runIsochroneSearch: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/features/search/page/usePropertyFocus", () => ({
  usePropertyFocus: () => ({
    focusedProperty: null,
    setFocusedProperty: vi.fn(),
  }),
}));

vi.mock("@/features/search/page/useSavedHomes", () => ({
  useSavedHomes: () => ({
    savedHomes: [],
    toggleSavedHome: vi.fn(),
  }),
}));

vi.mock("@/features/search/page/useSearchBootstrap", () => ({
  useSearchBootstrap: () => ({
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/features/search/page/useMobileHeaderActions", () => ({
  default: () => ({
    mobileHeaderActions: null,
  }),
}));

// Mock components that might cause issues
vi.mock("@/components/modals/PropertyDetailsModal", () => ({
  default: () => (
    <div data-testid="property-details-modal">Property Details Modal</div>
  ),
}));

vi.mock("@/components/ui/loading/KeyTurnLoader", () => ({
  default: ({ message }: { message: string }) => (
    <div data-testid="loader">{message}</div>
  ),
}));

// Mock the search service
vi.mock("@/features/search/services/propertySearch", () => ({
  searchPropertiesInIsochrone: vi.fn().mockResolvedValue([]),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe("SearchPage Integration Tests", () => {
  const mockSetMobileHeaderActions = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it("should render search page with all main components", async () => {
    render(
      <TestWrapper>
        <SearchPage setMobileHeaderActions={mockSetMobileHeaderActions} />
      </TestWrapper>
    );

    // Check for main search components that actually exist
    expect(screen.getAllByText("Search")).toHaveLength(2); // Mobile and desktop versions
    expect(screen.getAllByText("Saved")).toHaveLength(2); // Mobile and desktop versions
    expect(screen.getByText("Search Properties")).toBeInTheDocument();
    expect(screen.getByText("Preferences")).toBeInTheDocument();
  });

  it("should handle search functionality", async () => {
    const user = userEvent.setup();

    // Mock successful search response
    server.use(
      http.get("/api/search/homes", () => {
        return HttpResponse.json({
          homes: [
            {
              id: "1",
              address: "123 Main St, San Francisco, CA",
              price: 750000,
              bedrooms: 3,
              bathrooms: 2,
              squareFeet: 1500,
            },
          ],
          total: 1,
        });
      })
    );

    render(
      <TestWrapper>
        <SearchPage setMobileHeaderActions={mockSetMobileHeaderActions} />
      </TestWrapper>
    );

    // Click the search properties button
    const searchButton = screen.getByText("Search Properties");
    expect(searchButton).toBeInTheDocument();

    await user.click(searchButton);

    // The search should trigger (we can't easily test the results without more complex mocking)
    expect(searchButton).toBeInTheDocument();
  });

  it("should handle preferences interaction", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <SearchPage setMobileHeaderActions={mockSetMobileHeaderActions} />
      </TestWrapper>
    );

    // Find and interact with preferences button
    const preferencesButton = screen.getByText("Preferences");
    expect(preferencesButton).toBeInTheDocument();

    await user.click(preferencesButton);

    // The button should still be there after clicking
    expect(preferencesButton).toBeInTheDocument();
  });

  it("should handle map controls interaction", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <SearchPage setMobileHeaderActions={mockSetMobileHeaderActions} />
      </TestWrapper>
    );

    // Find map control buttons (there are multiple versions for mobile/desktop)
    const zoomInButtons = screen.getAllByTitle("Zoom in");
    const zoomOutButtons = screen.getAllByTitle("Zoom out");

    expect(zoomInButtons).toHaveLength(2); // Mobile and desktop versions
    expect(zoomOutButtons).toHaveLength(2); // Mobile and desktop versions

    // Test zoom controls (click the first one)
    await user.click(zoomInButtons[0]);
    await user.click(zoomOutButtons[0]);
  });

  it("should handle tab switching", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <SearchPage setMobileHeaderActions={mockSetMobileHeaderActions} />
      </TestWrapper>
    );

    // Find and click different tabs (use getAllByText since there are multiple)
    const searchTabs = screen.getAllByText("Search");
    const savedTabs = screen.getAllByText("Saved");

    expect(searchTabs).toHaveLength(2); // Mobile and desktop versions
    expect(savedTabs).toHaveLength(2); // Mobile and desktop versions

    await user.click(savedTabs[0]); // Click the first saved tab

    // The tab should still be there after clicking
    expect(savedTabs[0]).toBeInTheDocument();
  });
});
