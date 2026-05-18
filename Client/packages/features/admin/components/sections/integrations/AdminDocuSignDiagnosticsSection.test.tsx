import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminDocuSignDiagnosticsSection } from "./AdminDocuSignDiagnosticsSection";

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({
    t: (key: string) => key,
  }),
}));

const { oauthStart } = vi.hoisted(() => ({
  oauthStart: vi.fn(),
}));

vi.mock("packages/api/admin", () => ({
  adminApi: {
    docusignOAuthStart: oauthStart,
    docusignListTemplates: vi.fn(),
    docusignSyncTemplates: vi.fn(),
  },
}));

vi.mock("packages/logger", () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    security: vi.fn(),
  },
  LOG_CATEGORIES: {
    API: "API",
    ERRORS: "ERRORS",
  },
}));

describe("AdminDocuSignDiagnosticsSection", () => {
  it("prompts non-agents to enable agent mode", () => {
    render(<AdminDocuSignDiagnosticsSection isAgent={false} />);
    expect(screen.getByText(/Turn on "Agent" above/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Start DocuSign OAuth/i })).toBeNull();
  });

  it("shows DocuSign actions for agents", () => {
    render(<AdminDocuSignDiagnosticsSection isAgent />);
    expect(screen.getByRole("button", { name: /Start DocuSign OAuth/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /List templates/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Queue template sync/i })).toBeTruthy();
  });

  it("starts OAuth and displays returned auth URL", async () => {
    oauthStart.mockResolvedValueOnce({ auth_url: "https://auth.example/oauth" });
    render(<AdminDocuSignDiagnosticsSection isAgent />);
    fireEvent.click(screen.getByRole("button", { name: /Start DocuSign OAuth/i }));
    await waitFor(() => {
      expect(screen.getByText("https://auth.example/oauth")).toBeTruthy();
    });
    expect(oauthStart).toHaveBeenCalledOnce();
  });
});
