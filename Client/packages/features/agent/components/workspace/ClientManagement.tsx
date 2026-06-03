import { useMemo, useState } from "react";

import { Icon } from "@ui/icons";

import type { AgentClient } from "packages/api";
import { useLocalization } from "packages/contexts";
import { ClientSearchModal } from "packages/features/agent/components/modals";
import { useAgentChats } from "packages/features/messaging";
import MiniLogo from "packages/ui/components/asset/MiniLogo";
import { Box } from "packages/ui/components/primitives";
import { SidebarInsetListSelectionStripe } from "packages/ui/components/sidebar/SidebarInsetListSelectionStripe";
import {
  sidebarInsetListRowClass,
  sidebarInsetListRowSelectedProps,
} from "packages/ui/components/sidebar/sidebarTheme";
import { getMessagePreview } from "packages/utils/messaging/messagePreview";

import { BodyText, Button, KeyTurnLoader, Title } from "@/components/ui";
import AgentClientListRow from "@/features/agent/components/clientList/AgentClientListRow";
import {
  type AgentClientSortMode,
  sortAgentClients,
} from "@/features/agent/utils/agentClientListSort";
import { agentClientActionFromConversation } from "@/features/agent/utils/clientList/agentClientListRowHelpers";
type ClientManagementProps = {
  clients: AgentClient[];
  isLoading: boolean;
  selectedClientId: string | null;
  onClientSelect: (clientId: string) => void;
};
export default function ClientManagement({
  clients,
  isLoading,
  selectedClientId,
  onClientSelect,
}: ClientManagementProps) {
  const { t } = useLocalization();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [clientSort, setClientSort] = useState<AgentClientSortMode>("recent");
  const { conversations } = useAgentChats();
  // Create a map of client_id -> conversation for quick lookup
  const conversationMap = useMemo(
    () => new Map(conversations.map((conv) => [conv.client_id, conv])),
    [conversations]
  );
  const sortedClients = useMemo(
    () =>
      sortAgentClients(clients, clientSort, conversationMap, (client) =>
        agentClientActionFromConversation(client, conversationMap.get(client.id))
      ),
    [clients, clientSort, conversationMap]
  );
  return (
    <aside
      className={`${
        isSidebarExpanded ? "flex translate-x-0" : "hidden -translate-x-full"
      } flex-col transition-transform duration-300 ease-in-out xl:flex xl:w-80 xl:translate-x-0`}
    >
      {/* Fixed Header */}
      <Box className="border-border bg-background-surface flex-shrink-0 rounded-t-xl border-b p-3">
        <Box className="mb-2 flex items-center justify-between">
          <Title as="h2" size="lg" className="flex items-center gap-2 font-medium text-neutral-800">
            <MiniLogo size="sm" />
            {t("agent.clients")}
          </Title>

          <Box className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowSearchModal(true)}
              className="inline-flex items-center justify-center rounded-lg bg-neutral-100 px-2 py-1.5 text-neutral-700 transition hover:bg-neutral-200"
              label="Search for clients"
              title="Add client"
            >
              <Icon name="plus" className="h-4 w-4 text-neutral-600" />
            </Button>
            {/* TABLET/MOBILE side arrow button to collapse when extended */}
            {isSidebarExpanded && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsSidebarExpanded(false)}
                className="inline-flex items-center justify-center rounded-lg bg-neutral-100 px-3 py-2 text-neutral-700 transition hover:bg-neutral-200 xl:hidden"
                label={t("agent.collapse_client_list")}
                aria-expanded={isSidebarExpanded}
              >
                <Icon name="chevron-left" className="h-4 w-4 text-neutral-700" />
              </Button>
            )}
          </Box>
        </Box>
        {clients.length > 0 && !isLoading ? (
          <Box className="mt-2 flex gap-1 px-1">
            {(
              [
                ["recent", "agent.sort_clients_recent"],
                ["name", "agent.sort_clients_name"],
                ["stage", "agent.sort_clients_stage"],
              ] as const
            ).map(([value, labelKey]) => (
              <Button
                key={value}
                type="button"
                variant={clientSort === value ? "secondary" : "ghost"}
                className="flex-1 px-2 py-1.5 text-xs"
                label={t(labelKey)}
                onClick={() => setClientSort(value)}
              >
                {t(labelKey)}
              </Button>
            ))}
          </Box>
        ) : null}
      </Box>

      {/* Scrollable Client List */}
      <Box className="bg-background-surface flex-1 overflow-y-auto">
        {isLoading ? (
          <Box className="p-3 text-center">
            <Box className="mb-2">
              <KeyTurnLoader message={t("agent.loading_clients")} />
            </Box>
          </Box>
        ) : clients.length === 0 ? (
          <Box className="px-3 py-2 text-center">
            <Icon name="message-circle" className="mx-auto mb-2 h-12 w-12 text-neutral-400" />
            <BodyText as="p" size="sm" className="text-neutral-600">
              {t("agent.no_clients_yet")}
            </BodyText>
            <BodyText as="p" size="xs" className="mt-1 text-neutral-500">
              {t("agent.clients_appear_once_assigned")}
            </BodyText>
          </Box>
        ) : (
          sortedClients.map((client) => {
            const conversation = conversationMap.get(client.id);
            const messagePreview = conversation?.last_message
              ? getMessagePreview({ content: conversation.last_message })
              : null;
            const isSelected = selectedClientId === client.id;
            const selectClient = () => {
              onClientSelect(client.id);
              setIsSidebarExpanded(false);
            };
            return (
              <Box
                key={client.id}
                role="button"
                tabIndex={0}
                {...sidebarInsetListRowSelectedProps(isSelected)}
                onClick={selectClient}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectClient();
                  }
                }}
                className={sidebarInsetListRowClass(isSelected)}
              >
                {isSelected ? <SidebarInsetListSelectionStripe /> : null}
                <AgentClientListRow
                  embedded
                  client={client}
                  conversation={conversation}
                  variant="sidebar"
                  detailLine={messagePreview ?? client.email ?? undefined}
                />
              </Box>
            );
          })
        )}
      </Box>

      {/* Search Modal */}
      <ClientSearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
    </aside>
  );
}
