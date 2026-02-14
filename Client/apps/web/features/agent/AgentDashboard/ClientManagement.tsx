import {
  MessageCircle,
  User as UserIcon,
  ChevronLeft,
  Plus,
} from "lucide-react";
import { useState } from "react";

import MiniLogo from "../../../components/ui/asset/MiniLogo";
import { KeyTurnLoader } from "../../../components/ui";
import { useAgentChats } from "../../../../../packages/hooks/data/chat/useAgentChats";
import { ClientSearchModal } from "../modals";
import type { AgentClient } from "../../../../../packages/config/api";

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
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const { conversations } = useAgentChats();

  // Create a map of client_id -> conversation for quick lookup
  const conversationMap = new Map(
    conversations.map((conv) => [conv.client_id, conv]),
  );

  return (
    <aside
      className={`${
        isSidebarExpanded ? "flex translate-x-0" : "hidden -translate-x-full"
      } flex-col transition-transform duration-300 ease-in-out xl:flex xl:w-80 xl:translate-x-0`}
    >
      {/* Fixed Header */}
      <div className="flex-shrink-0 rounded-t-xl border-b border-beige bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-medium text-black">
            <MiniLogo size="sm" />
            Clients
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearchModal(true)}
              className="inline-flex items-center justify-center rounded-lg bg-white px-2 py-1.5 transition hover:bg-beige/10"
              aria-label="Search for clients"
              title="Add client"
            >
              <Plus className="h-4 w-4 text-black" />
            </button>
            {/* TABLET/MOBILE side arrow button to collapse when extended */}
            {isSidebarExpanded && (
              <button
                onClick={() => setIsSidebarExpanded(false)}
                className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 transition hover:bg-beige/10 xl:hidden"
                aria-label="Collapse client list"
                aria-expanded={isSidebarExpanded}
              >
                <ChevronLeft className="h-4 w-4 text-black" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Client List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-3 text-center">
            <div className="mb-2">
              <KeyTurnLoader message="Loading clients..." />
            </div>
          </div>
        ) : clients.length === 0 ? (
          <div className="p-3 text-center">
            <MessageCircle className="mx-auto mb-3 h-12 w-12 text-black/30" />
            <p className="text-sm text-black/60">No clients yet</p>
            <p className="mt-1 text-xs text-black/40">
              Clients will appear here once assigned.
            </p>
          </div>
        ) : (
          clients.map((client) => {
            const conversation = conversationMap.get(client.id);
            return (
              <div
                key={client.id}
                onClick={() => {
                  onClientSelect(client.id);
                  setIsSidebarExpanded(false);
                }}
                className={`group cursor-pointer border-b border-beige/50 p-3 transition-colors hover:bg-beige/10 ${
                  selectedClientId === client.id ? "bg-beige/20" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-beige">
                    <UserIcon className="h-5 w-5 text-black" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 truncate text-sm font-medium text-black">
                      {client.name}
                    </h3>
                    {conversation?.last_message ? (
                      <p className="truncate text-xs text-black/50">
                        {conversation.last_message}
                      </p>
                    ) : (
                      <p className="truncate text-xs text-black/50">
                        {client.email}
                      </p>
                    )}
                    {client.phone && !conversation?.last_message && (
                      <p className="truncate text-xs text-black/40">
                        {client.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Search Modal */}
      <ClientSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
    </aside>
  );
}
