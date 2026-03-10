import React, { useMemo, useState } from "react";

import { useLocalization } from "packages/contexts";
import { useIsAgent } from "packages/features/homeauth";
import { useNavigation } from "packages/navigation";
import { Box, Pressable, ScrollView, Text } from "packages/ui/components/primitives";
import { UnderlineTabs } from "packages/ui/components/tabs";
import { dateParseISO } from "packages/utils/date";

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

type ClientHubScreenProps = {
  clientId: string;
};

type ClientHubTab =
  | "overview"
  | "liked-homes"
  | "documents"
  | "agreements"
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
  const [checklistTab, setChecklistTab] = useState<
    "escrow" | "inspections" | "financing" | "closing"
  >("escrow");

  const client = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);

  const enhancedClient = useMemo(
    () => (client ? enhanceClientWithDealInfo(client, "search") : null),
    [client, enhanceClientWithDealInfo]
  );

  const financial = useMemo(() => generateMockFinancialSnapshot(), [generateMockFinancialSnapshot]);
  const goals = useMemo(() => generateMockClientGoals(), [generateMockClientGoals]);
  const timelineEvents = useMemo(
    () => generateMockTimelineEvents(clientId),
    [clientId, generateMockTimelineEvents]
  );
  const notes = useMemo(() => generateMockNotes(clientId), [clientId, generateMockNotes]);
  const decisions = useMemo(
    () => generateMockDecisionLog(clientId),
    [clientId, generateMockDecisionLog]
  );

  const tabs: { id: ClientHubTab; label: string }[] = [
    { id: "overview", label: t("dashboard.tab_overview") },
    { id: "liked-homes", label: t("dashboard.tab_liked_homes") },
    { id: "documents", label: t("dashboard.tab_documents") },
    { id: "agreements", label: t("dashboard.tab_agreements") },
    { id: "checklists", label: t("dashboard.tab_checklists") },
    { id: "calendar", label: t("dashboard.tab_calendar") },
  ];

  // Client hub is agent-only; non-agents see a simple "Not available" and back
  if (!isAgent) {
    return (
      <Box className="flex-1 items-center justify-center p-6">
        <Text className="mb-3 text-sm text-gray-600">Not available.</Text>
        <Pressable
          onPress={() => {
            goBack();
          }}
          className="border-brand-accent rounded-lg border px-4 py-2"
        >
          <Text className="text-brand-accent text-sm font-medium">Back to dashboard</Text>
        </Pressable>
      </Box>
    );
  }

  if (isLoading && !client) {
    return (
      <Box className="flex-1 items-center justify-center">
        <Text className="text-sm text-gray-600">Loading client...</Text>
      </Box>
    );
  }

  if (!client || !enhancedClient) {
    return (
      <Box className="flex-1 items-center justify-center p-6">
        <Text className="mb-3 text-sm text-gray-600">Client not found.</Text>
        <Pressable
          onPress={() => {
            goBack();
          }}
          className="border-brand-accent rounded-lg border px-4 py-2"
        >
          <Text className="text-brand-accent text-sm font-medium">Back to dashboard</Text>
        </Pressable>
      </Box>
    );
  }

  const isLikedHomesTab = activeTab === "liked-homes";

  return (
    <Box className="bg-off-white flex-1">
      {/* Header */}
      <Box className="mb-4 flex-row items-center justify-between px-4 pt-6">
        <Pressable
          onPress={() => {
            navigateToPath("/dashboard");
          }}
          className="mr-3"
        >
          <Text className="text-brand-accent text-sm font-medium">← Back</Text>
        </Pressable>

        <Box className="flex-1 flex-row items-center gap-3">
          <Box className="bg-olive/10 flex h-10 w-10 items-center justify-center rounded-full">
            <Text className="text-olive text-lg font-semibold">
              {client.name.charAt(0).toUpperCase()}
            </Text>
          </Box>
          <Box className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">{enhancedClient.name}</Text>
            <Text className="text-sm text-gray-600">{enhancedClient.email}</Text>
            <Text className="text-xs text-gray-500">
              Stage: {enhancedClient.deal_stage.replace(/_/g, " ")}
            </Text>
            {enhancedClient.last_agent_action ? (
              <Text className="text-xs text-gray-500">
                Last action: {formatRelativeDate(enhancedClient.last_agent_action)}
              </Text>
            ) : null}
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
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
              <RiskWatchlist riskFlags={enhancedClient.risk_flags} emotionalVolatility="medium" />

              {/* Search Activity */}
              <SearchActivity viewedHomes={12} favoritedHomes={5} rejectedHomes={7} />

              {/* Timeline */}
              <ClientTimeline events={timelineEvents} />

              {/* Communication Log */}
              <CommunicationLog clientId={clientId} decisions={decisions} notes={notes} />
            </Box>
          )}

          {/* Documents tab */}
          {activeTab === "documents" && (
            <Box className="mt-4">
              <ClientDocuments userId={clientId} />
            </Box>
          )}

          {/* Agreements tab */}
          {activeTab === "agreements" && (
            <Box className="mt-4">
              <ClientAgreements clientId={clientId} />
            </Box>
          )}

          {/* Checklists tab */}
          {activeTab === "checklists" && (
            <Box className="mt-4">
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
