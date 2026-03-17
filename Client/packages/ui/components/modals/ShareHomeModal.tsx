import { useState } from "react";

import Button from "@ui/button/Button";
import CancelButton from "@ui/button/CancelButton";
import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { Property, SearchResult } from "packages/features/search/types";
import { formatAddress } from "packages/features/search/types/search/propertyDetailsFormatters";
import { useAgentChats } from "packages/hooks/data/chat/useAgentChats";
import { log, LOG_CATEGORIES } from "packages/logger";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader.web";
import { Box } from "packages/ui/components/primitives";
import { getShareHomeConversationId, getShareHomePropertyId } from "packages/utils/share";

import BaseModal from "@/components/modals/BaseModal";
import { BodyText, Label, Textarea, Title } from "@/components/ui";
import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
import { useIsAgent } from "@/features/homeauth/hooks/store/useIsAgent";
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
  const { conversations, isLoading: isLoadingConversations, sendMessage } = useAgentChats();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const propertyId = getShareHomePropertyId(property);
  const propertyAddress =
    formatAddress(property?.address as string | object | null | undefined) || "this property";
  // For clients: get their agent conversation
  const clientConversation = !isAgent && conversations.length > 0 ? conversations[0] : null;
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
      conversationId = getShareHomeConversationId(conversations, selectedClientId);
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
      const clientIdToPass = isAgent && conversationId === "new" ? selectedClientId : undefined;
      await sendMessage(conversationId, message, clientIdToPass ?? undefined, propertyId);
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
        <Box className="flex items-center gap-2">
          <Icon name="share" className="text-text-secondary h-5 w-5" />
          <Title as="h3" size="lg" className="text-text-primary font-medium">
            {t("modals.share_home.title")}
          </Title>
        </Box>
      }
    >
      <Box className="space-y-4">
        {/* Property Info */}
        {property && (
          <Box className="border-border bg-primary-muted rounded-lg border p-3">
            <BodyText as="p" size="sm" className="text-text-primary font-medium">
              {propertyAddress}
            </BodyText>
            {property.price != null && property.price !== "" && (
              <BodyText as="p" size="sm" className="text-text-secondary">
                {(() => {
                  const price = property.price as string | number;
                  return typeof price === "number" ? `$${price.toLocaleString()}` : price;
                })()}
              </BodyText>
            )}
          </Box>
        )}

        {/* Client Selection (for agents) */}
        {isAgent && (
          <Box>
            <Label htmlFor="share-client-first" className="mb-2 block">
              {t("modals.share_home.share_with_client")}
            </Label>
            {isLoadingClients ? (
              <Box className="flex items-center justify-center py-4">
                <KeyTurnLoader message={t("client_selector.loading_clients")} />
              </Box>
            ) : clients.length === 0 ? (
              <BodyText as="p" size="sm" className="text-text-secondary">
                {t("modals.share_home.no_clients")}
              </BodyText>
            ) : (
              <Box className="max-h-48 space-y-2 overflow-y-auto">
                {clients.map((client, index) => (
                  <Button
                    key={client.id}
                    id={index === 0 ? "share-client-first" : undefined}
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedClientId(client.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selectedClientId === client.id
                        ? "border-primary bg-primary-muted"
                        : "border-border hover:border-border hover:bg-accent-muted"
                    }`}
                  >
                    <Box className="flex items-center gap-2">
                      <Box className="bg-accent-muted flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                        <Icon name="user" className="h-4 w-4 text-black" />
                      </Box>
                      <Box className="min-w-0 flex-1">
                        <BodyText as="p" size="sm" className="text-text-primary font-medium">
                          {client.name}
                        </BodyText>
                        <BodyText as="p" size="xs" className="text-text-secondary">
                          {client.email}
                        </BodyText>
                      </Box>
                      {selectedClientId === client.id && (
                        <Box className="bg-primary h-2 w-2 rounded-full" />
                      )}
                    </Box>
                  </Button>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Agent Info (for clients) */}
        {!isAgent && (
          <fieldset className="m-0 border-0 p-0">
            <legend className="text-text-primary mb-2 block text-sm font-medium">
              {t("modals.share_home.share_with_agent")}
            </legend>
            {isLoadingConversations ? (
              <Box className="flex items-center justify-center py-4">
                <KeyTurnLoader message={t("common.loading")} />
              </Box>
            ) : clientConversation ? (
              <Box className="border-border bg-primary-muted rounded-lg border p-3">
                <Box className="flex items-center gap-2">
                  <Box className="bg-accent flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                    <Icon name="message-circle" className="h-4 w-4 text-black" />
                  </Box>
                  <Box>
                    <BodyText as="p" size="sm" className="text-text-primary font-medium">
                      {t("modals.share_home.your_agent")}
                    </BodyText>
                    <BodyText as="p" size="xs" className="text-text-secondary">
                      {clientConversation.client_name || t("house.agent")}
                    </BodyText>
                  </Box>
                </Box>
              </Box>
            ) : (
              <BodyText as="p" size="sm" className="text-text-secondary">
                {t("modals.share_home.no_agent")}
              </BodyText>
            )}
          </fieldset>
        )}

        {/* Optional Message */}
        <Box>
          <Label htmlFor="share-message" className="mb-2 block">
            {t("modals.share_home.message_optional")}
          </Label>
          <Textarea
            id="share-message"
            value={shareMessage}
            onChange={(e) => setShareMessage(e.target.value)}
            placeholder={`Check out ${propertyAddress}!`}
            className="focus:border-primary focus:ring-accent-muted border-border w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            rows={3}
          />
        </Box>

        {/* Actions */}
        <Box className="flex gap-3 pt-2">
          <CancelButton onClick={onClose} className="flex-1" disabled={isSharing}>
            {t("common.cancel")}
          </CancelButton>
          <Button
            variant="primary"
            onClick={handleShare}
            disabled={!canShare || isSharing}
            className="flex-1"
          >
            {isSharing ? t("modals.share_home.sharing") : t("modals.share_home.share")}
          </Button>
        </Box>
      </Box>
    </BaseModal>
  );
}
