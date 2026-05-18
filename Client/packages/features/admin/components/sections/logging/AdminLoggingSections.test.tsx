import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminLoggingSections } from "./AdminLoggingSections";

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
