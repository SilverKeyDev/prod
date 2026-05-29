import React from "react";

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FindingHome from "./FindingHome";
import { hasFindingHomeAddressChanges } from "./findingHomeAddressChanges";

const mutate = vi.fn();
const setQueryData = vi.fn();
let mockSavedAddress: { address: string } | null = null;
let capturedFieldProps: Record<string, unknown> | null = null;

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    setQueryData,
    getQueryData: () => mockSavedAddress,
  }),
  useQuery: () => ({
    data: mockSavedAddress,
    isLoading: false,
  }),
  useMutation: (options: {
    mutationFn: unknown;
    onSuccess?: (data: { address: string }) => void;
  }) => ({
    mutate: (payload: unknown) => {
      mutate(payload);
      options.onSuccess?.({ address: "123 Main St, San Francisco, CA 94102" });
    },
    isPending: false,
    isError: false,
    error: null,
  }),
}));

vi.mock("packages/store", () => ({
  useGoogleMapsStore: () => ({ isLoaded: true }),
}));

vi.mock("packages/ui/components", () => ({
  GooglePlacesAutocompleteField: (props: Record<string, unknown>) => {
    capturedFieldProps = props;
    return (
      <input
        data-testid="google-places-field"
        value={String(props.value ?? "")}
        onChange={(e) => (props.onChange as (v: string) => void)(e.target.value)}
      />
    );
  },
}));

vi.mock("packages/features/checklists/components/steps/ChecklistStepSubmitFooter", () => ({
  ChecklistStepSubmitFooter: ({
    disabled,
    onSubmit,
  }: {
    disabled?: boolean;
    onSubmit?: () => void;
  }) => (
    <button type="button" disabled={disabled} onClick={onSubmit}>
      Submit step
    </button>
  ),
}));

vi.mock("packages/ui/components/cards/Card", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("packages/ui/components/primitives", () => ({
  Box: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  Text: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span className={className}>{children}</span>
  ),
}));

describe("hasFindingHomeAddressChanges", () => {
  it("returns false when current address is empty", () => {
    expect(hasFindingHomeAddressChanges("", { address: "123 Main" })).toBe(false);
    expect(hasFindingHomeAddressChanges("   ", null)).toBe(false);
  });

  it("returns true when there is no saved address yet", () => {
    expect(hasFindingHomeAddressChanges("123 Main", null)).toBe(true);
    expect(hasFindingHomeAddressChanges("123 Main", { address: "" })).toBe(true);
  });

  it("returns false when trimmed current matches saved", () => {
    expect(hasFindingHomeAddressChanges("123 Main", { address: "123 Main" })).toBe(false);
    expect(hasFindingHomeAddressChanges(" 123 Main ", { address: "123 Main" })).toBe(false);
  });

  it("returns true when trimmed current differs from saved", () => {
    expect(hasFindingHomeAddressChanges("456 Oak", { address: "123 Main" })).toBe(true);
  });
});

describe("FindingHome", () => {
  beforeEach(() => {
    mockSavedAddress = null;
    capturedFieldProps = null;
    mutate.mockClear();
    setQueryData.mockClear();
  });

  it("renders intro copy and Google Places field with scriptsReady", () => {
    render(<FindingHome />);
    expect(
      screen.getByText("Enter the address of the home you want to make an offer on")
    ).toBeTruthy();
    expect(screen.getByTestId("google-places-field")).toBeTruthy();
    expect(capturedFieldProps?.scriptsReady).toBe(true);
  });

  it("wraps the address field with bottom margin", () => {
    const { container } = render(<FindingHome />);
    const marginBox = container.querySelector(".mb-4");
    expect(marginBox).toBeTruthy();
    expect(marginBox?.querySelector('[data-testid="google-places-field"]')).toBeTruthy();
  });

  it("hydrates saved address from query", () => {
    mockSavedAddress = { address: "456 Oak Ave" };
    render(<FindingHome />);
    expect(capturedFieldProps?.value).toBe("456 Oak Ave");
  });

  it("disables submit when address is empty", () => {
    render(<FindingHome />);
    const submit = screen.getByRole("button", { name: "Submit step" });
    expect((submit as HTMLButtonElement).disabled).toBe(true);
  });

  it("saves trimmed address and calls onComplete on submit", async () => {
    const onComplete = vi.fn();
    const onSave = vi.fn();
    render(<FindingHome onComplete={onComplete} onSave={onSave} />);

    fireEvent.change(screen.getByTestId("google-places-field"), {
      target: { value: "123 Main St" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit step" }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({ address: "123 Main St" });
    });
    expect(onSave).toHaveBeenCalledWith("123 Main St, San Francisco, CA 94102");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("disables submit when hydrated address matches saved", () => {
    mockSavedAddress = { address: "456 Oak Ave" };
    render(<FindingHome />);
    const submit = screen.getByRole("button", { name: "Submit step" });
    expect((submit as HTMLButtonElement).disabled).toBe(true);
  });

  it("enables submit after editing a previously saved address", () => {
    mockSavedAddress = { address: "456 Oak Ave" };
    render(<FindingHome />);
    fireEvent.change(screen.getByTestId("google-places-field"), {
      target: { value: "789 Pine Rd" },
    });
    const submit = screen.getByRole("button", { name: "Submit step" });
    expect((submit as HTMLButtonElement).disabled).toBe(false);
  });

  it("re-submits updated address without calling onComplete again", async () => {
    mockSavedAddress = { address: "456 Oak Ave" };
    const onComplete = vi.fn();
    const onSave = vi.fn();
    render(<FindingHome onComplete={onComplete} onSave={onSave} />);

    fireEvent.change(screen.getByTestId("google-places-field"), {
      target: { value: "789 Pine Rd" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit step" }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({ address: "789 Pine Rd" });
    });
    expect(onSave).toHaveBeenCalledWith("123 Main St, San Francisco, CA 94102");
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("passes structured payload when onSelect provides place data", async () => {
    render(<FindingHome />);
    fireEvent.change(screen.getByTestId("google-places-field"), {
      target: { value: "123 Main St" },
    });
    await act(async () => {
      (capturedFieldProps?.onSelect as (data: Record<string, string>) => void)?.({
        address: "123 Main St, San Francisco, CA 94102",
        place_id: "places/abc",
        street: "123 Main St",
        city: "San Francisco",
        state: "CA",
        postal_code: "94102",
        country: "US",
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "Submit step" }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        address: "123 Main St, San Francisco, CA 94102",
        place_id: "places/abc",
        street: "123 Main St",
        city: "San Francisco",
        state: "CA",
        postal_code: "94102",
        country: "US",
      });
    });
  });
});
