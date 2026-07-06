import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminIntegrationsSection } from "./AdminIntegrationsSection";

vi.mock("./BrokerageIdPicker", () => ({
  BrokerageIdPicker: ({ onSelect }: { onSelect: (brokerageId: string) => void }) => (
    <button type="button" data-testid="pick-brokerage" onClick={() => onSelect("brokerage-1")}>
      Pick brokerage
    </button>
  ),
}));

vi.mock("./SkySlopeCredentialPanel", () => ({
  SkySlopeCredentialPanel: ({ brokerageId }: { brokerageId: string }) => (
    <div data-testid="skyslope-panel">{brokerageId}</div>
  ),
}));

describe("AdminIntegrationsSection", () => {
  it("shows SkySlope panel after brokerage selection", () => {
    render(<AdminIntegrationsSection />);
    expect(screen.queryByTestId("skyslope-panel")).toBeNull();
    fireEvent.click(screen.getByTestId("pick-brokerage"));
    expect(screen.getByTestId("skyslope-panel").textContent).toBe("brokerage-1");
  });
});
