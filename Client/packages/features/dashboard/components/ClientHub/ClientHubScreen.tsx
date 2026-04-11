import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import {
  CHECKLIST_TITLES,
  type ChecklistTab,
  useChecklistProgress,
} from "packages/features/checklists";
import { useIsAgent } from "packages/features/homeauth";
import { useNavigation } from "packages/navigation";
import ClientSelector from "packages/ui/components/button/ClientSelector";
import {
  Box,
  Pressable,
  ScrollView,
  Text,
} from "packages/ui/components/primitives";
import { UnderlineTabs } from "packages/ui/components/tabs";
import { dateParseISO } from "packages/utils/date";

import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
import { useAgentDashboardMockData } from "@/features/agent/hooks/data/useAgentDashboardMockData";

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

type ClientHubScreenProps = {
  clientId: string;
};

type ClientHubTab =
  | "overview"
  | "liked-homes"
  | "documents"
  | "checklists"
  | "calendar";

function _formatDate(dateString: string) {
  const date = dateParseISO(dateString).toDate();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeDate(dateString: string) {
  const now = Date.now();
  const date = dateParseISO(dateString).valueOf();
  const diffMs = now - date;
  const oneDay = 1000 * 60 * 60 * 24;
  const days = Math.floor(diffMs / oneDay);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 14) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  return `${weeks} weeks ago`;
}

export function ClientHubScreen({ clientId }: ClientHubScreenProps) {
  const { t } = useLocalization();
  const { navigateToPath, goBack } = useNavigation();
  const isAgent = useIsAgent();
  const { clients, isLoading } = useAgentClients();
  const {
    enhanceClientWithDealInfo,
    generateMockClientGoals,
    generateMockFinancialSnapshot,
    generateMockTimelineEvents,
    generateMockNotes,
    generateMockDecisionLog,
  } = useAgentDashboardMockData();

  const [activeTab, setActiveTab] = useState<ClientHubTab>("overview");
  const { currentSection, isSectionUnlocked } = useChecklistProgress();
  const [checklistTab, setChecklistTab] =
    useState<ChecklistTab>(currentSection);
  const prevActiveTabRef = useRef<ClientHubTab>("overview");

  // When opening the checklists tab, select the tab with the earliest unchecked item
  useEffect(() => {
    if (activeTab === "checklists") {
      setChecklistTab(currentSection);
    }
    prevActiveTabRef.current = activeTab;
  }, [activeTab, currentSection]);

  const client = useMemo(
    () => clients.find((c) => c.id === clientId),
    [clients, clientId],
  );

  const handleHubClientChange = useCallback(
    (nextId: string | null) => {
      if (nextId !== null) {
        navigateToPath(`/dashboard/client/${nextId}`);
      } else {
        navigateToPath("/dashboard");
      }
    },
    [navigateToPath],
  );

  const enhancedClient = useMemo(
    () => (client ? enhanceClientWithDealInfo(client, "search") : null),
    [client, enhanceClientWithDealInfo],
  );

  const financial = useMemo(
    () => generateMockFinancialSnapshot(),
    [generateMockFinancialSnapshot],
  );
  const goals = useMemo(
    () => generateMockClientGoals(),
    [generateMockClientGoals],
  );
  const timelineEvents = useMemo(
    () => generateMockTimelineEvents(clientId),
    [clientId, generateMockTimelineEvents],
  );
  const notes = useMemo(
    () => generateMockNotes(clientId),
    [clientId, generateMockNotes],
  );
  const decisions = useMemo(
    () => generateMockDecisionLog(clientId),
    [clientId, generateMockDecisionLog],
  );

  const tabs: { id: ClientHubTab; label: string }[] = [
    { id: "overview", label: t("dashboard.tab_overview") },
    { id: "liked-homes", label: t("dashboard.tab_liked_homes") },
    { id: "documents", label: t("dashboard.tab_documents") },
    { id: "checklists", label: t("dashboard.tab_checklists") },
    { id: "calendar", label: t("dashboard.tab_calendar") },
  ];

  // Client hub is agent-only; non-agents see a simple "Not available" and back
  if (!isAgent) {
    return (
      <Box className="flex-1 items-center justify-center p-6">
        <Text className="text-text-secondary mb-3 text-sm">Not available.</Text>
        <Pressable
          onPress={() => {
            goBack();
          }}
          className="border-border rounded-lg border px-4 py-2"
        >
          <Text className="text-primary text-sm font-medium">
            Back to dashboard
          </Text>
        </Pressable>
      </Box>
    );
  }

  if (isLoading && !client) {
    return (
      <Box className="flex-1 items-center justify-center">
        <Text className="text-text-secondary text-sm">Loading client...</Text>
      </Box>
    );
  }

  if (!client || !enhancedClient) {
    return (
      <Box className="flex-1 items-center justify-center p-6">
        <Text className="text-text-secondary mb-3 text-sm">
          Client not found.
        </Text>
        <Pressable
          onPress={() => {
            goBack();
          }}
          className="border-border rounded-lg border px-4 py-2"
        >
          <Text className="text-primary text-sm font-medium">
            Back to dashboard
          </Text>
        </Pressable>
      </Box>
    );
  }

  const isLikedHomesTab = activeTab === "liked-homes";

  return (
    <Box className="bg-background-base flex-1">
      {/* Header */}
      <Box className="mb-4 flex flex-row items-center justify-between px-4 pt-6">
        <Pressable
          onPress={() => {
            navigateToPath("/dashboard");
          }}
          className="mr-3"
        >
          <Text className="text-primary text-sm font-medium">← Back</Text>
        </Pressable>

        <Box className="min-w-0 flex-1 flex-col gap-2">
          <ClientSelector
            selectedClientId={clientId}
            onClientChange={handleHubClientChange}
            hideMeOption
            className="w-full max-w-md self-end sm:self-auto"
          />
          <Box>
            <Text className="text-text-secondary text-xs">
              Stage: {enhancedClient.deal_stage.replace(/_/g, " ")}
            </Text>
            {enhancedClient.last_agent_action ? (
              <Text className="text-text-secondary text-xs">
                Last action:{" "}
                {formatRelativeDate(enhancedClient.last_agent_action)}
              </Text>
            ) : null}
          </Box>
        </Box>
      </Box>

      {/* Tabs - unified with search Results/Saved styling */}
      <Box className="px-4">
        <UnderlineTabs
          items={tabs}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as ClientHubTab)}
          className="mb-4"
        />
      </Box>

      {/* Content Area */}
      {isLikedHomesTab ? (
        <Box className="flex-1">
          <ClientSavedHomes userId={clientId} />
        </Box>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        >
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <Box className="gap-6">
              {/* Goals and constraints */}
              <GoalsConstraints goals={goals} />

              {/* Financial snapshot */}
              <FinancialSnapshot financial={financial} />

              {/* Risk flags */}
              <RiskWatchlist
                riskFlags={enhancedClient.risk_flags}
                emotionalVolatility="medium"
              />

              {/* Search Activity */}
              <SearchActivity
                viewedHomes={12}
                favoritedHomes={5}
                rejectedHomes={7}
              />

              {/* Timeline */}
              <ClientTimeline events={timelineEvents} />

              {/* Communication Log */}
              <CommunicationLog
                clientId={clientId}
                decisions={decisions}
                notes={notes}
              />
            </Box>
          )}

          {/* Documents tab */}
          {activeTab === "documents" && (
            <Box className="mt-4">
              <ClientDocuments userId={clientId} />
            </Box>
          )}

          {/* Checklists tab */}
          {activeTab === "checklists" && (
            <Box className="mt-4">
              {/* Checklist sub-tabs */}
              <UnderlineTabs
                items={(
                  [
                    "search",
                    "offer",
                    "escrow",
                    "inspections",
                    "financing",
                    "closing",
                  ] as const
                ).map((id) => ({
                  id,
                  label: CHECKLIST_TITLES[id],
                  icon: (
                    <Icon
                      name={
                        id === "search"
                          ? "search"
                          : id === "offer"
                            ? "file-signature"
                            : id === "escrow"
                              ? "file-text"
                              : id === "inspections"
                                ? "clipboard-check"
                                : id === "financing"
                                  ? "dollar-sign"
                                  : "home"
                      }
                      className="h-4 w-4"
                    />
                  ),
                  locked: !isSectionUnlocked(id),
                }))}
                activeId={checklistTab}
                onChange={(id) => setChecklistTab(id as ChecklistTab)}
                className="mb-4"
              />
              <ClientChecklists
                userId={clientId}
                activeTab={checklistTab}
                hideIntegrationComponents={isAgent}
                onTabChange={setChecklistTab}
              />
            </Box>
          )}

          {/* Calendar tab */}
          {activeTab === "calendar" && (
            <Box className="mt-4">
              <ClientCalendar userId={clientId} />
            </Box>
          )}
        </ScrollView>
      )}
    </Box>
  );
}

export default ClientHubScreen;
