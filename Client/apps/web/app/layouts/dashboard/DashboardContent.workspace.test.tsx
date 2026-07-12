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
vi.mock("@/pages/workspace/BrokerageCampaignsPage", () => ({
  default: () => <div data-testid="workspace-shell-campaigns">Campaigns</div>,
}));
vi.mock("@/pages/workspace/IntegrationPartnerDashboardPage", () => ({
  default: () => <div data-testid="workspace-shell-integration-partner">Integration partner</div>,
}));
vi.mock("@/pages/workspace/SellerDashboardPage", () => ({
  default: () => <div data-testid="workspace-shell-seller">Seller</div>,
}));
vi.mock("@/pages/workspace/RenterDashboardPage", () => ({
  default: () => <div data-testid="workspace-shell-renter">Renter</div>,
}));
vi.mock("@/pages/workspace/DashboardPage", () => ({
  default: () => <div data-testid="workspace-shell-buyer">Buyer</div>,
}));
vi.mock("@/pages/workspace/AgentPage", () => ({ default: () => <div>AgentPage</div> }));
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
  };
});
import { DashboardContent } from "./DashboardContent";

describe("DashboardContent workspace shells", () => {
  beforeEach(() => {
    mockUseDashboardRoute.mockReturnValue({
      activeKey: "dashboard",
      isSearch: false,
      isInventory: false,
      isCampaigns: false,
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

  it("renders renter dashboard shell when activeWorkspace is renter", async () => {
    mockUseActiveWorkspace.mockReturnValue("renter");
    render(<DashboardContent />);
    expect(await screen.findByTestId("workspace-shell-renter")).toBeTruthy();
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

  it("buyer /search mounts SearchPage", async () => {
    mockUseActiveWorkspace.mockReturnValue("buyer");
    mockUseDashboardRoute.mockReturnValue({
      activeKey: "search",
      isSearch: true,
      isInventory: false,
      isCampaigns: false,
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
    expect(await screen.findByText("SearchPage")).toBeTruthy();
  });

  it("agent /search mounts SearchPage", async () => {
    mockUseActiveWorkspace.mockReturnValue("agent");
    mockUseDashboardRoute.mockReturnValue({
      activeKey: "search",
      isSearch: true,
      isInventory: false,
      isCampaigns: false,
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
    expect(await screen.findByText("SearchPage")).toBeTruthy();
  });

  it("brokerage /search redirects to /dashboard", async () => {
    mockUseActiveWorkspace.mockReturnValue("brokerage");
    mockUseDashboardRoute.mockReturnValue({
      activeKey: "search",
      isSearch: true,
      isInventory: false,
      isCampaigns: false,
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
    expect(await screen.findByTestId("navigate")).toHaveTextContent("/dashboard");
  });

  it("brokerage /inventory redirects to /dashboard", async () => {
    mockUseActiveWorkspace.mockReturnValue("brokerage");
    mockUseDashboardRoute.mockReturnValue({
      activeKey: "inventory",
      isSearch: false,
      isInventory: true,
      isCampaigns: false,
      isMessaging: false,
      widthPercent: 100,
      isDashboard: false,
      isProfile: false,
      isLibrary: false,
      isAgreementSigningComplete: false,
      pathname: "/inventory",
    });
    render(
      <DashboardContent searchPageRef={{ current: null }} setMobileHeaderActions={() => {}} />
    );
    expect(await screen.findByTestId("navigate")).toHaveTextContent("/dashboard");
  });

  it("brokerage /campaigns mounts Campaigns shell", async () => {
    mockUseActiveWorkspace.mockReturnValue("brokerage");
    mockUseDashboardRoute.mockReturnValue({
      activeKey: "campaigns",
      isSearch: false,
      isInventory: false,
      isCampaigns: true,
      isMessaging: false,
      widthPercent: 90,
      isDashboard: false,
      isProfile: false,
      isLibrary: false,
      isAgreementSigningComplete: false,
      pathname: "/campaigns",
    });
    render(
      <DashboardContent searchPageRef={{ current: null }} setMobileHeaderActions={() => {}} />
    );
    expect(await screen.findByTestId("workspace-shell-campaigns")).toBeTruthy();
  });
});
