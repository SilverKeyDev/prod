import React, { useMemo, useState } from "react";

import { useNavigation } from "@react-navigation/native";
import { ScrollView, StyleSheet, View } from "react-native";

import { useLocalization } from "packages/contexts";
import { useIsAgent } from "packages/features/homeauth";
import { Box, Loading, Pressable, Text } from "packages/ui/components/primitives";
import { UnderlineTabs } from "packages/ui/components/tabs";
import { dateParseISO } from "packages/utils/date";

import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
import { useAgentDashboardMockData } from "@/features/agent/hooks/data/useAgentDashboardMockData";

import ClientAgreementsNative from "./agreements/ClientAgreements.native";
import ClientCalendar from "./calendar/ClientCalendar";
import ClientChecklistsNative from "./checklists/ClientChecklists.native";
import ClientDocumentsNative from "./documents/ClientDocuments.native";
import ClientSavedHomesNative from "./saved-homes/ClientSavedHomes.native";

type ClientHubScreenNativeProps = {
  clientId: string;
};

type ClientHubTab =
  | "overview"
  | "liked-homes"
  | "documents"
  | "agreements"
  | "checklists"
  | "calendar";

export function ClientHubScreenNative({ clientId }: ClientHubScreenNativeProps) {
  const { t } = useLocalization();
  const navigation = useNavigation();
  const isAgent = useIsAgent();
  const { clients, isLoading } = useAgentClients();

  // Client hub is agent-only; non-agents see a simple "Not available" and back (e.g. from deep link).
  if (!isAgent) {
    return (
      <View style={styles.centered}>
        <Text className="mb-3 text-sm text-gray-600">Not available.</Text>
        <Pressable
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
          className="border-brand-accent rounded-lg border px-4 py-2"
        >
          <Text className="text-brand-accent text-sm font-medium">Back to dashboard</Text>
        </Pressable>
      </View>
    );
  }
  const {
    enhanceClientWithDealInfo,
    generateMockClientGoals,
    generateMockFinancialSnapshot,
    generateMockTimelineEvents,
    generateMockNotes,
  } = useAgentDashboardMockData();

  const [activeTab, setActiveTab] = useState<ClientHubTab>("overview");

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

  const tabs: { id: ClientHubTab; label: string }[] = [
    { id: "overview", label: t("dashboard.tab_overview") },
    { id: "liked-homes", label: t("dashboard.tab_liked_homes") },
    { id: "documents", label: t("dashboard.tab_documents") },
    { id: "agreements", label: t("dashboard.tab_agreements") },
    { id: "checklists", label: t("dashboard.tab_checklists") },
    { id: "calendar", label: t("dashboard.tab_calendar") },
  ];

  if (isLoading && !client) {
    return (
      <View style={styles.centered}>
        <Loading />
      </View>
    );
  }

  if (!client || !enhancedClient) {
    return (
      <View style={styles.centered}>
        <Text className="mb-3 text-sm text-gray-600">Client not found.</Text>
        <Pressable
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
          className="border-brand-accent rounded-lg border px-4 py-2"
        >
          <Text className="text-brand-accent text-sm font-medium">Back to dashboard</Text>
        </Pressable>
      </View>
    );
  }

  const isLikedHomesTab = activeTab === "liked-homes";

  return (
    <View style={styles.container}>
      <Box style={styles.content} className="mb-4 flex-row items-center justify-between">
        <Pressable
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
          className="mr-3"
        >
          <Text className="text-brand-accent text-sm font-medium">← Back</Text>
        </Pressable>
        <Text className="text-xs text-gray-500">Client overview</Text>
      </Box>

      {/* Header */}
      <Box style={styles.content} className="mb-4 gap-1">
        <Text className="text-xl font-semibold text-gray-900">{enhancedClient.name}</Text>
        <Text className="text-sm text-gray-600">{enhancedClient.email}</Text>
        <Text className="mt-1 text-xs text-gray-500">
          Stage: {enhancedClient.deal_stage.replace(/_/g, " ")}
        </Text>
        {enhancedClient.last_agent_action ? (
          <Text className="mt-1 text-xs text-gray-500">
            Last action: {formatRelativeDate(enhancedClient.last_agent_action)}
          </Text>
        ) : null}
      </Box>

      {/* Tabs — same look/behavior as web (underline style) */}
      <Box style={styles.content}>
        <UnderlineTabs
          items={tabs}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as ClientHubTab)}
          className="mb-4"
        />
      </Box>

      {/* Liked homes tab: render outside ScrollView to avoid VirtualizedList inside ScrollView */}
      {isLikedHomesTab ? (
        <View style={styles.tabContent}>
          <ClientSavedHomesNative clientId={clientId} />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Overview tab */}
          {activeTab === "overview" && (
            <>
              {/* Goals and constraints */}
              <Box className="mb-5 gap-2 rounded-lg bg-white p-3 shadow-sm">
                <Text className="text-sm font-semibold text-gray-900">Goals & preferences</Text>
                <Text className="text-xs text-gray-600">
                  Budget: ${goals.budget_min.toLocaleString()} – $
                  {goals.budget_max.toLocaleString()} (stretch{" "}
                  {goals.budget_stretch.toLocaleString()})
                </Text>
                <Text className="mt-1 text-xs text-gray-700">
                  Must haves: {goals.must_haves.join(", ")}
                </Text>
                <Text className="mt-1 text-xs text-gray-700">
                  Deal breakers: {goals.deal_breakers.join(", ")}
                </Text>
                <Text className="mt-1 text-xs text-gray-500">
                  Timeline urgency: {goals.timeline_urgency}
                </Text>
              </Box>

              {/* Financial snapshot */}
              <Box className="mb-5 gap-2 rounded-lg bg-white p-3 shadow-sm">
                <Text className="text-sm font-semibold text-gray-900">Financial snapshot</Text>
                <Text className="text-xs text-gray-700">
                  Pre-approval: {financial.pre_approval_status}
                </Text>
                <Text className="text-xs text-gray-700">Loan type: {financial.loan_type}</Text>
                <Text className="text-xs text-gray-700">
                  Pre-approval amount: ${financial.pre_approval_amount.toLocaleString()}
                </Text>
                <Text className="text-xs text-gray-700">
                  Cash to close: ${financial.cash_to_close.toLocaleString()}
                </Text>
              </Box>

              {/* Risk flags */}
              <Box className="mb-5 gap-2 rounded-lg bg-white p-3 shadow-sm">
                <Text className="text-sm font-semibold text-gray-900">Risk watchlist</Text>
                {enhancedClient.risk_flags.length === 0 ? (
                  <Text className="mt-1 text-xs text-emerald-600">No active risk flags.</Text>
                ) : (
                  enhancedClient.risk_flags.map((flag, index) => (
                    <Box key={`${flag.type}-${index}`} className="mt-1">
                      <Text className="text-xs font-medium text-rose-600">
                        {flag.severity.toUpperCase()} · {flag.type}
                      </Text>
                      {flag.message ? (
                        <Text className="text-xs text-gray-700">{flag.message}</Text>
                      ) : null}
                    </Box>
                  ))
                )}
              </Box>

              {/* Timeline */}
              <Box className="mb-5 gap-2 rounded-lg bg-white p-3 shadow-sm">
                <Text className="text-sm font-semibold text-gray-900">Timeline</Text>
                {timelineEvents.length === 0 ? (
                  <Text className="mt-1 text-xs text-gray-600">No timeline events yet.</Text>
                ) : (
                  timelineEvents
                    .slice()
                    .sort((a, b) => dateParseISO(a.date).valueOf() - dateParseISO(b.date).valueOf())
                    .map((event) => (
                      <Box key={event.id} className="mt-2">
                        <Text className="text-xs font-semibold text-gray-900">
                          {formatDate(event.date)} · {event.title}
                        </Text>
                        {event.description ? (
                          <Text className="text-xs text-gray-700">{event.description}</Text>
                        ) : null}
                      </Box>
                    ))
                )}
              </Box>

              {/* Notes */}
              <Box className="mb-6 gap-2 rounded-lg bg-white p-3 shadow-sm">
                <Text className="text-sm font-semibold text-gray-900">Notes</Text>
                {notes.length === 0 ? (
                  <Text className="mt-1 text-xs text-gray-600">No notes yet.</Text>
                ) : (
                  notes.map((note) => (
                    <Box key={note.id} className="mt-2">
                      <Text className="text-xs text-gray-700">{note.content}</Text>
                      <Text className="mt-1 text-xs text-gray-400">
                        Added {formatDate(note.created_at)}
                      </Text>
                    </Box>
                  ))
                )}
              </Box>
            </>
          )}

          {/* Documents tab */}
          {activeTab === "documents" && (
            <Box className="mt-4">
              <ClientDocumentsNative userId={clientId} />
            </Box>
          )}

          {/* Agreements tab */}
          {activeTab === "agreements" && (
            <Box className="mt-4">
              <ClientAgreementsNative clientId={clientId} />
            </Box>
          )}

          {/* Checklists tab */}
          {activeTab === "checklists" && (
            <Box className="mt-4">
              <ClientChecklistsNative userId={clientId} />
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
    </View>
  );
}

function formatDate(dateString: string) {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  tabContent: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
});

export default ClientHubScreenNative;
