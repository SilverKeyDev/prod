import { useState } from "react";

import { Icon } from "@ui/icons";

import type { AgentClient } from "packages/config/http/api";
import { useLocalization } from "packages/contexts";
import { ClientSearchModal } from "packages/features/agent/components/modals";
import { useAgentChats } from "packages/hooks/data/chat/useAgentChats";
import MiniLogo from "packages/ui/components/asset/MiniLogo";

import { BodyText, Button, KeyTurnLoader, Title } from "@/components/ui";
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
  const { conversations } = useAgentChats();
  // Create a map of client_id -> conversation for quick lookup
  const conversationMap = new Map(conversations.map((conv) => [conv.client_id, conv]));
  return (
    <aside
      className={`${isSidebarExpanded ? "flex translate-x-0" : "hidden -translate-x-full"} flex-col transition-transform duration-300 ease-in-out xl:flex xl:w-80 xl:translate-x-0`}
    >
      {/* Fixed Header */}
      <div className="border-beige flex-shrink-0 rounded-t-xl border-b bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <Title as="h2" size="lg" className="flex items-center gap-2 font-medium text-black">
            <MiniLogo size="sm" />
            {t("agent.clients")}
          </Title>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowSearchModal(true)}
              className="hover:bg-beige/10 inline-flex items-center justify-center rounded-lg bg-white px-2 py-1.5 transition"
              label="Search for clients"
              title="Add client"
            >
              <Icon name="plus" className="h-4 w-4 text-black" />
            </Button>
            {/* TABLET/MOBILE side arrow button to collapse when extended */}
            {isSidebarExpanded && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsSidebarExpanded(false)}
                className="hover:bg-beige/10 inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 transition xl:hidden"
                label={t("agent.collapse_client_list")}
                aria-expanded={isSidebarExpanded}
              >
                <Icon name="chevron-left" className="h-4 w-4 text-black" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Client List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-3 text-center">
            <div className="mb-2">
              <KeyTurnLoader message={t("agent.loading_clients")} />
            </div>
          </div>
        ) : clients.length === 0 ? (
          <div className="p-3 text-center">
            <Icon name="message-circle" className="mx-auto mb-3 h-12 w-12 text-black/30" />
            <BodyText as="p" size="sm" className="text-black/60">
              {t("agent.no_clients_yet")}
            </BodyText>
            <BodyText as="p" size="xs" className="mt-1 text-black/40">
              {t("agent.clients_appear_once_assigned")}
            </BodyText>
          </div>
        ) : (
          clients.map((client) => {
            const conversation = conversationMap.get(client.id);
            return (
              <div
                key={client.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  onClientSelect(client.id);
                  setIsSidebarExpanded(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClientSelect(client.id);
                    setIsSidebarExpanded(false);
                  }
                }}
                className={`border-beige/50 hover:bg-beige/10 group cursor-pointer border-b p-3 transition-colors ${selectedClientId === client.id ? "bg-beige/20" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className="bg-beige flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                    <Icon name="user" className="h-5 w-5 text-black" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Title as="h3" size="sm" className="mb-1 truncate font-medium text-black">
                      {client.name}
                    </Title>
                    {conversation?.last_message ? (
                      <BodyText as="p" className="truncate text-xs text-black/50">
                        {conversation.last_message}
                      </BodyText>
                    ) : (
                      <BodyText as="p" className="truncate text-xs text-black/50">
                        {client.email}
                      </BodyText>
                    )}
                    {client.phone && !conversation?.last_message && (
                      <BodyText as="p" className="truncate text-xs text-black/40">
                        {client.phone}
                      </BodyText>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Search Modal */}
      <ClientSearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
    </aside>
  );
}
