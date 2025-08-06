import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./Sidebar.tsx";
import GenerateReportPage from "../pages/GenerateReportPage.tsx";
import PastReports from "../pages/PastReports.tsx";
import CompareReportsPage from "../pages/CompareReportsPage.tsx";
import SearchPage from "../pages/SearchPage.tsx";
import PersonalizationPage from "../pages/PersonalizationPage.tsx";
import Subscription from "../pages/Subscription.tsx";
import AIAssistant from "../pages/AIAssistant.tsx";
import ClientIntelPage from "../pages/ClientIntelPage.tsx";
import AgentConnection from "../pages/AgentConnection.tsx";
import OfferDraftPage from "../pages/OfferDraftPage.tsx";
import NegotiationStrategy from "../pages/NegotiationStrategy.tsx";
import EscrowLegalLogistics from "../pages/EscrowLegalLogistics";
import InspectionsDueDiligence from "../pages/InspectionsDueDiligence";
import FinancingInsurance from "../pages/FinancingInsurance";
import ClosingMovingIn from "../pages/ClosingMovingIn";
import UserDashboardPage from "../pages/UserDashboard.tsx";
import { User } from "../types/index.ts";
import GetPreApproved from "../pages/GetPreApproved";

interface DashboardProps {
  user: User;
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
            <Route path="/" element={<GenerateReportPage />} />
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
            <Route path="user-dashboard" element={<UserDashboardPage />} />
            <Route path="get-preapproved" element={<GetPreApproved />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
