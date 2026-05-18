import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminPartnersSection } from "./AdminPartnersSection";

vi.mock(
  "packages/features/admin/components/sections/integrations/AdminDocuSignDiagnosticsSection",
  () => ({
    AdminDocuSignDiagnosticsSection: ({ isAgent }: { isAgent: boolean }) => (
      <div data-testid="docusign-diagnostics" data-agent={String(isAgent)} />
    ),
  })
);

const authState = {
  user: {
    id: "u1",
    email: "a@b.c",
    name: "Test",
    is_active: true,
    is_agent: true,
    has_subscription: false,
    subscription: null,
    has_preferences: false,
  },
};

vi.mock("packages/store", () => ({
  useAuthStore: (sel: (s: typeof authState) => unknown) => sel(authState),
}));

describe("AdminPartnersSection", () => {
  it("passes is_agent into DocuSign diagnostics", () => {
    render(<AdminPartnersSection />);
    const el = screen.getByTestId("docusign-diagnostics");
    expect(el).toBeTruthy();
    expect(el.getAttribute("data-agent")).toBe("true");
  });
});
