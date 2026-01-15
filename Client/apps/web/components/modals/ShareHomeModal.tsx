import { Share2, MessageCircle, User } from "lucide-react";
import { useState } from "react";

import BaseModal from "./BaseModal";
import Button from "../ui/button/Button";
import KeyTurnLoader from "../ui/loading/KeyTurnLoader";
import { useAgentChats } from "../../../../packages/hooks/data/chat/useAgentChats";
import { useAgentClients } from "../../../../packages/hooks/data/agent/useAgentClients";
import { useUserData } from "../../../../packages/hooks/data/auth/useUserData";
import type { Property } from "../../../../packages/schemas/property";
import type { SearchResult } from "../../../../packages/schemas/search";

type ShareHomeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  property: Property | SearchResult | null;
  onShareSuccess?: () => void;
};

export default function ShareHomeModal({
  isOpen,
  onClose,
  property,
  onShareSuccess,
}: ShareHomeModalProps) {
  const { userProfile } = useUserData();
  const isAgent = userProfile?.is_agent ?? false;

  // For agents: get list of clients
  const { clients, isLoading: isLoadingClients } = useAgentClients();

  // For both: get conversations
  const { conversations, isLoading: isLoadingConversations, sendMessage } = useAgentChats();

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  // Get property ID (zpid, id, or address)
  const getPropertyId = (): string | null => {
    if (!property) return null;

    // Try zpid first (for SearchResult)
    if ("zpid" in property && property.zpid) {
      return String(property.zpid);
    }

    // Try id
    if ("id" in property && property.id) {
      return property.id;
    }

    // Fall back to address
    if (property.address) {
      return property.address;
    }

    return null;
  };

  const propertyId = getPropertyId();
  const propertyAddress = property?.address ?? "this property";

  // Find conversation for selected client (for agents)
  const getConversationId = (clientId: string): string | null => {
    const conversation = conversations.find((c) => c.client_id === clientId);
    return conversation?.id ?? null;
  };

  // For clients: get their agent conversation
  const clientConversation =
    !isAgent && conversations.length > 0 ? conversations[0] : null;

  const handleShare = async () => {
    if (!propertyId) {
      return;
    }

    let conversationId: string | null = null;

    if (isAgent) {
      // Agent sharing with a client
      if (!selectedClientId) {
        return;
      }
      conversationId = getConversationId(selectedClientId);
      if (!conversationId) {
        // Create conversation if it doesn't exist
        conversationId = "new";
      }
    } else {
      // Client sharing with their agent
      if (!clientConversation) {
        return;
      }
      conversationId = clientConversation.id;
    }

    setIsSharing(true);
    try {
      const message = shareMessage.trim() || `Check out ${propertyAddress}!`;
      // Pass client_id when creating a new conversation (for agents)
      const clientIdToPass =
        isAgent && conversationId === "new" ? selectedClientId : undefined;
      await sendMessage(
        conversationId,
        message,
        clientIdToPass ?? undefined,
        propertyId
      );

      // Reset state
      setSelectedClientId(null);
      setShareMessage("");

      if (onShareSuccess) {
        onShareSuccess();
      }
      onClose();
    } catch (error) {
      log.error(LOG_CATEGORIES.MESSAGES, "Error sharing home", error);
    } finally {
      setIsSharing(false);
    }
  };

  const canShare = isAgent
    ? selectedClientId !== null && propertyId !== null
    : clientConversation !== null && propertyId !== null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Property"
      size="md"
      headerContent={
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Share Property</h3>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Property Info */}
        {property && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-900">
              {propertyAddress}
            </p>
            {property.price && (
              <p className="text-sm text-gray-600">
                {typeof property.price === "number"
                  ? `$${property.price.toLocaleString()}`
                  : property.price}
              </p>
            )}
          </div>
        )}

        {/* Client Selection (for agents) */}
        {isAgent && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Share with client
            </label>
            {isLoadingClients ? (
              <div className="flex items-center justify-center py-4">
                <KeyTurnLoader message="Loading clients..." />
              </div>
            ) : clients.length === 0 ? (
              <p className="text-sm text-gray-500">
                No clients available. Add clients to share properties with them.
              </p>
            ) : (
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selectedClientId === client.id
                        ? "border-brown bg-beige/20"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-beige">
                        <User className="h-4 w-4 text-black" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {client.name}
                        </p>
                        <p className="text-xs text-gray-500">{client.email}</p>
                      </div>
                      {selectedClientId === client.id && (
                        <div className="h-2 w-2 rounded-full bg-brown" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Agent Info (for clients) */}
        {!isAgent && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Share with agent
            </label>
            {isLoadingConversations ? (
              <div className="flex items-center justify-center py-4">
                <KeyTurnLoader message="Loading..." />
              </div>
            ) : clientConversation ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gold">
                    <MessageCircle className="h-4 w-4 text-black" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Your Agent
                    </p>
                    <p className="text-xs text-gray-500">
                      {clientConversation.client_name || "Agent"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No agent assigned
              </p>
            )}
          </div>
        )}

        {/* Optional Message */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Message (optional)
          </label>
          <textarea
            value={shareMessage}
            onChange={(e) => setShareMessage(e.target.value)}
            placeholder={`Check out ${propertyAddress}!`}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isSharing}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleShare}
            disabled={!canShare || isSharing}
            className="flex-1"
          >
            {isSharing ? "Sharing..." : "Share"}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
