import React, { useEffect, useRef, useState } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { NavItem } from "packages/navigation";
import { useNavigation } from "packages/navigation";
import { getWindow } from "packages/utils/platform";

import { BodyText, Button, KeyTurnLoader, Title } from "@/components/ui";
import ClientInfoSidebar from "@/components/ui/sidebar/ClientInfoSidebar";
import { UnderlineTabs } from "@/components/ui/tabs/index.web";
import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
import { useAgentDashboardMockData } from "@/features/agent/hooks/data/useAgentDashboardMockData";

import ClientAgreements from "./agreements/ClientAgreements";
import ClientCalendar from "./calendar/ClientCalendar";
import ClientChecklists from "./checklists/ClientChecklists";
import ClientDocuments from "./documents/ClientDocuments";
import ClientTimeline from "./overview/ClientTimeline";
import CommunicationLog from "./overview/CommunicationLog";
import FinancialSnapshot from "./overview/FinancialSnapshot";
import GoalsConstraints from "./overview/GoalsConstraints";
import RiskWatchlist from "./overview/RiskWatchlist";
import SearchActivity from "./overview/SearchActivity";
import ClientSavedHomes from "./saved-homes/ClientSavedHomes";
type ClientHubProps = {
  clientId: string;
};
type ClientHubTab =
  | "overview"
  | "liked-homes"
  | "documents"
  | "agreements"
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
  const { t } = useLocalization();
  const { navigate } = useNavigation();
  const { clients, isLoading } = useAgentClients();
  const {
    enhanceClientWithDealInfo,
    generateMockFinancialSnapshot,
    generateMockClientGoals,
    generateMockDecisionLog,
    generateMockNotes,
    generateMockTimelineEvents,
  } = useAgentDashboardMockData();
  const [activeTab, setActiveTab] = useState<ClientHubTab>("overview");
  const [activeSection, setActiveSection] = useState<OverviewSection>("overview");
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
  const enhancedClient = client ? enhanceClientWithDealInfo(client, "search") : null;
  // Mock data - will be replaced with API calls
  const financial = generateMockFinancialSnapshot();
  const goals = generateMockClientGoals();
  const decisions = generateMockDecisionLog(clientId);
  const notes = generateMockNotes(clientId);
  const timelineEvents = generateMockTimelineEvents(clientId);
  // Navigation items for overview sections (Icon primitive by name)
  const overviewNavItems: NavItem[] = [
    {
      key: "overview",
      label: t("dashboard.tab_overview"),
      icon: (props) => <Icon name="user" {...props} />,
      to: "#overview",
    },
    {
      key: "goals",
      label: t("dashboard.nav_goals"),
      icon: (props) => <Icon name="target" {...props} />,
      to: "#goals",
    },
    {
      key: "financial",
      label: t("dashboard.nav_financial"),
      icon: (props) => <Icon name="credit-card" {...props} />,
      to: "#financial",
    },
    {
      key: "activity",
      label: t("dashboard.nav_activity"),
      icon: (props) => <Icon name="activity" {...props} />,
      to: "#activity",
    },
    {
      key: "timeline",
      label: t("dashboard.nav_timeline"),
      icon: (props) => <Icon name="clock" {...props} />,
      to: "#timeline",
    },
    {
      key: "communication",
      label: t("dashboard.nav_communication"),
      icon: (props) => <Icon name="message-square" {...props} />,
      to: "#communication",
    },
    {
      key: "risks",
      label: t("dashboard.nav_risks"),
      icon: (props) => <Icon name="alert-triangle" {...props} />,
      to: "#risks",
    },
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
      const win = getWindow();
      const scrollPosition = win ? win.scrollY + 200 : 0;
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (!section || !section.ref.current) continue;
        const offsetTop = section.ref.current.offsetTop;
        if (scrollPosition >= offsetTop) {
          setActiveSection(section.id as OverviewSection);
          break;
        }
      }
    };
    const win = getWindow();
    if (win) win.addEventListener("scroll", handleScroll);
    return () => {
      if (win) win.removeEventListener("scroll", handleScroll);
    };
  }, [activeTab]);
  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <KeyTurnLoader message={t("dashboard.client_loading")} />
      </div>
    );
  }
  if (!client || !enhancedClient) {
    return (
      <div className="py-12 text-center">
        <BodyText as="p" className="text-responsive-base text-black/60">
          {t("dashboard.client_not_found")}
        </BodyText>
        <Button variant="outline" size="md" onClick={() => navigate("DASHBOARD")} className="mt-4">
          {t("dashboard.back_to_dashboard")}
        </Button>
      </div>
    );
  }
  const tabs: {
    id: ClientHubTab;
    label: string;
  }[] = [
    { id: "overview", label: t("dashboard.tab_overview") },
    { id: "liked-homes", label: t("dashboard.tab_liked_homes") },
    { id: "documents", label: t("dashboard.tab_documents") },
    { id: "agreements", label: t("dashboard.tab_agreements") },
    { id: "checklists", label: t("dashboard.tab_checklists") },
    { id: "calendar", label: t("dashboard.tab_calendar") },
  ];
  return (
    <div className="bg-off-white min-h-screen">
      <div className="mx-auto max-w-7xl pb-1 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between pt-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              iconName="arrow-left"
              onClick={() => navigate("DASHBOARD")}
            >
              {t("dashboard.back")}
            </Button>
            <div className="flex items-center gap-3">
              <div className="bg-olive/10 flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12">
                <Icon name="user" className="text-olive h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <Title as="h1" size="lg" className="heading-responsive-md text-navy">
                  {client.name}
                </Title>
                <BodyText as="p" size="sm" className="text-black/60">
                  {client.email}
                </BodyText>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <UnderlineTabs
          items={tabs}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as ClientHubTab)}
          className="mb-6"
        />

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
                <SearchActivity viewedHomes={12} favoritedHomes={5} rejectedHomes={7} />
              </div>

              {/* Timeline Section */}
              <div ref={timelineRef} id="timeline" className="scroll-mt-4">
                <ClientTimeline events={timelineEvents} />
              </div>

              {/* Communication Section */}
              <div ref={communicationRef} id="communication" className="scroll-mt-4">
                <CommunicationLog clientId={clientId} decisions={decisions} notes={notes} />
              </div>

              {/* Risks Section */}
              <div ref={risksRef} id="risks" className="scroll-mt-4">
                <RiskWatchlist riskFlags={enhancedClient.risk_flags} emotionalVolatility="medium" />
              </div>
            </main>
          </div>
        ) : (
          <div className="mt-6">
            {activeTab === "liked-homes" && <ClientSavedHomes userId={clientId} />}

            {activeTab === "documents" && <ClientDocuments userId={clientId} />}

            {activeTab === "checklists" && (
              <div>
                {/* Checklist sub-tabs */}
                <UnderlineTabs
                  items={[
                    { id: "escrow", label: "Escrow" },
                    { id: "inspections", label: "Inspections" },
                    { id: "financing", label: "Financing" },
                    { id: "closing", label: "Closing" },
                  ]}
                  activeId={checklistTab}
                  onChange={(id) =>
                    setChecklistTab(id as "escrow" | "inspections" | "financing" | "closing")
                  }
                  className="mb-4"
                />
                <ClientChecklists
                  userId={clientId}
                  activeTab={checklistTab}
                  onTabChange={setChecklistTab}
                />
              </div>
            )}

            {activeTab === "agreements" && <ClientAgreements clientId={clientId} />}

            {activeTab === "calendar" && <ClientCalendar userId={clientId} />}
          </div>
        )}
      </div>
    </div>
  );
};
export default ClientHub;
