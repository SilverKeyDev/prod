import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
});

import { ChecklistStepPicker } from "./ChecklistStepPicker";

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({ t: (key: string) => key }),
}));

const steps = [
  { step_id: "search:5", section: "search", item_id: 5, label: "Set a budget" },
  { step_id: "closing:13", section: "closing", item_id: 13, label: "Move Concierge" },
];

describe("ChecklistStepPicker", () => {
  it("shows section and step dropdowns for buyer role", () => {
    render(
      <ChecklistStepPicker steps={steps} targetRoles={["buyer"]} value={[]} onChange={vi.fn()} />
    );

    expect(screen.getByText("partners.admin.form.section")).toBeTruthy();
    expect(screen.queryByText("partners.admin.form.step")).toBeNull();
  });

  it("reveals step dropdown after section is selected", () => {
    render(
      <ChecklistStepPicker steps={steps} targetRoles={["buyer"]} value={[]} onChange={vi.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: /partners.admin.form.section/i }));
    fireEvent.click(screen.getByRole("option", { name: "Move In" }));

    expect(screen.getByText("partners.admin.form.step")).toBeTruthy();
  });

  it("adds a selected step to the value list", () => {
    const onChange = vi.fn();
    render(
      <ChecklistStepPicker steps={steps} targetRoles={["buyer"]} value={[]} onChange={onChange} />
    );

    fireEvent.click(screen.getByRole("button", { name: /partners.admin.form.section/i }));
    fireEvent.click(screen.getByRole("option", { name: "Move In" }));
    fireEvent.click(screen.getByRole("button", { name: /partners.admin.form.step/i }));
    fireEvent.click(screen.getByRole("option", { name: "Move Concierge" }));
    fireEvent.click(screen.getByRole("button", { name: "partners.admin.form.add_step" }));

    expect(onChange).toHaveBeenCalledWith(["closing:13"]);
  });
});
