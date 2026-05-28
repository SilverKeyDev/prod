import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminPartnersManageTab } from "./AdminPartnersManageTab";

const mockDelete = vi.fn();
const mockPartners = [
  {
    id: "p1",
    name: "Acme",
    slug: "acme",
    step_ids: ["closing:13"],
    is_active: true,
    total_clicks: 0,
  },
];

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const map: Record<string, string> = {
        "partners.admin.tab.manage": "Manage partners",
        "partners.admin.add_partner": "Add partner",
        "partners.admin.cancel": "Cancel",
        "partners.admin.table.name": "Name",
        "partners.admin.table.slug": "Slug",
        "partners.admin.table.step": "Steps",
        "partners.admin.table.clicks": "Clicks",
        "partners.admin.table.ctr": "CTR",
        "partners.admin.table.active": "Active",
        "partners.admin.deactivate": "Deactivate",
        "partners.admin.delete": "Delete",
        "partners.admin.delete_confirm_title": "Delete partner?",
        "partners.admin.delete_confirm_message": `Delete ${params?.name ?? ""}?`,
      };
      return map[key] ?? key;
    },
  }),
}));

vi.mock("packages/features/partners/hooks/useAdminPartners", () => ({
  useAdminPartnersList: () => ({ data: mockPartners, isLoading: false }),
  usePartnerChecklistSteps: () => ({ data: [] }),
  useCreatePartner: () => ({ mutateAsync: vi.fn() }),
  useUpdatePartner: () => ({ mutateAsync: vi.fn() }),
  useTogglePartnerActive: () => ({ mutate: vi.fn(), isPending: false }),
  useDeletePartner: () => ({
    mutateAsync: mockDelete,
    isPending: false,
  }),
}));

vi.mock("packages/features/partners/api/partners", () => ({
  partnersApi: { uploadPartnerLogo: vi.fn() },
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
      <div role="alertdialog" aria-label={title}>
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

describe("AdminPartnersManageTab", () => {
  it("opens confirmation dialog and deletes partner on confirm", async () => {
    mockDelete.mockResolvedValue(undefined);
    render(<AdminPartnersManageTab />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toBeTruthy();
    expect(screen.getByText(/Delete Acme/)).toBeTruthy();

    fireEvent.click(
      Array.from(dialog.querySelectorAll("button")).find((btn) => btn.textContent === "Delete")!
    );

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith("p1");
    });
  });
});
