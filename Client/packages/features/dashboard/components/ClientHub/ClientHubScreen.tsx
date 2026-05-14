import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import {
  CHECKLIST_TITLES,
  ChecklistProgressBar,
  type ChecklistTab,
  useChecklistProgress,
} from "packages/features/checklists";
import { useClientHubChecklistPrefetch } from "packages/features/dashboard/hooks";
import { useIsAgent } from "packages/features/homeauth";
import { ProfileFeature, ProfileScreen } from "packages/features/profile";
import { useNavigation } from "packages/navigation";
import { ClientSelector } from "packages/ui";
import Card from "packages/ui/components/cards/Card";
import { Box, Pressable, ScrollView, Text } from "packages/ui/components/primitives";
import { UnderlineTabs } from "packages/ui/components/tabs";
import BodyText from "packages/ui/components/text/BodyText";
import { dateParseISO } from "packages/utils/date";
import { isWeb } from "packages/utils/platform";

import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
import { useAgentDashboardMockData } from "@/features/agent/hooks/data/useAgentDashboardMockData";

import { ClientHubAgenda } from "./agenda/ClientHubAgenda";
import { ClientHubAgreements } from "./agreements/ClientHubAgreements";
import ClientCalendar from "./calendar/ClientCalendar";
import ClientChecklists from "./checklists/ClientChecklists";
import ClientDocuments from "./documents/ClientDocuments";
import ClientSavedHomes from "./saved-homes/ClientSavedHomes";

type ClientHubScreenProps = {
  clientId: string;
};

type ClientHubTab =
  | "roadmap"
  | "profile"
  | "liked-homes"
  | "documents"
  | "calendar"
  | "agenda"
  | "docusign";

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
  const { enhanceClientWithDealInfo } = useAgentDashboardMockData();

  const [activeTab, setActiveTab] = useState<ClientHubTab>("roadmap");
  const {
    currentSection,
    isSectionUnlocked,
    isLoading: checklistProgressLoading,
    overallProgress,
  } = useChecklistProgress({ checklistSubjectUserId: clientId });
  const [checklistTab, setChecklistTab] = useState<ChecklistTab>(currentSection);

  useEffect(() => {
    if (activeTab === "roadmap") {
      setChecklistTab(currentSection);
    }
  }, [activeTab, currentSection]);

  useClientHubChecklistPrefetch(clientId);

  const client = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);

  const handleHubClientChange = useCallback(
    (nextId: string | null) => {
      if (nextId !== null) {
        navigateToPath(`/dashboard/client/${nextId}`);
      } else {
        navigateToPath("/dashboard");
      }
    },
    [navigateToPath]
  );

  const enhancedClient = useMemo(
    () => (client ? enhanceClientWithDealInfo(client, "search") : null),
    [client, enhanceClientWithDealInfo]
  );

  const tabs: { id: ClientHubTab; label: string }[] = [
    { id: "roadmap", label: t("dashboard.tab_roadmap") },
    { id: "profile", label: t("dashboard.tab_profile") },
    { id: "liked-homes", label: t("dashboard.tab_liked_homes") },
    { id: "documents", label: t("dashboard.tab_documents") },
    { id: "docusign", label: t("saved.tab_agreements", { defaultValue: "DocuSign" }) },
    { id: "agenda", label: t("dashboard.tab_agenda") },
    { id: "calendar", label: t("dashboard.tab_calendar") },
  ];

  const agentSubject = useMemo(
    () => (client != null ? { userId: client.id, displayName: client.name } : null),
    [client]
  );

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
          <Text className="text-primary text-sm font-medium">Back to dashboard</Text>
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

  if (!client || !enhancedClient || agentSubject == null) {
    return (
      <Box className="flex-1 items-center justify-center p-6">
        <Text className="text-text-secondary mb-3 text-sm">Client not found.</Text>
        <Pressable
          onPress={() => {
            goBack();
          }}
          className="border-border rounded-lg border px-4 py-2"
        >
          <Text className="text-primary text-sm font-medium">Back to dashboard</Text>
        </Pressable>
      </Box>
    );
  }

  const headerCard = (
    <Box className="mb-4 px-4 pt-6">
      <Card border="light" className="bg-background-base" padding="sm" hover={false}>
        <Box className="flex flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <Pressable
            onPress={() => {
              navigateToPath("/dashboard");
            }}
            className="shrink-0"
          >
            <Text className="text-text-secondary text-sm font-medium">← Back</Text>
          </Pressable>

          <Box className="flex min-w-0 flex-1 flex-row flex-wrap items-center justify-start gap-x-4 gap-y-1">
            <Box className="w-full min-w-0 max-w-md shrink-0 sm:w-auto">
              <ClientSelector
                selectedClientId={clientId}
                onClientChange={handleHubClientChange}
                hideMeOption
                className="w-full"
              />
            </Box>
            <Box className="flex min-w-0 shrink-0 flex-col items-start gap-0.5">
              <Text className="text-text-secondary text-xs">
                Stage: {enhancedClient.deal_stage.replace(/_/g, " ")}
              </Text>
              {enhancedClient.last_agent_action ? (
                <Text className="text-text-secondary text-xs">
                  Last action: {formatRelativeDate(enhancedClient.last_agent_action)}
                </Text>
              ) : null}
            </Box>
          </Box>

          <Box className="ml-auto flex w-full min-w-0 max-w-xl shrink-0 flex-col items-end gap-1 sm:w-auto sm:min-w-96">
            <BodyText size="sm" className="text-text-secondary text-right" as="p">
              {checklistProgressLoading
                ? t("checklists.loading")
                : t("checklists.buyer_journey.progress", {
                    completed: overallProgress.completed,
                    total: overallProgress.total,
                  })}
            </BodyText>
            <Box className="w-full">
              <ChecklistProgressBar
                loading={checklistProgressLoading}
                percent={overallProgress.percent}
                variant="dashboard"
              />
            </Box>
          </Box>
        </Box>

        <Box className="mt-3">
          <UnderlineTabs
            items={tabs}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as ClientHubTab)}
          />
        </Box>
      </Card>
    </Box>
  );

  const isSecondaryScrollTab =
    activeTab === "documents" ||
    activeTab === "docusign" ||
    activeTab === "agenda" ||
    activeTab === "calendar";

  return (
    <Box className="bg-background-base flex-1">
      {headerCard}
      <Box className="min-h-0 flex-1">
        <ScrollView
          className={activeTab === "roadmap" ? "flex-1" : "hidden"}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        >
          <Card border="light" className="bg-background-base" padding="sm" hover={false}>
            <Box className="mb-2 px-1">
              <BodyText size="sm" className="text-text-secondary" as="p">
                {checklistProgressLoading
                  ? t("checklists.loading")
                  : t("checklists.buyer_journey.current_phase", {
                      phase: CHECKLIST_TITLES[currentSection],
                    })}
              </BodyText>
            </Box>
            <UnderlineTabs
              items={(
                ["search", "offer", "escrow", "inspections", "financing", "closing"] as const
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
              phaseIndicatorId={currentSection}
              onChange={(id) => setChecklistTab(id as ChecklistTab)}
              className="mb-4"
            />
            <ClientChecklists
              userId={clientId}
              activeTab={checklistTab}
              hideIntegrationComponents={isAgent}
              onTabChange={setChecklistTab}
            />
          </Card>
        </ScrollView>

        <ScrollView
          className={isSecondaryScrollTab ? "flex-1" : "hidden"}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        >
          <Box className={activeTab === "documents" ? "mt-1" : "hidden"}>
            <ClientDocuments userId={clientId} />
          </Box>
          <Box className={activeTab === "docusign" ? "" : "hidden"}>
            <ClientHubAgreements clientId={clientId} />
          </Box>
          <Box className={activeTab === "agenda" ? "mt-1" : "hidden"}>
            <ClientHubAgenda clientId={clientId} />
          </Box>
          <Box className={activeTab === "calendar" ? "mt-1" : "hidden"}>
            <ClientCalendar userId={clientId} />
          </Box>
        </ScrollView>

        <Box className={activeTab === "liked-homes" ? "min-h-0 flex-1 px-4" : "hidden"}>
          <ClientSavedHomes userId={clientId} />
        </Box>

        <Box className={activeTab === "profile" ? "min-h-0 min-w-0 flex-1 px-4 pb-4" : "hidden"}>
          {isWeb ? (
            <ProfileFeature agentSubject={agentSubject} />
          ) : (
            <ProfileScreen agentSubject={agentSubject} />
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default ClientHubScreen;
