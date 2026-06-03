import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminLoggingSections } from "./AdminLoggingSections";

vi.mock("packages/hooks/data/admin/useAdminLoggerConfig", () => ({
  useAdminLoggerConfig: () => ({
    config: {
      client: {
        polling: false,
        pages: false,
        hooks: false,
        auth: false,
        http: false,
        api: { initialLoad: false, polling: false, pageMount: false, other: false },
        errors: true,
        security: true,
        search: false,
        feed: false,
        logLevel: "ERROR",
      },
      server: {
        polling: true,
        pages: true,
        hooks: true,
        auth: true,
        http: true,
        api: true,
        errors: true,
        security: true,
        search: false,
        feed: false,
        logLevel: "INFO",
      },
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useUpdateAdminLoggerConfig: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

vi.mock("./AdminBackendLoggerSection", () => ({
  AdminBackendLoggerSection: () => <div data-testid="admin-backend-logger" />,
}));

vi.mock("./AdminFrontendLoggerSection", () => ({
  AdminFrontendLoggerSection: () => <div data-testid="admin-frontend-logger" />,
}));

describe("AdminLoggingSections", () => {
  it("renders frontend and backend logger sections", () => {
    render(<AdminLoggingSections />);
    expect(screen.getByTestId("admin-frontend-logger")).toBeTruthy();
    expect(screen.getByTestId("admin-backend-logger")).toBeTruthy();
  });
});
