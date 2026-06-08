import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminDevPersonaSection } from "./AdminDevPersonaSection";

const mutateAsync = vi.fn();

vi.mock("packages/hooks/data/admin/useOpenDevAccountSessionMutation", () => ({
  useOpenDevAccountSessionMutation: () => ({
    mutateAsync,
    isPending: false,
  }),
}));

vi.mock("packages/hooks/data/admin/useResetDevUserDataMutation", () => ({
  useResetDevUserDataMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({ t: (key: string) => key }),
}));

const authState = {
  user: {
    id: "u1",
    email: "a@b.c",
    name: "Test",
    is_active: true,
    is_agent: false,
    has_preferences: false,
    roles: ["buyer"],
  },
};

const markServerIdentityTouched = vi.fn();

vi.mock("packages/store", () => ({
  useAuthStore: (sel: (s: typeof authState) => unknown) => sel(authState),
  useDevAppPersonaStore: (
    sel: (s: { markServerIdentityTouched: typeof markServerIdentityTouched }) => unknown
  ) => sel({ markServerIdentityTouched }),
}));

describe("AdminDevPersonaSection", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    mutateAsync.mockResolvedValue({ id: "u1", is_agent: true, roles: ["agent"] });
    authState.user.is_agent = false;
    authState.user.roles = ["buyer"];
  });

  it("renders all workspace persona buttons", () => {
    render(<AdminDevPersonaSection />);
    expect(screen.getByRole("button", { name: "workspace.switcher.buyer" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "workspace.switcher.seller" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "workspace.switcher.agent" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "workspace.switcher.brokerage" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "workspace.switcher.integration_partner" })
    ).toBeTruthy();
  });

  it("opens an agent dev account tab when Agent is chosen", async () => {
    render(<AdminDevPersonaSection />);
    fireEvent.click(screen.getByRole("button", { name: "workspace.switcher.agent" }));
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith("agent");
    });
  });

  it("opens a seller dev account tab when Seller is chosen", async () => {
    render(<AdminDevPersonaSection />);
    fireEvent.click(screen.getByRole("button", { name: "workspace.switcher.seller" }));
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith("seller");
    });
  });

  it("opens buyer even when the current admin profile looks buyer-like", async () => {
    render(<AdminDevPersonaSection />);
    fireEvent.click(screen.getByRole("button", { name: "workspace.switcher.buyer" }));
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith("buyer");
    });
  });

  it("shows error text when mutation rejects", async () => {
    mutateAsync.mockRejectedValueOnce(new Error("network down"));
    render(<AdminDevPersonaSection />);
    fireEvent.click(screen.getByRole("button", { name: "workspace.switcher.agent" }));
    await waitFor(() => {
      expect(screen.getByText("network down")).toBeTruthy();
    });
  });
});
