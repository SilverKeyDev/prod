import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar.tsx";
import GenerateReportPage from "../pages/GenerateReportPage.tsx";
import PastReports from "../pages/PastReports.tsx";
import CompareReportsPage from "../pages/CompareReportsPage.tsx";
import Subscription from "../pages/Subscription.tsx";
import { User } from "../types/index.ts";

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
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
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
        <div className={`${isMobile ? 'p-4' : 'p-8'}`}>
          <Routes>
            <Route path="/" element={<GenerateReportPage />} />
            <Route path="reports" element={<PastReports />} />
            <Route path="compare-reports" element={<CompareReportsPage />} />
            <Route path="subscription" element={<Subscription />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
