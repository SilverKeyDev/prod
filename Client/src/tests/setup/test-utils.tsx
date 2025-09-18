import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { RenderOptions } from "@testing-library/react";
import { render } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactElement } from "react";
import React from "react";
import { BrowserRouter } from "react-router-dom";

import { server } from "../__mocks__/server";


// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
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

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };

// Helper function to render with specific providers
export const renderWithRouter = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      {children}
    </BrowserRouter>
  );
  return render(ui, { wrapper: Wrapper, ...options });
};

export const renderWithQueryClient = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => {
  const queryClient = new QueryClient({
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

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(ui, { wrapper: Wrapper, ...options });
};

// Mock server utilities
export const mockServerError = (endpoint: string, status: number = 500) => {
  server.use(
    http.get(endpoint, () => {
      return new Response(null, { status });
    })
  );
};

export const mockServerSuccess = (endpoint: string, data: any) => {
  server.use(
    http.get(endpoint, () => {
      return HttpResponse.json(data);
    })
  );
};

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: "1",
  email: "test@example.com",
  name: "Test User",
  preferences: {
    budget: { min: 300000, max: 800000 },
    location: "San Francisco, CA",
    propertyType: "house",
  },
  ...overrides,
});

export const createMockHome = (overrides = {}) => ({
  id: "1",
  address: "123 Main St, San Francisco, CA",
  price: 750000,
  bedrooms: 3,
  bathrooms: 2,
  squareFeet: 1500,
  yearBuilt: 2010,
  description: "Beautiful family home in prime location",
  images: ["https://example.com/image1.jpg"],
  features: ["garage", "garden", "updated kitchen"],
  ...overrides,
});

export const createMockReport = (overrides = {}) => ({
  id: "1",
  homeId: "1",
  title: "Property Analysis Report",
  content: "Detailed analysis of property value and market conditions",
  createdAt: "2024-01-15T10:00:00Z",
  ...overrides,
});
