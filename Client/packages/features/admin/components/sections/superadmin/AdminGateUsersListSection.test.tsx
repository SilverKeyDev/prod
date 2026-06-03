import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminGateUsersListSection } from "./AdminGateUsersListSection";

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

vi.mock("packages/ui/components/modals", () => ({
  ConfirmationDialog: ({
    isOpen,
    title,
    message,
    confirmText,
    onConfirm,
    onCancel,
  }: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) =>
    isOpen ? (
      <div role="alertdialog">
        <h2>{title}</h2>
        <p>{message}</p>
        <button type="button" onClick={onConfirm}>
          {confirmText ?? "Confirm"}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    ) : null,
}));

vi.mock("packages/ui/components/modals/BaseModal", () => ({
  default: ({
    isOpen,
    title,
    children,
  }: {
    isOpen: boolean;
    title?: string;
    children: ReactNode;
  }) =>
    isOpen ? (
      <div role="dialog">
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

const mutateAsync = vi.fn();

vi.mock("packages/hooks/data/admin/useAdminGateUsersList", () => ({
  useAdminGateUsersList: () => ({
    data: {
      admins: [
        {
          user_id: "user-1",
          email: "alice@example.com",
          name: "Alice Admin",
          gate_roles: ["admin"],
        },
      ],
    },
    isLoading: false,
    error: null,
  }),
}));

vi.mock("packages/hooks/data/admin/useUpdateUserSystemRolesMutation", () => ({
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

describe("AdminGateUsersListSection", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    mutateAsync.mockResolvedValue({ user_id: "user-1", gate_roles: [] });
  });

  it("renders existing admins", () => {
    render(<AdminGateUsersListSection />);
    expect(screen.getByText("Alice Admin")).toBeTruthy();
    expect(screen.getByText("alice@example.com")).toBeTruthy();
    expect(screen.getByText("admin")).toBeTruthy();
  });

  it("opens edit modal and submits revoke payload", async () => {
    render(<AdminGateUsersListSection />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(await screen.findByText(/edit gate roles/i)).toBeTruthy();

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /confirm applying role intents/i,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "Admin role intent, Leave as-is" }));
    fireEvent.click(screen.getByRole("option", { name: "Revoke" }));
    fireEvent.click(screen.getByRole("button", { name: /apply changes/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        user_id: "user-1",
        grant: [],
        revoke: ["admin"],
      });
    });
  });

  it("removes all gate roles after confirmation", async () => {
    render(<AdminGateUsersListSection />);
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove access" }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        user_id: "user-1",
        grant: [],
        revoke: ["admin"],
      });
    });
  });
});
