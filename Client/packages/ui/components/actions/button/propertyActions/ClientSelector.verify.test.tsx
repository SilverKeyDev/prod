import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setPlatformGlobals } from "packages/utils/core/platform";

import ClientSelector from "./ClientSelector";

// Minimal provider/store/hook stubs so we can render the real component + real Popover/Portal.
vi.mock("packages/contexts", () => ({
  useLocalization: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => {
      if (key === "client_selector.me") return "Me";
      if (key === "client_selector.select_client") return opts?.defaultValue ?? "Select client";
      return opts?.defaultValue ?? key;
    },
  }),
}));

vi.mock("packages/hooks/store", () => ({
  useIsAgent: () => true,
}));

vi.mock("packages/store", () => ({
  useAuthStore: (selector: (s: { authReady: boolean }) => unknown) => selector({ authReady: true }),
}));

vi.mock("@/features/agent/hooks/data/clients/useAgentClients", () => ({
  useAgentClients: () => ({
    clients: [
      { id: "c1", name: "Alice Buyer", email: "alice@example.com" },
      { id: "c2", name: "Bob Buyer", email: "bob@example.com" },
    ],
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve(),
  }),
}));

describe("ClientSelector (SIL-10 regression)", () => {
  beforeEach(() => {
    setPlatformGlobals({
      window,
      document,
      navigator: window.navigator,
      fetch: globalThis.fetch,
      Blob: globalThis.Blob,
      File: globalThis.File,
    });
  });

  it("opens the menu in a portal outside the overflow-clipping toolbar and selects a client", async () => {
    const onClientChange = vi.fn();

    const { getByTestId } = render(
      // Replicates the mobile library toolbar that clips absolute children.
      <div data-testid="toolbar" className="overflow-x-auto" style={{ width: 200, height: 44 }}>
        <ClientSelector selectedClientId={null} onClientChange={onClientChange} />
      </div>
    );

    const toolbar = getByTestId("toolbar");

    // Closed initially.
    expect(screen.queryByText("Alice Buyer")).toBeNull();

    // Open via the trigger button.
    fireEvent.click(screen.getByRole("button", { name: /Me/i }));

    // Menu content is now visible (portaled to document.body after layout)...
    const aliceRow = await waitFor(() => screen.getByText("Alice Buyer"));
    expect(aliceRow).toBeTruthy();

    // ...and it is NOT nested inside the overflow-x-auto toolbar (it is portaled to <body>),
    // which is exactly why it is no longer clipped on mobile.
    expect(toolbar.contains(aliceRow)).toBe(false);
    expect(document.body.contains(aliceRow)).toBe(true);

    // The portaled panel is a dialog rendered at the document level.
    const dialog = screen.getByRole("dialog");
    expect(toolbar.contains(dialog)).toBe(false);

    // Selecting a client fires the change and closes the menu.
    fireEvent.click(screen.getByText("Bob Buyer"));
    expect(onClientChange).toHaveBeenCalledWith("c2");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });
});
