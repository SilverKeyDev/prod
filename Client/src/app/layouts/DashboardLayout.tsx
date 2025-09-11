// React imports
import { useState, useMemo, ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";

// Types
import { UserProfile } from "../../types/user";

// Context and hooks
import { useAgent } from "../../context/AgentContext";
import useMobile from "../../hooks/useMobile";

// Layout components
import Sidebar from "../../widgets/sidebar/Sidebar";
import MobileSidebar from "../../widgets/sidebar/MobileSidebar";
import PageHeader from "../../widgets/header/PageHeader";
import MobileTopBar from "../../widgets/header/MobileTopBar";

// Feature components
import TimelineChecklist from "../../features/dashboard/DashboardButtonHeader";
import ClosePageHeader from "../../features/close/ClosePageHeader";

// Page components - Dashboard
import DashboardPage from "../../pages/Dashboard";

// Page components - Search
import SearchPage from "../../pages/Search/SearchPage";
import SavedHomes from "../../pages/Search/SavedHomes";

// Page components - Decide
import GenerateReportPage from "../../pages/Decide/GenerateReportPage";
import PastReports from "../../pages/Decide/PastReports";
import CompareReportsPage from "../../pages/Decide/CompareReportsPage";
import AIAssistant from "../../pages/Decide/AIAssistant";

// Page components - Negotiate
import OfferDraftPage from "../../pages/Negotiate/OfferDraftPage";
import NegotiationStrategy from "../../pages/Negotiate/NegotiationStrategy";

// Page components - Close
import EscrowLegalLogistics from "../../pages/Close/EscrowLegalLogistics";
import InspectionsDueDiligence from "../../pages/Close/InspectionsDueDiligence";
import FinancingInsurance from "../../pages/Close/FinancingInsurance";
import ClosingMovingIn from "../../pages/Close/ClosingMovingIn";

// Page components - Onboard
import PersonalizationPage from "../../pages/Onboard/PersonalizationPage";
import Subscription from "../../pages/Onboard/Subscription";

interface HeaderConfig {
  type: "rheader" | "none";
  title?: string;
  subtitle?: string;
}

interface ClosePageHeaderData {
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  loading: boolean;
}

interface DashboardProps {
  user?: UserProfile;
  onLogout: () => void;
  header?: HeaderConfig;
  mobileHeader?: React.ReactNode; // Allow passing a custom mobile header
  maxWidth?: number; // Percentage value (e.g., 85 for 85%)
}

// Page-specific width configuration
interface PageWidthConfig {
  [path: string]: number; // Percentage values
}

const PAGE_WIDTH_CONFIG: PageWidthConfig = {
  "/search": 100,
  "/compare-reports": 90,
  "/generate-report": 75,
  "/dashboard": 100,
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
  const isMobile = useMobile();
  const [sidebarExpanded, setSidebarExpanded] = useState(!isMobile); // Default to collapsed on mobile, expanded on desktop
  const location = useLocation();
  const { getAgentConnectionComponent } = useAgent();

  // Update sidebar state when switching between mobile and desktop
  useEffect(() => {
    setSidebarExpanded(!isMobile);
  }, [isMobile]);

  // Get page-specific width configuration based on current route
  const getPageWidth = (): number => {
    const path = location.pathname;

    // Find matching page configuration
    const configPath = Object.keys(PAGE_WIDTH_CONFIG).find((configPath) =>
      path.startsWith(configPath),
    );

    // Use page-specific width or default to maxWidth (defaulting to 85)
    return configPath ? PAGE_WIDTH_CONFIG[configPath] : maxWidth || 85;
  };

  const config = useMemo(() => {
    const path = location.pathname;
    if (header) return header;

    if (path.startsWith("/escrow-legal-logistics")) {
      return { type: "none", title: "Escrow & Legal" };
    } else if (path.startsWith("/inspections-due-diligence")) {
      return { type: "none", title: "Inspections" };
    } else if (path.startsWith("/financing-insurance")) {
      return { type: "none", title: "Financing & Insurance" };
    } else if (path.startsWith("/closing-moving-in")) {
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
      path.startsWith("/agent-connection") ||
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
      (path.startsWith("/escrow-legal-logistics") ||
        path.startsWith("/inspections-due-diligence") ||
        path.startsWith("/financing-insurance") ||
        path.startsWith("/closing-moving-in"))
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

  const mobileOverrides: { [key: string]: React.ReactNode } = {
    // Example: "/search": <SearchHeaderComponent />,
  };

  const mobileHeaderContent = useMemo(() => {
    const path = location.pathname;

    // Always prioritize actions if they are set
    if (mobileHeaderActions) {
      return mobileHeaderActions;
    }

    // Check for Close pages first - render ClosePageHeader if data is available
    if (
      closePageHeaderData &&
      (path.startsWith("/escrow-legal-logistics") ||
        path.startsWith("/inspections-due-diligence") ||
        path.startsWith("/financing-insurance") ||
        path.startsWith("/closing-moving-in"))
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

    const override = Object.keys(mobileOverrides).find((key) =>
      path.startsWith(key),
    );
    if (override) return mobileOverrides[override];

    if (config?.title) {
      return <PageHeader title={config.title} />;
    }

    return null;
  }, [
    location.pathname,
    config,
    mobileOverrides,
    mobileHeader,
    mobileHeaderActions,
    closePageHeaderData,
  ]);

  return (
    <div className="min-h-screen bg-off-white flex">
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
        className={`flex-1 transition-all duration-200 ml-0 ${
          sidebarExpanded ? "lg:ml-64" : "lg:ml-16"
        }`}
      >
        {/* Mobile Header - Hidden on desktop */}
        <div className="lg:hidden">
          <MobileTopBar sidebarExpanded={sidebarExpanded}>
            <div className="flex-grow text-center flex items-center justify-center">
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
          <div className="hidden lg:block pt-8">{headerContent}</div>
        )}

        {/* Content area with centralized width parameter */}
        <div
          className={`mx-auto w-full ${
            location.pathname.startsWith("/search")
              ? "h-[calc(100vh-80px)] lg:h-[calc(100vh-0px)]" // Full height for search page
              : `p-4 sm:p-6 lg:p-8 ${
                  location.pathname.startsWith("/escrow-legal-logistics") ||
                  location.pathname.startsWith("/inspections-due-diligence") ||
                  location.pathname.startsWith("/financing-insurance") ||
                  location.pathname.startsWith("/closing-moving-in")
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
          {location.pathname.startsWith("/subscription") && <Subscription />}
          {(location.pathname.startsWith("/client-information") ||
            location.pathname.startsWith("/agent-connection")) &&
            getAgentConnectionComponent()}
          {location.pathname.startsWith("/draft-offer") && <OfferDraftPage />}
          {location.pathname.startsWith("/negotiation-strategy") && (
            <NegotiationStrategy />
          )}
          {location.pathname.startsWith("/escrow-legal-logistics") && (
            <EscrowLegalLogistics
              setClosePageHeaderData={setClosePageHeaderData}
            />
          )}
          {location.pathname.startsWith("/inspections-due-diligence") && (
            <InspectionsDueDiligence
              setClosePageHeaderData={setClosePageHeaderData}
            />
          )}
          {location.pathname.startsWith("/financing-insurance") && (
            <FinancingInsurance
              setClosePageHeaderData={setClosePageHeaderData}
            />
          )}
          {location.pathname.startsWith("/closing-moving-in") && (
            <ClosingMovingIn setClosePageHeaderData={setClosePageHeaderData} />
          )}
          {location.pathname.startsWith("/saved") && <SavedHomes />}
          {location.pathname.startsWith("/dashboard") && <DashboardPage />}
        </div>
      </main>
    </div>
  );
}
