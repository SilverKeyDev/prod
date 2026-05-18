import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ChecklistUpdatePendingProvider } from "packages/features/checklists/components/roadmap/ChecklistUpdatePendingProvider";

import {
  ChecklistStepHeaderSubmitButton,
  ChecklistStepSubmitProvider,
} from "./ChecklistStepSubmitContext";
import { ChecklistStepSubmitFooter } from "./ChecklistStepSubmitFooter";

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({
    t: (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key,
  }),
}));

vi.mock("packages/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("packages/ui")>();
  return {
    ...actual,
    Button: ({
      disabled,
      onPress,
      children,
      label,
    }: {
      disabled?: boolean;
      onPress?: () => void;
      children?: React.ReactNode;
      label?: string;
    }) => (
      <button type="button" disabled={disabled} onClick={onPress}>
        {label ?? children}
      </button>
    ),
  };
});

function expectSubmitDisabled(button: HTMLElement, disabled: boolean) {
  expect((button as HTMLButtonElement).disabled).toBe(disabled);
}

function SubmitHarness({
  markCompleteEligible = true,
  formComplete = true,
  onSubmit = vi.fn(),
  integrationVisible = true,
  checklistPending = false,
}: {
  markCompleteEligible?: boolean;
  formComplete?: boolean;
  onSubmit?: () => void;
  integrationVisible?: boolean;
  checklistPending?: boolean;
}) {
  return (
    <ChecklistUpdatePendingProvider value={checklistPending}>
      <ChecklistStepSubmitProvider markCompleteEligible={markCompleteEligible}>
        <ChecklistStepHeaderSubmitButton integrationVisible={integrationVisible} />
        <ChecklistStepSubmitFooter disabled={!formComplete} onSubmit={onSubmit} />
      </ChecklistStepSubmitProvider>
    </ChecklistUpdatePendingProvider>
  );
}

describe("ChecklistStepSubmitFooter", () => {
  it("disables submit when the integration form is incomplete", () => {
    render(<SubmitHarness formComplete={false} markCompleteEligible={true} />);
    const buttons = screen.getAllByRole("button", { name: "Submit" });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
    for (const btn of buttons) {
      expectSubmitDisabled(btn, true);
    }
  });

  it("disables submit when markCompleteEligible is false even if the form is complete", () => {
    render(<SubmitHarness formComplete={true} markCompleteEligible={false} />);
    const buttons = screen.getAllByRole("button", { name: "Submit" });
    for (const btn of buttons) {
      expectSubmitDisabled(btn, true);
    }
  });

  it("enables submit when the form is complete and the step may be marked checked", () => {
    render(<SubmitHarness formComplete={true} markCompleteEligible={true} />);
    const buttons = screen.getAllByRole("button", { name: "Submit" });
    for (const btn of buttons) {
      expectSubmitDisabled(btn, false);
    }
  });

  it("invokes onSubmit from footer and header when submit is clicked", async () => {
    const onSubmit = vi.fn();
    render(<SubmitHarness onSubmit={onSubmit} />);

    const buttons = screen.getAllByRole("button", { name: "Submit" });
    fireEvent.click(buttons[0]!);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    fireEvent.click(buttons[1]!);
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it("disables submit while a checklist PUT is pending", async () => {
    render(<SubmitHarness checklistPending={true} />);
    await waitFor(() => {
      const buttons = screen.getAllByRole("button", { name: "Submit" });
      for (const btn of buttons) {
        expectSubmitDisabled(btn, true);
      }
    });
  });
});

describe("ChecklistStepHeaderSubmitButton", () => {
  it("renders nothing when integration is not visible", () => {
    render(<SubmitHarness integrationVisible={false} />);
    expect(screen.queryAllByRole("button", { name: "Submit" })).toHaveLength(1);
  });
});
