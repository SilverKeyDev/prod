import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminDevDataResetSection } from "./AdminDevDataResetSection";

const mutateAsync = vi.fn();

vi.mock("packages/config/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("packages/config/env")>();
  return {
    ...actual,
    isDevelopment: true,
  };
});

vi.mock("packages/hooks/data/admin/useResetDevUserDataMutation", () => ({
  useResetDevUserDataMutation: () => ({
    mutateAsync,
    isPending: false,
  }),
}));

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "admin.dev_reset.scope_profile": "Profile",
        "admin.dev_reset.scope_preferences": "Preferences",
        "admin.dev_reset.scope_docusign": "DocuSign",
        "admin.dev_reset.ack_label": "Acknowledge",
        "admin.dev_reset.reset_button": "Reset selected data",
        "admin.dev_reset.success": "Reset {scopes} for user {userId}.",
        "admin.dev_reset.title": "Reset test data",
        "admin.dev_reset.description": "Desc",
        "admin.dev_reset.warning": "Warn",
        "admin.dev_reset.target_user_id_label": "Target user ID",
        "admin.dev_reset.target_user_id_placeholder": "UUID",
        "admin.dev_reset.target_user_id_hint": "Hint",
      };
      return map[key] ?? key;
    },
  }),
}));

const authState = {
  user: {
    id: "admin-1",
    roles: ["admin"] as string[],
  },
};

vi.mock("packages/store", () => ({
  useAuthStore: (sel: (s: typeof authState) => unknown) => sel(authState),
}));

describe("AdminDevDataResetSection", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    authState.user.roles = ["admin"];
    mutateAsync.mockResolvedValue({
      target_user_id: "admin-1",
      cleared: { preferences: true },
    });
  });

  it("resets self without user_id when not superadmin", async () => {
    render(<AdminDevDataResetSection />);
    fireEvent.click(screen.getByLabelText("Preferences"));
    fireEvent.click(screen.getByLabelText("Acknowledge"));
    fireEvent.click(screen.getByRole("button", { name: "Reset selected data" }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        scopes: ["preferences"],
        userId: undefined,
      });
    });
    expect(screen.queryByLabelText("Target user ID")).toBeNull();
  });

  it("shows target user id for superadmin and sends it when set", async () => {
    authState.user.roles = ["super_admin"];
    render(<AdminDevDataResetSection />);
    expect(screen.getByLabelText("Target user ID")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Target user ID"), {
      target: { value: "other-uuid" },
    });
    fireEvent.click(screen.getByLabelText("Profile"));
    fireEvent.click(screen.getByLabelText("Acknowledge"));
    fireEvent.click(screen.getByRole("button", { name: "Reset selected data" }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        scopes: ["profile"],
        userId: "other-uuid",
      });
    });
  });
});
