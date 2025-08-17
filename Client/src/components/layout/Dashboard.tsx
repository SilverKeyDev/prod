import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./Sidebar";
import GenerateReportPage from "../../pages/Decide/GenerateReportPage.tsx";
import PastReports from "../../pages/Decide/PastReports.tsx";
import CompareReportsPage from "../../pages/Decide/CompareReportsPage.tsx";
import SearchPage from "../../pages/Search/SearchPage.tsx";
import PersonalizationPage from "../../pages/Onboard/PersonalizationPage.tsx";
import Subscription from "../../pages/Onboard/Subscription.tsx";
import AIAssistant from "../../pages/Decide/AIAssistant.tsx";
import ClientIntelPage from "../../pages/Onboard/ClientIntelPage.tsx";
import AgentConnection from "../../pages/Onboard/AgentConnection.tsx";
import OfferDraftPage from "../../pages/Negotiate/OfferDraftPage.tsx";
import NegotiationStrategy from "../../pages/Negotiate/NegotiationStrategy.tsx";
import EscrowLegalLogistics from "../../pages/Close/EscrowLegalLogistics.tsx";
import InspectionsDueDiligence from "../../pages/Close/InspectionsDueDiligence.tsx";
import FinancingInsurance from "../../pages/Close/FinancingInsurance.tsx";
import ClosingMovingIn from "../../pages/Close/ClosingMovingIn.tsx";
import UserDashboardPage from "../../pages/UserDashboard.tsx";
import { UserProfile } from "../../contexts/DataContext.tsx";
//import PreApproved from "../../pages/Onboard/PreApproved.tsx";
import SavedHomes from "../../pages/Search/SavedHomes";

interface DashboardProps {
  user?: UserProfile;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

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
      <Sidebar
        user={user}
        onLogout={onLogout}
        expanded={sidebarExpanded}
        onToggleExpanded={() => setSidebarExpanded(!sidebarExpanded)}
        isMobile={isMobile}
      />

      <main
        className={`flex-1 transition-all duration-200 ${
          isMobile
            ? sidebarExpanded
              ? "ml-72" // Full sidebar on mobile when expanded
              : "ml-12" // Small sidebar on mobile when collapsed
            : sidebarExpanded
            ? "ml-72"
            : "ml-16"
        }`}
      >
        <div className={`${isMobile ? "p-4" : "p-8"}`}>
          <Routes>
            <Route path="generate-report" element={<GenerateReportPage />} />
            <Route path="reports" element={<PastReports />} />
            <Route path="compare-reports" element={<CompareReportsPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="ai-assistant" element={<AIAssistant />} />
            <Route path="personalization" element={<PersonalizationPage />} />
            <Route path="subscription" element={<Subscription />} />
            <Route path="client-information" element={<ClientIntelPage />} />
            <Route path="agent-connection" element={<AgentConnection />} />
            <Route path="draft-offer" element={<OfferDraftPage />} />
            <Route path="negotiation-strategy" element={<NegotiationStrategy />} />
            <Route path="escrow-legal-logistics" element={<EscrowLegalLogistics />} />
            <Route path="inspections-due-diligence" element={<InspectionsDueDiligence />} />
            <Route path="financing-insurance" element={<FinancingInsurance />} />
            <Route path="closing-moving-in" element={<ClosingMovingIn />} />
            <Route path="/" element={<UserDashboardPage />} />
            {/* <Route path="get-preapproved" element={<GetPreApproved />} /> */}
            <Route path="saved" element={<SavedHomes />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
