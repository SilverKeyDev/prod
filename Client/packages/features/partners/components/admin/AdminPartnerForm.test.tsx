import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
});

import type { PartnerCreateRequest } from "packages/features/partners/api/partners";

import { AdminPartnerForm } from "./AdminPartnerForm";

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({ t: (key: string) => key }),
}));

vi.mock("packages/features/partners/components/admin/PartnerLogoUpload", () => ({
  PartnerLogoUpload: () => <div data-testid="partner-logo-upload" />,
}));

const baseInitial: PartnerCreateRequest = {
  name: "Move Concierge",
  slug: "move-concierge",
  destination_url_template: "https://example.com/{transaction_id}",
  target_roles: ["agent"],
  step_ids: [],
  payout_type: "on_click",
  payout_per_conversion: 25,
};

const steps = [{ step_id: "closing:13", label: "Move Concierge", section: "closing" }];

describe("AdminPartnerForm", () => {
  it("hides checklist step picker when only non-checklist roles are selected", () => {
    render(
      <AdminPartnerForm initial={baseInitial} steps={steps} onCancel={vi.fn()} onSubmit={vi.fn()} />
    );

    expect(screen.queryByText("partners.admin.form.steps")).toBeNull();
  });

  it("shows checklist step picker when buyer or seller is selected", () => {
    render(
      <AdminPartnerForm
        initial={{ ...baseInitial, target_roles: ["buyer"], step_ids: ["closing:13"] }}
        steps={steps}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText("partners.admin.form.steps")).toBeTruthy();
  });

  it("reveals step picker after adding a checklist role", () => {
    render(
      <AdminPartnerForm initial={baseInitial} steps={steps} onCancel={vi.fn()} onSubmit={vi.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Select workspace.switcher.buyer" }));

    expect(screen.getByText("partners.admin.form.steps")).toBeTruthy();
  });

  it("renders placement preview card with partner name", () => {
    render(
      <AdminPartnerForm
        initial={{ ...baseInitial, target_roles: ["buyer"], step_ids: ["closing:13"] }}
        steps={steps}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText("partners.admin.form.preview")).toBeTruthy();
    expect(screen.getByText("Move Concierge")).toBeTruthy();
  });
});
