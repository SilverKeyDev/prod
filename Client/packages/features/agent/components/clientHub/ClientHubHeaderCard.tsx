import React from "react";

import type { ClientDealInfo } from "packages/features/agent";
import { ChecklistProgressBar } from "packages/features/checklists";
import { ClientSelector } from "packages/ui";
import { Box, Pressable, Text } from "packages/ui/components/structure/primitives";
import { UnderlineTabs } from "packages/ui/components/structure/tabs";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Card from "packages/ui/components/surfaces/cards/Card";
import { dateParseISO } from "packages/utils/core/date";

export type ClientHubTab = "roadmap" | "profile" | "liked-homes" | "library" | "schedule";

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

type ClientHubHeaderCardProps = {
  resolvedClientId: string;
  enhancedClient: ClientDealInfo;
  tabs: { id: ClientHubTab; label: string }[];
  activeTab: ClientHubTab;
  onTabChange: (tab: ClientHubTab) => void;
  onClientChange: (nextId: string | null) => void;
  onBack: () => void;
  checklistProgressLoading: boolean;
  progressLabel: string;
  overallProgressPercent: number;
};

export function ClientHubHeaderCard({
  resolvedClientId,
  enhancedClient,
  tabs,
  activeTab,
  onTabChange,
  onClientChange,
  onBack,
  checklistProgressLoading,
  progressLabel,
  overallProgressPercent,
}: ClientHubHeaderCardProps) {
  return (
    <Box className="mb-4 px-4 pt-6">
      <Card border="light" className="bg-background-base" padding="sm" hover={false}>
        <Box className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-3 sm:gap-y-2">
          <Box className="flex min-w-0 flex-row items-center gap-2 sm:flex-1 sm:gap-3">
            <Pressable onPress={onBack} className="shrink-0">
              <Text className="text-text-secondary text-sm font-medium">← Back</Text>
            </Pressable>

            <Box className="min-w-0 flex-1">
              <ClientSelector
                selectedClientId={resolvedClientId}
                onClientChange={onClientChange}
                hideMeOption
                className="w-full min-w-0"
              />
            </Box>

            <Box className="flex max-w-[38%] shrink-0 flex-col items-end gap-0.5 text-right sm:max-w-none">
              <Text className="text-text-secondary truncate text-xs">
                Stage: {enhancedClient.deal_stage.replace(/_/g, " ")}
              </Text>
              {enhancedClient.last_agent_action ? (
                <Text className="text-text-secondary truncate text-xs">
                  Last action: {formatRelativeDate(enhancedClient.last_agent_action)}
                </Text>
              ) : null}
            </Box>
          </Box>

          <Box className="flex w-full min-w-0 flex-col gap-1 sm:ml-auto sm:w-auto sm:max-w-xl sm:shrink-0 sm:items-end">
            <BodyText size="sm" className="text-text-secondary text-right" as="p">
              {progressLabel}
            </BodyText>
            <Box className="w-full">
              <ChecklistProgressBar
                loading={checklistProgressLoading}
                percent={overallProgressPercent}
                variant="dashboard"
              />
            </Box>
          </Box>
        </Box>

        <Box className="mt-3">
          <UnderlineTabs
            items={tabs}
            activeId={activeTab}
            onChange={(id) => onTabChange(id as ClientHubTab)}
          />
        </Box>
      </Card>
    </Box>
  );
}
