import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileSidebar from "./MobileSidebar";
import { useAgent } from "../../context/AgentContext";
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

interface DashboardProps {
  user?: UserProfile;
  onLogout: () => void;
}

export default function DashboardLayout({ user, onLogout }: DashboardProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const { getAgentConnectionComponent } = useAgent();

  // Use NotificationsContext for activity feed (for future notification badge)
  // const { unreadCount } = useNotifications();

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
        <div className={`${isMobile ? "p-2 sm:p-4" : "p-4 sm:p-6 lg:p-8"}`}>
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
