import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Target,
  DollarSign,
  Activity,
  Clock,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { useAgentClients } from "../../../../../packages/hooks/data/agent/useAgentClients";
import Button from "../../../components/ui/button/Button";
import KeyTurnLoader from "../../../components/ui/loading/KeyTurnLoader";
import ClientInfoSidebar from "../../../components/ui/sidebar/ClientInfoSidebar";
import GoalsConstraints from "./GoalsConstraints";
import FinancialSnapshot from "./FinancialSnapshot";
import SearchActivity from "./SearchActivity";
import ClientTimeline from "./ClientTimeline";
import CommunicationLog from "./CommunicationLog";
import RiskWatchlist from "./RiskWatchlist";
import ClientSavedHomes from "./ClientSavedHomes";
import ClientDocuments from "./ClientDocuments";
import ClientChecklists from "./ClientChecklists";
import ClientCalendar from "./ClientCalendar";
import type { NavItem } from "../../../../../packages/schemas/nav";
import {
  enhanceClientWithDealInfo,
  generateMockFinancialSnapshot,
  generateMockClientGoals,
  generateMockDecisionLog,
  generateMockNotes,
  generateMockTimelineEvents,
} from "../../../../../packages/services/agent/agentDashboard";

type ClientHubProps = {
  clientId: string;
};

type ClientHubTab =
  | "overview"
  | "liked-homes"
  | "documents"
  | "checklists"
  | "calendar";
type OverviewSection =
  | "overview"
  | "goals"
  | "financial"
  | "activity"
  | "timeline"
  | "communication"
  | "risks";

const ClientHub: React.FC<ClientHubProps> = ({ clientId }) => {
  const navigate = useNavigate();
  const { clients, isLoading } = useAgentClients();
  const [activeTab, setActiveTab] = useState<ClientHubTab>("overview");
  const [activeSection, setActiveSection] =
    useState<OverviewSection>("overview");
  const [checklistTab, setChecklistTab] = useState<
    "escrow" | "inspections" | "financing" | "closing"
  >("escrow");

  // Refs for scrolling to sections
  const overviewRef = useRef<HTMLDivElement>(null);
  const goalsRef = useRef<HTMLDivElement>(null);
  const financialRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const communicationRef = useRef<HTMLDivElement>(null);
  const risksRef = useRef<HTMLDivElement>(null);

  const client = clients.find((c) => c.id === clientId);
  const enhancedClient = client
    ? enhanceClientWithDealInfo(client, "search")
    : null;

  // Mock data - will be replaced with API calls
  const financial = generateMockFinancialSnapshot();
  const goals = generateMockClientGoals();
  const decisions = generateMockDecisionLog(clientId);
  const notes = generateMockNotes(clientId);
  const timelineEvents = generateMockTimelineEvents(clientId);

  // Navigation items for overview sections
  const overviewNavItems: NavItem[] = [
    { key: "overview", label: "Overview", icon: User, to: "#overview" },
    { key: "goals", label: "Goals", icon: Target, to: "#goals" },
    {
      key: "financial",
      label: "Financial",
      icon: DollarSign,
      to: "#financial",
    },
    { key: "activity", label: "Activity", icon: Activity, to: "#activity" },
    { key: "timeline", label: "Timeline", icon: Clock, to: "#timeline" },
    {
      key: "communication",
      label: "Communication",
      icon: MessageSquare,
      to: "#communication",
    },
    { key: "risks", label: "Risks", icon: AlertTriangle, to: "#risks" },
  ];

  const scrollToSection = (sectionId: string) => {
    const refMap: Record<string, React.RefObject<HTMLDivElement>> = {
      overview: overviewRef,
      goals: goalsRef,
      financial: financialRef,
      activity: activityRef,
      timeline: timelineRef,
      communication: communicationRef,
      risks: risksRef,
    };

    const ref = refMap[sectionId];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(sectionId as OverviewSection);
    }
  };

  // Track active section based on scroll position
  useEffect(() => {
    if (activeTab !== "overview") return;

    const handleScroll = () => {
      const sections = [
        { id: "overview", ref: overviewRef },
        { id: "goals", ref: goalsRef },
        { id: "financial", ref: financialRef },
        { id: "activity", ref: activityRef },
        { id: "timeline", ref: timelineRef },
        { id: "communication", ref: communicationRef },
        { id: "risks", ref: risksRef },
      ];

      const scrollPosition = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.ref.current) {
          const offsetTop = section.ref.current.offsetTop;
          if (scrollPosition >= offsetTop) {
            setActiveSection(section.id as OverviewSection);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeTab]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <KeyTurnLoader message="Loading client..." />
      </div>
    );
  }

  if (!client || !enhancedClient) {
    return (
      <div className="text-center py-12">
        <p className="text-responsive-base text-black/60">Client not found</p>
        <Button
          variant="outline"
          size="md"
          onClick={() => navigate("/dashboard")}
          className="mt-4"
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const tabs: { id: ClientHubTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "liked-homes", label: "Liked Homes" },
    { id: "documents", label: "Documents" },
    { id: "checklists", label: "Checklists" },
    { id: "calendar", label: "Calendar" },
  ];

  return (
    <div className="min-h-screen bg-off-white">
      <div className="mx-auto max-w-7xl pb-1 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between pt-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />}
              onClick={() => navigate("/dashboard")}
            >
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-olive/10 flex items-center justify-center">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-olive" />
              </div>
              <div>
                <h1 className="heading-responsive-md text-navy">
                  {client.name}
                </h1>
                <p className="text-responsive-sm text-black/60">
                  {client.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-olive text-olive"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content with Sidebar for Overview */}
        {activeTab === "overview" ? (
          <div className="flex flex-row gap-6 lg:gap-8">
            {/* Sidebar - Only show for overview */}
            <ClientInfoSidebar
              items={overviewNavItems}
              activeSection={activeSection}
              onScrollToSection={scrollToSection}
            />

            {/* Main Content Area */}
            <main className="w-full flex-1 space-y-8">
              {/* Overview Section */}
              <div ref={overviewRef} id="overview" className="scroll-mt-4">
                <div className="space-y-6">
                  <GoalsConstraints goals={goals} />
                  <FinancialSnapshot financial={financial} />
                  <RiskWatchlist
                    riskFlags={enhancedClient.risk_flags}
                    emotionalVolatility="medium"
                  />
                </div>
              </div>

              {/* Goals Section */}
              <div ref={goalsRef} id="goals" className="scroll-mt-4">
                <GoalsConstraints goals={goals} />
              </div>

              {/* Financial Section */}
              <div ref={financialRef} id="financial" className="scroll-mt-4">
                <FinancialSnapshot financial={financial} />
              </div>

              {/* Activity Section */}
              <div ref={activityRef} id="activity" className="scroll-mt-4">
                <SearchActivity
                  viewedHomes={12}
                  favoritedHomes={5}
                  rejectedHomes={7}
                />
              </div>

              {/* Timeline Section */}
              <div ref={timelineRef} id="timeline" className="scroll-mt-4">
                <ClientTimeline events={timelineEvents} />
              </div>

              {/* Communication Section */}
              <div
                ref={communicationRef}
                id="communication"
                className="scroll-mt-4"
              >
                <CommunicationLog
                  clientId={clientId}
                  decisions={decisions}
                  notes={notes}
                />
              </div>

              {/* Risks Section */}
              <div ref={risksRef} id="risks" className="scroll-mt-4">
                <RiskWatchlist
                  riskFlags={enhancedClient.risk_flags}
                  emotionalVolatility="medium"
                />
              </div>
            </main>
          </div>
        ) : (
          <div className="mt-6">
            {activeTab === "liked-homes" && (
              <ClientSavedHomes userId={clientId} />
            )}

            {activeTab === "documents" && <ClientDocuments userId={clientId} />}

            {activeTab === "checklists" && (
              <div>
                {/* Checklist sub-tabs */}
                <div className="mb-4 border-b border-gray-200">
                  <div className="flex space-x-1">
                    {[
                      { id: "escrow" as const, label: "Escrow" },
                      { id: "inspections" as const, label: "Inspections" },
                      { id: "financing" as const, label: "Financing" },
                      { id: "closing" as const, label: "Closing" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setChecklistTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                          checklistTab === tab.id
                            ? "border-olive text-olive"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
                <ClientChecklists
                  userId={clientId}
                  activeTab={checklistTab}
                  onTabChange={setChecklistTab}
                />
              </div>
            )}

            {activeTab === "calendar" && <ClientCalendar userId={clientId} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientHub;
