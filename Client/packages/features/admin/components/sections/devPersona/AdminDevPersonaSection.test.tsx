import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminDevPersonaSection } from "./AdminDevPersonaSection";

const mutateAsync = vi.fn();

vi.mock("packages/hooks/data/admin/useSetCurrentUserAgentStatusMutation", () => ({
  useSetCurrentUserAgentStatusMutation: () => ({
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
    has_subscription: false,
    subscription: null,
    has_preferences: false,
    roles: ["buyer"],
  },
};

const setActivePersona = vi.fn();

vi.mock("packages/store", () => ({
  useAuthStore: (sel: (s: typeof authState) => unknown) => sel(authState),
  useDevAppPersonaStore: (sel: (s: { setActivePersona: typeof setActivePersona }) => unknown) =>
    sel({ setActivePersona }),
}));

describe("AdminDevPersonaSection", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    setActivePersona.mockReset();
    mutateAsync.mockResolvedValue({ id: "u1", is_agent: true });
  });

  it("calls mutation and setActivePersona when a persona is chosen", async () => {
    render(<AdminDevPersonaSection />);
    fireEvent.click(screen.getByRole("button", { name: "admin.dev_persona.persona_agent" }));
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ is_agent: true });
      expect(setActivePersona).toHaveBeenCalledWith("agent");
    });
  });

  it("maps buyer and seller to is_agent false", async () => {
    render(<AdminDevPersonaSection />);
    fireEvent.click(screen.getByRole("button", { name: "admin.dev_persona.persona_seller" }));
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ is_agent: false });
      expect(setActivePersona).toHaveBeenCalledWith("seller");
    });
  });

  it("shows error text when mutation rejects", async () => {
    mutateAsync.mockRejectedValueOnce(new Error("network down"));
    render(<AdminDevPersonaSection />);
    fireEvent.click(screen.getByRole("button", { name: "admin.dev_persona.persona_broker" }));
    await waitFor(() => {
      expect(screen.getByText("network down")).toBeTruthy();
    });
  });
});
