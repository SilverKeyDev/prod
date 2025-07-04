import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./Sidebar.tsx";
import GenerateReportPage from "../pages/GenerateReportPage.tsx";
import PastReports from "../pages/PastReports.tsx";
import AIAssistant from "../pages/AIAssistant.tsx";
import Subscription from "../pages/Subscription.tsx";
import { User } from "../types/index.ts";

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-off-white flex">
      <Sidebar
        user={user}
        onLogout={onLogout}
        expanded={sidebarExpanded}
        onToggleExpanded={() => setSidebarExpanded(!sidebarExpanded)}
      />

      <main
        className={`flex-1 ml-16 lg:ml-24 transition-all duration-200 ${
          sidebarExpanded ? "lg:ml-72" : ""
        }`}
      >
        <div className="p-8">
          <Routes>
            <Route path="/" element={<GenerateReportPage />} />
            <Route path="reports" element={<PastReports />} />
            <Route path="assistant" element={<AIAssistant />} />
            <Route path="subscription" element={<Subscription />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
