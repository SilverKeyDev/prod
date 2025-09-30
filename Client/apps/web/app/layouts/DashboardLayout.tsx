// React imports
import React, { useState, useMemo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

// Types
// Context and hooks
// Layout components
import MobileTopBar from "../../components/widgets/header/MobileTopBar";
import PageHeader from "../../components/widgets/header/PageHeader.tsx";
import MobileSidebar from "../../components/widgets/sidebar/MobileSidebar.tsx";
import Sidebar from "../../components/widgets/sidebar/Sidebar.tsx";
// import useMobile from '../../../../packages/hooks/ui/useMobile';
import type { UserProfile } from "../../../../packages/schemas/user";
// Feature components
import ClosePageHeader from "../../features/close/ClosePageHeader.tsx";
import TimelineChecklist from "../../features/dashboard/DashboardButtonHeader.tsx";
// Page components - Dashboard
// Page components - Search
// Page components - Decide
import BuyerChecklists from "../../pages/Close/BuyerChecklists.tsx";
import ClosingMovingIn from "../../pages/Close/ClosingMovingIn.tsx";
import EscrowLegalLogistics from "../../pages/Close/EscrowLegalLogistics.tsx";
import FinancingInsurance from "../../pages/Close/FinancingInsurance.tsx";
import InspectionsDueDiligence from "../../pages/Close/InspectionsDueDiligence.tsx";
import DashboardPage from "../../pages/Dashboard.tsx";
import AIAssistant from "../../pages/Decide/AIAssistant.tsx";
import CompareReportsPage from "../../pages/Decide/CompareReportsPage.tsx";
import GenerateReportPage from "../../pages/Decide/GenerateReportPage.tsx";
import PastReports from "../../pages/Decide/PastReports.tsx";
// Page components - Negotiate
import NegotiationStrategy from "../../pages/Negotiate/NegotiationStrategy.tsx";
// import OfferDraftPage from "../../pages/Negotiate/OfferDraftPage"; // File deleted
// Page components - Close
// Page components - Onboard
import PersonalizationPage from "../../pages/Onboard/PersonalizationPage.tsx";
import SavedHomes from "../../pages/Search/SavedHomes.tsx";
import SearchPage from "../../pages/Search/SearchPage.tsx";
import { useViewStore } from "../../../../packages/store/view.slice";

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
  const sidebarExpanded = useViewStore((s) => s.sidebarExpanded);
  const setSidebarExpanded = useViewStore((s) => s.setSidebarExpanded);
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

    if (path.startsWith("/buyer-checklists")) {
      return { type: "none", title: "Buyer Checklists" };
    } else if (path.startsWith("/close/escrow-legal-logistics")) {
      return { type: "none", title: "Escrow & Legal" };
    } else if (path.startsWith("/close/inspections-due-diligence")) {
      return { type: "none", title: "Inspections" };
    } else if (path.startsWith("/close/financing-insurance")) {
      return { type: "none", title: "Financing & Insurance" };
    } else if (path.startsWith("/close/closing-moving-in")) {
      return { type: "none", title: "Closing" };
    } else if (path.startsWith("/generate-report")) {
      return {
        type: "rheader",
        title: "Generate Report",
        subtitle: "Create comprehensive property analysis reports",
      };
    } else if (path.startsWith("/reports")) {
      return {
        type: "rheader",
        title: "Past Reports",
        subtitle: "View and manage your previous property reports",
      };
    } else if (path.startsWith("/search")) {
      return { type: "none", title: "Search" };
    } else if (path.startsWith("/ai-assistant")) {
      return { type: "none", title: "AI Assistant" };
    } else if (path.startsWith("/personalization")) {
      return {
        type: "rheader",
        title: "Personalization",
        subtitle: "Customize your home search preferences",
      };
    } else if (path.startsWith("/negotiation-strategy")) {
      return {
        type: "rheader",
        title: "Negotiation Strategy",
        subtitle: "Develop winning strategies for your offers",
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
        type: "rheader",
        title: "Saved Homes",
        subtitle: "Your bookmarked properties and favorites",
      };
    } else if (path.startsWith("/compare-reports")) {
      return {
        type: "rheader",
        title: "Compare Reports",
        subtitle: "Side-by-side analysis of multiple properties",
      };
    } else {
      return { type: "none", title: "Dashboard" };
    }
  }, [location.pathname, header]);

  const headerContent = useMemo(() => {
    const path = location.pathname;

    // Use ClosePageHeader for Close pages
    if (
      closePageHeaderData &&
      ((path.startsWith("/close/escrow-legal-logistics") ||
        path.startsWith("/close/inspections-due-diligence")) ??
        (path.startsWith("/close/financing-insurance") ||
          path.startsWith("/close/closing-moving-in")))
    ) {
      return (
        <ClosePageHeader
          title={closePageHeaderData.title}
          subtitle={closePageHeaderData.subtitle}
          completedCount={closePageHeaderData.completedCount}
          totalCount={closePageHeaderData.totalCount}
          loading={closePageHeaderData.loading}
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

    // Check for Close pages first - render ClosePageHeader if data is available
    if (
      closePageHeaderData &&
      ((path.startsWith("/close/escrow-legal-logistics") ||
        path.startsWith("/close/inspections-due-diligence")) ??
        (path.startsWith("/close/financing-insurance") ||
          path.startsWith("/close/closing-moving-in")))
    ) {
      return (
        <ClosePageHeader
          title={closePageHeaderData.title}
          subtitle={closePageHeaderData.subtitle}
          completedCount={closePageHeaderData.completedCount}
          totalCount={closePageHeaderData.totalCount}
          loading={closePageHeaderData.loading}
        />
      );
    }

    // For the dashboard, use the timeline checklist as the header
    if (path.startsWith("/dashboard")) {
      return (
        <TimelineChecklist variant="horizontal" completedStepKey="search" />
      );
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
          <div className="hidden pt-8 lg:block">{headerContent}</div>
        )}

        {/* Content area with centralized width parameter */}
        <div
          className={`mx-auto w-full ${
            location.pathname.startsWith("/search")
              ? "h-[calc(100vh-80px)] lg:h-[calc(100vh-0px)]" // Full height for search page
              : location.pathname.startsWith("/buyer-checklists")
                ? "" // No padding for buyer checklists page
                : `p-4 sm:p-6 lg:p-8 mt-4 lg:mt-0 ${
                    (location.pathname.startsWith(
                      "/close/escrow-legal-logistics"
                    ) ??
                    location.pathname.startsWith(
                      "/close/inspections-due-diligence"
                    ) ??
                    (location.pathname.startsWith(
                      "/close/financing-insurance"
                    ) ||
                      location.pathname.startsWith("/close/closing-moving-in")))
                      ? ""
                      : "lg:pt-8"
                  }`
          }`}
          style={{
            maxWidth: `${getPageWidth()}vw`,
          }}
        >
          {/* Render component based on current path */}
          {location.pathname.startsWith("/generate-report") && (
            <GenerateReportPage />
          )}
          {location.pathname.startsWith("/reports") && <PastReports />}
          {location.pathname.startsWith("/compare-reports") && (
            <CompareReportsPage />
          )}
          {location.pathname.startsWith("/search") && (
            <SearchPage setMobileHeaderActions={setMobileHeaderActions} />
          )}
          {location.pathname.startsWith("/ai-assistant") && <AIAssistant />}
          {location.pathname.startsWith("/personalization") && (
            <PersonalizationPage
              setMobileHeaderActions={setMobileHeaderActions}
            />
          )}
          {location.pathname.startsWith("/negotiation-strategy") && (
            <NegotiationStrategy />
          )}
          {location.pathname.startsWith("/buyer-checklists") && (
            <BuyerChecklists />
          )}
          {location.pathname.startsWith("/close/escrow-legal-logistics") && (
            <EscrowLegalLogistics
              setClosePageHeaderData={setClosePageHeaderData}
            />
          )}
          {location.pathname.startsWith("/close/inspections-due-diligence") && (
            <InspectionsDueDiligence
              setClosePageHeaderData={setClosePageHeaderData}
            />
          )}
          {location.pathname.startsWith("/close/financing-insurance") && (
            <FinancingInsurance
              setClosePageHeaderData={setClosePageHeaderData}
            />
          )}
          {location.pathname.startsWith("/close/closing-moving-in") && (
            <ClosingMovingIn setClosePageHeaderData={setClosePageHeaderData} />
          )}
          {location.pathname.startsWith("/saved") && <SavedHomes />}
          {location.pathname.startsWith("/dashboard") && <DashboardPage />}
        </div>
      </main>
    </div>
  );
}
