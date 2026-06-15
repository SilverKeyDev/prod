import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminDevPersonaSection } from "./AdminDevPersonaSection";

const mutateAsync = vi.fn();

vi.mock("packages/features/admin/hooks/data/useSetCurrentUserDevWorkspaceMutation", () => ({
  useSetCurrentUserDevWorkspaceMutation: () => ({
    mutateAsync,
    isPending: false,
  }),
}));

vi.mock("packages/features/admin/hooks/data/useResetDevUserDataMutation", () => ({
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
    mutateAsync.mockResolvedValue({ id: "u1", roles: ["agent"] });
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

  it("sets agent persona when Agent is chosen", async () => {
    render(<AdminDevPersonaSection />);
    fireEvent.click(screen.getByRole("button", { name: "workspace.switcher.agent" }));
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ workspace: "agent" });
    });
  });

  it("sets seller persona when Seller is chosen", async () => {
    render(<AdminDevPersonaSection />);
    fireEvent.click(screen.getByRole("button", { name: "workspace.switcher.seller" }));
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ workspace: "seller" });
    });
  });

  it("skips mutation when persona already matches", async () => {
    render(<AdminDevPersonaSection />);
    fireEvent.click(screen.getByRole("button", { name: "workspace.switcher.buyer" }));
    await waitFor(() => {
      expect(mutateAsync).not.toHaveBeenCalled();
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
