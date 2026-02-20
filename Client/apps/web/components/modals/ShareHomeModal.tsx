import { useState } from "react";

import Button from "@ui/button/Button";
import CancelButton from "@ui/button/CancelButton";
import KeyTurnLoader from "@ui/loading/KeyTurnLoader.web";
import { log, LOG_CATEGORIES } from "logger";
import { MessageCircle, Share, User } from "lucide-react";

import { useLocalization } from "packages/contexts";
import { useAgentClients } from "packages/hooks/data/agent/useAgentClients";
import { useAgentChats } from "packages/hooks/data/chat/useAgentChats";
import { useIsAgent } from "packages/hooks/store/auth/useIsAgent";
import type { Property } from "packages/schemas/property";
import type { SearchResult } from "packages/schemas/search";
import { formatAddress } from "packages/utils/domain/search/propertyDetailsFormatters";

import BaseModal from "@/components/modals/BaseModal";
import { BodyText, Label, Textarea, Title } from "@/components/ui/index.web";

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
  const { t } = useLocalization();
  const isAgent = useIsAgent();

  // For agents: get list of clients
  const { clients, isLoading: isLoadingClients } = useAgentClients();

  // For both: get conversations
  const {
    conversations,
    isLoading: isLoadingConversations,
    sendMessage,
  } = useAgentChats();

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

    // Fall back to address (must be string for API)
    const addr = property.address;
    if (addr != null) {
      const str = typeof addr === "string" ? addr : formatAddress(addr);
      return str || null;
    }

    return null;
  };

  const propertyId = getPropertyId();
  const propertyAddress =
    formatAddress(property?.address as string | object | null | undefined) ||
    "this property";

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
        propertyId,
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
      title={t("modals.share_home.title")}
      size="md"
      headerContent={
        <div className="flex items-center gap-2">
          <Share className="h-5 w-5 text-gray-600" />
          <Title as="h3" size="lg" className="font-medium text-gray-900">
            {t("modals.share_home.title")}
          </Title>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Property Info */}
        {property && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <BodyText as="p" size="sm" className="font-medium text-gray-900">
              {propertyAddress}
            </BodyText>
            {property.price && (
              <BodyText as="p" size="sm" className="text-gray-600">
                {typeof property.price === "number"
                  ? `$${property.price.toLocaleString()}`
                  : property.price}
              </BodyText>
            )}
          </div>
        )}

        {/* Client Selection (for agents) */}
        {isAgent && (
          <div>
            <Label htmlFor="share-client-first" className="mb-2 block">
              {t("modals.share_home.share_with_client")}
            </Label>
            {isLoadingClients ? (
              <div className="flex items-center justify-center py-4">
                <KeyTurnLoader message={t("client_selector.loading_clients")} />
              </div>
            ) : clients.length === 0 ? (
              <BodyText as="p" size="sm" className="text-gray-500">
                {t("modals.share_home.no_clients")}
              </BodyText>
            ) : (
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {clients.map((client, index) => (
                  <Button
                    key={client.id}
                    id={index === 0 ? "share-client-first" : undefined}
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedClientId(client.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selectedClientId === client.id
                        ? "border-olive bg-olive/10"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-beige">
                        <User className="h-4 w-4 text-black" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <BodyText
                          as="p"
                          size="sm"
                          className="font-medium text-gray-900"
                        >
                          {client.name}
                        </BodyText>
                        <BodyText as="p" size="xs" className="text-gray-500">
                          {client.email}
                        </BodyText>
                      </div>
                      {selectedClientId === client.id && (
                        <div className="h-2 w-2 rounded-full bg-olive" />
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Agent Info (for clients) */}
        {!isAgent && (
          <fieldset className="border-0 p-0 m-0">
            <legend className="mb-2 block text-sm font-medium text-gray-700">
              {t("modals.share_home.share_with_agent")}
            </legend>
            {isLoadingConversations ? (
              <div className="flex items-center justify-center py-4">
                <KeyTurnLoader message={t("common.loading")} />
              </div>
            ) : clientConversation ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gold">
                    <MessageCircle className="h-4 w-4 text-black" />
                  </div>
                  <div>
                    <BodyText
                      as="p"
                      size="sm"
                      className="font-medium text-gray-900"
                    >
                      {t("modals.share_home.your_agent")}
                    </BodyText>
                    <BodyText as="p" size="xs" className="text-gray-500">
                      {clientConversation.client_name || t("cards.agent")}
                    </BodyText>
                  </div>
                </div>
              </div>
            ) : (
              <BodyText as="p" size="sm" className="text-gray-500">
                {t("modals.share_home.no_agent")}
              </BodyText>
            )}
          </fieldset>
        )}

        {/* Optional Message */}
        <div>
          <Label htmlFor="share-message" className="mb-2 block">
            {t("modals.share_home.message_optional")}
          </Label>
          <Textarea
            id="share-message"
            value={shareMessage}
            onChange={(e) => setShareMessage(e.target.value)}
            placeholder={`Check out ${propertyAddress}!`}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-olive focus:outline-none focus:ring-2 focus:ring-olive/20"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <CancelButton
            onClick={onClose}
            className="flex-1"
            disabled={isSharing}
          >
            {t("common.cancel")}
          </CancelButton>
          <Button
            variant="primary"
            onClick={handleShare}
            disabled={!canShare || isSharing}
            className="flex-1"
          >
            {isSharing
              ? t("modals.share_home.sharing")
              : t("modals.share_home.share")}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
