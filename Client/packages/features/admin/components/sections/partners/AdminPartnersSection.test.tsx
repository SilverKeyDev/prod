import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminPartnersSection } from "./AdminPartnersSection";

vi.mock("packages/features/partners", () => ({
  AdminPartnersManageTab: () => <div data-testid="partners-manage" />,
  AdminPartnersAnalyticsTab: () => <div data-testid="partners-analytics" />,
}));

describe("AdminPartnersSection", () => {
  it("renders manage and analytics sections together", () => {
    render(<AdminPartnersSection />);
    expect(screen.getByTestId("partners-manage")).toBeTruthy();
    expect(screen.getByTestId("partners-analytics")).toBeTruthy();
  });
});
