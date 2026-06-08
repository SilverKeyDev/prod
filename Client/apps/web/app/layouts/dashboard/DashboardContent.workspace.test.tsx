import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseActiveWorkspace = vi.fn(() => "buyer" as const);
const mockUseDashboardRoute = vi.fn();

vi.mock("packages/hooks/store", () => ({
  useActiveWorkspace: () => mockUseActiveWorkspace(),
}));

vi.mock("packages/features/workspace", () => ({
  WorkspacePlaceholderPage: ({ workspace }: { workspace: string }) => (
    <div
      data-testid={
        workspace === "integration_partner"
          ? "workspace-shell-integration-partner"
          : `workspace-shell-${workspace}`
      }
    />
  ),
}));

vi.mock("./useDashboardRoute", () => ({
  useDashboardRoute: (...args: unknown[]) => mockUseDashboardRoute(...args),
}));

vi.mock("@/pages/property/SearchPage", () => ({ default: () => <div>SearchPage</div> }));
vi.mock("@/pages/property/LibraryPage", () => ({ default: () => <div>LibraryPage</div> }));
vi.mock("@/pages/account/ProfilePage", () => ({ default: () => <div>ProfilePage</div> }));
vi.mock("@/pages/workspace/BrokerageDashboardPage", () => ({
  default: () => <div data-testid="workspace-shell-brokerage">Brokerage</div>,
}));
vi.mock("@/pages/workspace/IntegrationPartnerDashboardPage", () => ({
  default: () => <div data-testid="workspace-shell-integration-partner">Integration partner</div>,
}));
vi.mock("@/pages/workspace/SellerDashboardPage", () => ({
  default: () => <div data-testid="workspace-shell-seller">Seller</div>,
}));
vi.mock("@/pages/workspace/DashboardPage", () => ({
  default: () => <div data-testid="workspace-shell-buyer">Buyer</div>,
}));
vi.mock("@/pages/workspace/AgentPage", () => ({ default: () => <div>AgentPage</div> }));
import { DashboardContent } from "./DashboardContent";

describe("DashboardContent workspace shells", () => {
  beforeEach(() => {
    mockUseDashboardRoute.mockReturnValue({
      activeKey: "dashboard",
      isSearch: false,
      isMessaging: false,
      widthPercent: 85,
      isDashboard: true,
      isProfile: false,
      isLibrary: false,
      isAgreementSigningComplete: false,
      pathname: "/dashboard",
    });
  });

  it("renders buyer dashboard shell by default", async () => {
    mockUseActiveWorkspace.mockReturnValue("buyer");
    render(<DashboardContent />);
    expect(await screen.findByTestId("workspace-shell-buyer")).toBeTruthy();
  });

  it("renders seller dashboard shell when activeWorkspace is seller", async () => {
    mockUseActiveWorkspace.mockReturnValue("seller");
    render(<DashboardContent />);
    expect(await screen.findByTestId("workspace-shell-seller")).toBeTruthy();
  });

  it("renders brokerage dashboard shell when activeWorkspace is brokerage", async () => {
    mockUseActiveWorkspace.mockReturnValue("brokerage");
    render(<DashboardContent />);
    expect(await screen.findByTestId("workspace-shell-brokerage")).toBeTruthy();
  });

  it("renders integration partner dashboard shell when activeWorkspace is integration_partner", async () => {
    mockUseActiveWorkspace.mockReturnValue("integration_partner");
    render(<DashboardContent />);
    expect(await screen.findByTestId("workspace-shell-integration-partner")).toBeTruthy();
  });

  it("renders placeholder shell for blocked routes when workspace is a placeholder", async () => {
    mockUseActiveWorkspace.mockReturnValue("seller");
    mockUseDashboardRoute.mockReturnValue({
      activeKey: "search",
      isSearch: true,
      isMessaging: false,
      widthPercent: 85,
      isDashboard: false,
      isProfile: false,
      isLibrary: false,
      isAgreementSigningComplete: false,
      pathname: "/search",
    });
    render(
      <DashboardContent searchPageRef={{ current: null }} setMobileHeaderActions={() => {}} />
    );
    expect(await screen.findByTestId("workspace-shell-seller")).toBeTruthy();
    expect(screen.queryByText("SearchPage")).toBeNull();
  });
});
