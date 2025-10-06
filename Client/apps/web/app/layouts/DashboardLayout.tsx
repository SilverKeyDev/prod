// React imports
import React, { useState, useMemo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import MobileTopBar from "../../components/widgets/header/MobileTopBar";
import PageHeader from "../../components/widgets/header/PageHeader.tsx";
import MobileSidebar from "../../components/widgets/sidebar/MobileSidebar.tsx";
import Sidebar from "../../components/widgets/sidebar/Sidebar.tsx";
import type { UserProfile } from "../../../../packages/schemas/user";
import DashboardButtonHeader from "../../features/dashboard/DashboardButtonHeader.tsx";

import BuyerChecklists from "../../pages/BuyerChecklists.tsx";
import DashboardPage from "../../pages/Dashboard.tsx";

import NegotiationStrategy from "../../pages/Negotiation.tsx";

import PersonalizationPage from "../../pages/PersonalizationPage.tsx";
import SavedHomes from "../../pages/Saved.tsx";
import SearchPage from "../../pages/SearchPage.tsx";
import {
  useViewStore,
  type ViewState,
} from "../../../../packages/store/view.slice";
import {
  getTabByPath,
  SIDEBAR_TABS,
} from "../../../../packages/schemas/sidebar";

type HeaderConfig = {
  type: "rheader" | "none";
  title?: string;
  subtitle?: string;
};

type ClosePageHeaderData = {
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  loading: boolean;
};

type DashboardProps = {
  user?: UserProfile;
  onLogout: () => void;
  header?: HeaderConfig;
  mobileHeader?: React.ReactNode; // Allow passing a custom mobile header
  maxWidth?: number; // Percentage value (e.g., 85 for 85%)
};

// Page-specific width configuration
type PageWidthConfig = {
  [path: string]: number; // Percentage values
};

const PAGE_WIDTH_CONFIG: PageWidthConfig = {
  "/search": 100,
  "/compare-reports": 90,
  "/generate-report": 75,
  "/dashboard": 100,
  "/buyer-checklists": 100,
};

export default function DashboardLayout({
  user,
  onLogout,
  header,
  mobileHeader,
  maxWidth = 85, // Default to 85% if not specified
}: DashboardProps) {
  const [mobileHeaderActions, setMobileHeaderActions] =
    useState<ReactNode | null>(null);
  const [closePageHeaderData, setClosePageHeaderData] =
    useState<ClosePageHeaderData | null>(null);
  const sidebarExpanded = useViewStore((s: ViewState) => s.sidebarExpanded);
  const setSidebarExpanded = useViewStore(
    (s: ViewState) => s.setSidebarExpanded
  );
  const location = useLocation();

  // Get page-specific width configuration based on current route
  const getPageWidth = (): number => {
    const path = location.pathname;

    // Find matching page configuration
    const configPath = Object.keys(PAGE_WIDTH_CONFIG).find((configPath) =>
      path.startsWith(configPath)
    );

    // Use page-specific width or default to maxWidth (defaulting to 85)
    return configPath ? PAGE_WIDTH_CONFIG[configPath] : maxWidth || 85;
  };

  const config = useMemo(() => {
    const path = location.pathname;
    if (header) return header;

    if (path.startsWith("/reports")) {
      return {
        type: "rheader",
        title: "Past Reports",
        subtitle: "View and manage your previous property reports",
      };
    } else if (path.startsWith("/search")) {
      const tab = getTabByPath(path);
      return { type: "none", title: tab?.name ?? "Search" };
    } else if (path.startsWith("/ai-assistant")) {
      return { type: "none", title: "AI Assistant" };
    } else if (path.startsWith("/personalization")) {
      const tab = getTabByPath(path);
      return {
        type: "rheader",
        title: tab?.name ?? "Personalization",
        subtitle: tab?.description ?? "Customize your home search preferences",
      };
    } else if (path.startsWith("/negotiation-strategy")) {
      const tab = getTabByPath(path);
      return {
        type: "rheader",
        title: tab?.name ?? "Negotiation Strategy",
        subtitle:
          tab?.description ?? "Develop winning strategies for your offers",
      };
    } else if (path.startsWith("/buyer-checklists")) {
      return {
        type: "rheader",
        title: SIDEBAR_TABS.close.name,
        subtitle: SIDEBAR_TABS.close.description,
      };
    } else if (path.startsWith("/draft-offer")) {
      return {
        type: "rheader",
        title: "Draft Offer",
        subtitle: "Create compelling offers for your target properties",
      };
    } else if (path.startsWith("/subscription")) {
      return {
        type: "rheader",
        title: "Subscription",
        subtitle: "Manage your SilverKey membership and billing",
      };
    } else if (
      path.startsWith("/agent-connection") ??
      path.startsWith("/client-information")
    ) {
      return {
        type: "rheader",
        title: "Agent Connection",
        subtitle: "Connect with real estate professionals",
      };
    } else if (path.startsWith("/saved")) {
      return {
        type: "none",
      };
    } else if (path.startsWith("/compare-reports")) {
      return {
        type: "rheader",
        title: "Compare Reports",
        subtitle: "Side-by-side analysis of multiple properties",
      };
    } else {
      const tab = getTabByPath(path);
      return { type: "none", title: tab?.name ?? "Dashboard" };
    }
  }, [location.pathname, header]);

  const headerContent = useMemo(() => {
    const path = location.pathname;

    // For the dashboard, use DashboardButtonHeader
    if (path.startsWith("/dashboard")) {
      return (
        <DashboardButtonHeader
          variant="horizontal"
          completedStepKey={undefined}
        />
      );
    }

    // For buyer-checklists, use titles/descriptions from sidebar schema
    if (path.startsWith("/buyer-checklists")) {
      return (
        <PageHeader
          title={SIDEBAR_TABS.close.name}
          subtitle={SIDEBAR_TABS.close.description}
        />
      );
    }

    if (config?.type === "rheader" && config.title) {
      return <PageHeader title={config.title} subtitle={config.subtitle} />;
    }
    return null;
  }, [config, closePageHeaderData, location.pathname]);

  const mobileHeaderContent = useMemo(() => {
    const path = location.pathname;

    // Always prioritize actions if they are set
    if (mobileHeaderActions) {
      return mobileHeaderActions;
    }

    // For the dashboard, use DashboardButtonHeader on mobile
    if (path.startsWith("/dashboard")) {
      return (
        <DashboardButtonHeader
          variant="horizontal"
          completedStepKey={undefined}
        />
      );
    }

    // For buyer-checklists, use titles from sidebar schema
    if (path.startsWith("/buyer-checklists")) {
      return <PageHeader title={SIDEBAR_TABS.close.name} />;
    }

    // For personalization, ensure no other header content is shown when actions are not present
    if (path === "/personalization") {
      return null;
    }

    // Prioritize the explicitly passed mobileHeader component for other pages
    if (mobileHeader) {
      return mobileHeader;
    }

    // Mobile overrides - defined inside useMemo to avoid dependency issues
    const mobileOverrides: { [key: string]: React.ReactNode } = {
      // Example: "/search": <SearchHeaderComponent />,
    };

    const override = Object.keys(mobileOverrides).find((key) =>
      path.startsWith(key)
    );
    if (override) return mobileOverrides[override];

    if (config?.title) {
      return <PageHeader title={config.title} />;
    }

    return null;
  }, [
    location.pathname,
    config,
    mobileHeader,
    mobileHeaderActions,
    closePageHeaderData,
  ]);

  return (
    <div className="flex min-h-screen bg-off-white">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar
          user={user}
          onLogout={onLogout}
          expanded={sidebarExpanded}
          onToggleExpanded={() => setSidebarExpanded(!sidebarExpanded)}
          isMobile={false}
          onLinkClick={undefined}
        />
      </div>

      {/* Mobile Sidebar - Hidden on desktop */}
      <div className="block lg:hidden">
        <MobileSidebar
          user={user}
          onLogout={onLogout}
          expanded={sidebarExpanded}
          onToggleExpanded={() => setSidebarExpanded(!sidebarExpanded)}
        />
      </div>

      <main
        className={`ml-0 flex-1 transition-all duration-200 ${
          sidebarExpanded ? "lg:ml-64" : "lg:ml-16"
        }`}
      >
        {/* Mobile Header - Hidden on desktop */}
        <div className="lg:hidden">
          <MobileTopBar sidebarExpanded={sidebarExpanded}>
            <div className="flex flex-grow items-center justify-center text-center">
              {mobileHeaderContent}
            </div>
          </MobileTopBar>
          {/* Spacer div to prevent content from being covered by fixed MobileTopBar */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              sidebarExpanded ? "h-0" : "h-20"
            }`}
          />
        </div>

        {/* Desktop Header Rendering with consistent width - Hidden on mobile */}
        {!location.pathname.startsWith("/search") && (
          <div
            className={`hidden lg:block mx-auto w-full ${
              location.pathname.startsWith("/saved") ? "" : "pt-8"
            }`}
            style={{
              maxWidth: `${getPageWidth()}vw`,
            }}
          >
            {headerContent}
          </div>
        )}

        {/* Content area with centralized width parameter */}
        <div
          className={`mx-auto w-full ${
            location.pathname.startsWith("/search")
              ? "h-[calc(100vh-80px)] lg:h-[calc(100vh-0px)]" // Full height for search page
              : location.pathname.startsWith("/buyer-checklists")
                ? "" // No padding for buyer checklists page
                : "p-4 sm:p-6 lg:p-8 mt-4 lg:mt-0 lg:pt-8"
          }`}
          style={{
            maxWidth: `${getPageWidth()}vw`,
          }}
        >
          {location.pathname.startsWith("/search") && (
            <SearchPage setMobileHeaderActions={setMobileHeaderActions} />
          )}
          {location.pathname.startsWith("/personalization") && (
            <PersonalizationPage
              setMobileHeaderActions={setMobileHeaderActions}
            />
          )}
          {location.pathname.startsWith("/negotiation-strategy") && (
            <NegotiationStrategy />
          )}
          {location.pathname.startsWith("/buyer-checklists") && (
            <BuyerChecklists setClosePageHeaderData={setClosePageHeaderData} />
          )}
          {location.pathname.startsWith("/saved") && <SavedHomes />}
          {location.pathname.startsWith("/dashboard") && <DashboardPage />}
        </div>
      </main>
    </div>
  );
}
