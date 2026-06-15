import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminUserSystemRolesSection } from "./AdminUserSystemRolesSection";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
});

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({
    t: (key: string) => key,
  }),
}));

const mutateAsync = vi.fn();

vi.mock("packages/features/admin/hooks/data/useUpdateUserSystemRolesMutation", () => ({
  useUpdateUserSystemRolesMutation: () => ({
    mutateAsync,
    isPending: false,
  }),
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
    SECURITY: "SECURITY",
    ERRORS: "ERRORS",
  },
}));

describe("AdminUserSystemRolesSection", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    mutateAsync.mockResolvedValue({ user_id: "target", gate_roles: ["admin"] });
  });

  it("requires target user id", async () => {
    render(<AdminUserSystemRolesSection />);
    fireEvent.click(screen.getByRole("button", { name: /apply role intents/i }));
    expect(await screen.findByText("Enter a target user ID.")).toBeTruthy();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("requires confirmation checkbox", async () => {
    render(<AdminUserSystemRolesSection />);
    fireEvent.change(screen.getByLabelText(/target user id/i), { target: { value: "user-99" } });
    fireEvent.click(screen.getByRole("button", { name: /apply role intents/i }));
    expect(
      await screen.findByText(/confirm that role changes should be executed against this uuid/i)
    ).toBeTruthy();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("requires at least one grant or revoke", async () => {
    render(<AdminUserSystemRolesSection />);
    fireEvent.change(screen.getByLabelText(/target user id/i), { target: { value: "user-99" } });
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /confirm applying role intents/i,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: /apply role intents/i }));
    expect(await screen.findByText(/choose at least one "grant" or "revoke"/i)).toBeTruthy();
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Admin role intent, Leave as-is" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Super admin role intent, Leave as-is" })
    ).toBeTruthy();
  });

  it("submits grant payload when admin grant is selected", async () => {
    render(<AdminUserSystemRolesSection />);
    fireEvent.change(screen.getByLabelText(/target user id/i), { target: { value: "user-99" } });
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /confirm applying role intents/i,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "Admin role intent, Leave as-is" }));
    fireEvent.click(screen.getByRole("option", { name: "Grant" }));
    fireEvent.click(screen.getByRole("button", { name: /apply role intents/i }));
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        user_id: "user-99",
        grant: ["admin"],
        revoke: [],
      });
    });
  });
});
