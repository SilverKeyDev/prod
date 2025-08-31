import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileSidebar from "./MobileSidebar";
import { useAgent } from "../../context/AgentContext";
import PageHeader from "../ui/base/PageHeader";
// import { useNotifications } from "../../context";
import GenerateReportPage from "../../pages/Decide/GenerateReportPage.tsx";
import PastReports from "../../pages/Decide/PastReports.tsx";
import CompareReportsPage from "../../pages/Decide/CompareReportsPage.tsx";
import SearchPage from "../../pages/Search/SearchPage.tsx";
import PersonalizationPage from "../../pages/Onboard/PersonalizationPage.tsx";
import Subscription from "../../pages/Onboard/Subscription.tsx";
import AIAssistant from "../../pages/Decide/AIAssistant.tsx";
import OfferDraftPage from "../../pages/Negotiate/OfferDraftPage.tsx";
import NegotiationStrategy from "../../pages/Negotiate/NegotiationStrategy.tsx";
import EscrowLegalLogistics from "../../pages/Close/EscrowLegalLogistics.tsx";
import InspectionsDueDiligence from "../../pages/Close/InspectionsDueDiligence.tsx";
import FinancingInsurance from "../../pages/Close/FinancingInsurance.tsx";
import ClosingMovingIn from "../../pages/Close/ClosingMovingIn.tsx";
import DashboardPage from "../../pages/Dashboard.tsx";
import { UserProfile } from "../../context/utils";
//import PreApproved from "../../pages/Onboard/PreApproved.tsx";
import SavedHomes from "../../pages/Search/SavedHomes";

interface HeaderConfig {
  type: "rheader" | "none";
  title?: string;
  subtitle?: string;
}

interface DashboardProps {
  user?: UserProfile;
  onLogout: () => void;
  header?: HeaderConfig;
  maxWidth?: number; // Percentage value (e.g., 85 for 85%)
}

export default function DashboardLayout({
  user,
  onLogout,
  header,
  maxWidth = 85,
}: DashboardProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const { getAgentConnectionComponent } = useAgent();

  // Use NotificationsContext for activity feed (for future notification badge)
  // const { unreadCount } = useNotifications();

  // Get page-specific width configuration based on current route
  const getPageMaxWidth = (): number => {
    const path = location.pathname;

    // Page-specific width overrides (percentage values)
    if (path.startsWith("/dashboard")) return 90; // Dashboard needs more space for cards
    if (path.startsWith("/search")) return 100; // Map needs full width

    // Default to the passed maxWidth parameter or 85%
    return maxWidth;
  };

  // Get header-specific width configuration (standardized to match generate-report)
  const getHeaderMaxWidth = (): number => {
    // Use consistent 85% width for all headers to match generate-report
    return 85;
  };

  // Get header configuration based on current route
  const getHeaderConfig = (): HeaderConfig | undefined => {
    // If header prop is provided, use it (allows override)
    if (header) return header;

    // Default header configurations based on route
    const path = location.pathname;

    if (path.startsWith("/escrow-legal-logistics")) {
      return { type: "none" };
    }

    if (path.startsWith("/inspections-due-diligence")) {
      return { type: "none" };
    }

    if (path.startsWith("/financing-insurance")) {
      return { type: "none" };
    }

    if (path.startsWith("/closing-moving-in")) {
      return { type: "none" };
    }

    if (path.startsWith("/generate-report")) {
      return {
        type: "rheader",
        title: "Generate Report",
        subtitle: "Create detailed property analysis",
      };
    }

    if (path.startsWith("/reports")) {
      return {
        type: "rheader",
        title: "Past Reports",
        subtitle: "Manage and download your generated property reports",
      };
    }

    if (path.startsWith("/search")) {
      return { type: "none" };
    }

    if (path.startsWith("/ai-assistant")) {
      return { type: "none" };
    }

    if (path.startsWith("/personalization")) {
      return { type: "none" };
    }

    if (path.startsWith("/negotiation-strategy")) {
      return {
        type: "rheader",
        title: "Negotiation Strategy",
        subtitle: "Plan your offer approach",
      };
    }

    if (path.startsWith("/draft-offer")) {
      return {
        type: "rheader",
        title: "Draft Offer",
        subtitle: "Create your property offer",
      };
    }

    if (path.startsWith("/subscription")) {
      return {
        type: "rheader",
        title: "Subscription",
        subtitle: "Manage your subscription and billing",
      };
    }

    if (
      path.startsWith("/agent-connection") ||
      path.startsWith("/client-information")
    ) {
      return {
        type: "rheader",
        title: "Agent Connection",
        subtitle: "Connect with real estate professionals",
      };
    }

    if (path.startsWith("/saved")) {
      return {
        type: "rheader",
        title: "Saved Homes",
        subtitle: "View your saved properties",
      };
    }

    if (path.startsWith("/compare-reports")) {
      return {
        type: "rheader",
        title: "Compare Reports",
        subtitle: "Compare property analysis reports",
      };
    }

    // Default to no header for dashboard and other pages
    return { type: "none" };
  };

  // Check if screen is mobile size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
      // Close sidebar on mobile by default
      if (window.innerWidth < 1024) {
        setSidebarExpanded(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Render header component based on type
  const renderHeader = () => {
    const headerConfig = getHeaderConfig();
    if (!headerConfig || headerConfig.type === "none") return null;

    switch (headerConfig.type) {
      case "rheader":
        return (
          <PageHeader
            title={headerConfig.title || "Default Title"}
            subtitle={headerConfig.subtitle}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-off-white flex">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar
          user={user}
          onLogout={onLogout}
          expanded={sidebarExpanded}
          onToggleExpanded={() => setSidebarExpanded(!sidebarExpanded)}
          isMobile={false}
        />
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <MobileSidebar
          user={user}
          onLogout={onLogout}
          expanded={sidebarExpanded}
          onToggleExpanded={() => setSidebarExpanded(!sidebarExpanded)}
        />
      )}

      <main
        className={`flex-1 transition-all duration-200 ${
          isMobile
            ? "ml-0" // No margin on mobile (MobileSidebar handles positioning)
            : sidebarExpanded
            ? "ml-64" // Desktop expanded (w-64 = 256px)
            : "ml-16" // Desktop collapsed (w-16 = 64px)
        }`}
      >
        {/* Mobile Header Bar - Fixed at top to prevent overlapping */}
        {isMobile && renderHeader() && (
          <div className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm">
            <div className="flex items-center gap-responsive-sm px-responsive-sm py-responsive-xs">
              {/* Mobile Sidebar Toggle Button */}
              <button
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                className="p-2 bg-brown text-white rounded-lg shadow hover:bg-brown-light hover:text-beige active:text-beige transition-all duration-200 touch-friendly flex-shrink-0"
                aria-label="Toggle sidebar"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              {/* PageHeader Component with proper margin */}
              <div className="flex-1 min-w-0">
                {renderHeader()}
              </div>
            </div>
          </div>
        )}

        {/* Desktop Header Rendering with consistent width */}
        {!isMobile && renderHeader() && (
          <div
            className="mt-4 sm:mt-6 lg:mt-8 mx-auto"
            style={{ maxWidth: `${getHeaderMaxWidth() * 1.04}%` }}
          >
            {renderHeader()}
          </div>
        )}

        {/* Content area with centralized width parameter */}
        <div
          className={`mx-auto ${
            isMobile ? "p-2 sm:p-4 pt-20" : "p-4 sm:p-6 lg:p-8"
          }`}
          style={{ maxWidth: `${getPageMaxWidth()}%` }}
        >
          {/* Render component based on current path */}
          {location.pathname.startsWith("/generate-report") && (
            <GenerateReportPage />
          )}
          {location.pathname.startsWith("/reports") && <PastReports />}
          {location.pathname.startsWith("/compare-reports") && (
            <CompareReportsPage />
          )}
          {location.pathname.startsWith("/search") && <SearchPage />}
          {location.pathname.startsWith("/ai-assistant") && <AIAssistant />}
          {location.pathname.startsWith("/personalization") && (
            <PersonalizationPage />
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
            <EscrowLegalLogistics />
          )}
          {location.pathname.startsWith("/inspections-due-diligence") && (
            <InspectionsDueDiligence />
          )}
          {location.pathname.startsWith("/financing-insurance") && (
            <FinancingInsurance />
          )}
          {location.pathname.startsWith("/closing-moving-in") && (
            <ClosingMovingIn />
          )}
          {location.pathname.startsWith("/saved") && <SavedHomes />}
          {location.pathname.startsWith("/dashboard") && <DashboardPage />}
        </div>
      </main>
    </div>
  );
}
