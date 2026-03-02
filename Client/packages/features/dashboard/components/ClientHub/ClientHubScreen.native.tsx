import React, { useMemo } from "react";

import { useNavigation } from "@react-navigation/native";
import { ScrollView, StyleSheet, View } from "react-native";

import { Box, Loading, Pressable, Text } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";

import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
import { useAgentDashboardMockData } from "@/features/agent/hooks/data/useAgentDashboardMockData";

type ClientHubScreenNativeProps = {
  clientId: string;
};

export function ClientHubScreenNative({ clientId }: ClientHubScreenNativeProps) {
  const navigation = useNavigation();
  const { clients, isLoading } = useAgentClients();
  const {
    enhanceClientWithDealInfo,
    generateMockClientGoals,
    generateMockFinancialSnapshot,
    generateMockTimelineEvents,
    generateMockNotes,
  } = useAgentDashboardMockData();

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Box className="mb-4 flex-row items-center justify-between">
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
      <Box className="mb-6 gap-1">
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

      {/* Goals and constraints */}
      <Box className="mb-5 gap-2 rounded-lg bg-white p-3 shadow-sm">
        <Text className="text-sm font-semibold text-gray-900">Goals & preferences</Text>
        <Text className="text-xs text-gray-600">
          Budget: ${goals.budget_min.toLocaleString()} – ${goals.budget_max.toLocaleString()}{" "}
          (stretch {goals.budget_stretch.toLocaleString()})
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
        <Text className="text-xs text-gray-700">Pre-approval: {financial.pre_approval_status}</Text>
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
              {flag.message ? <Text className="text-xs text-gray-700">{flag.message}</Text> : null}
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
    </ScrollView>
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
});

export default ClientHubScreenNative;
