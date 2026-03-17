import { useEffect, useRef, useState } from "react";

import { Icon } from "@ui/icons";

import { useUserData } from "packages/hooks/data/auth/useUserData";
import { useUIStore } from "packages/store";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader.web";
import { Box } from "packages/ui/components/primitives";

import {
  BodyText,
  Button,
  CancelButton,
  CloseButton,
  Input,
  Textarea,
  Title,
} from "@/components/ui";
import { getMessagingConfig } from "@/features/agent/components/messagingConfig";
import { useClientSearch } from "@/features/agent/hooks/data/useAgentSearch";
import { useConnectionRequests } from "@/features/agent/hooks/data/useConnectionRequests";
type ClientSearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
};
export default function ClientSearchModal({ isOpen, onClose }: ClientSearchModalProps) {
  const config = getMessagingConfig("agent");
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { clients, isLoading } = useClientSearch(searchQuery, isOpen);
  const { createRequestAsInitiator, isCreatingRequest } = useConnectionRequests();
  const { userProfile } = useUserData();
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  const handleSendRequest = async (clientId: string) => {
    if (!userProfile?.id) return;
    try {
      await createRequestAsInitiator(userProfile.id, clientId, true, message.trim() || undefined);
      enqueueToast({
        type: "success",
        message: "Connection request sent",
      });
      setMessage("");
      setSelectedClientId(null);
      onClose();
    } catch {
      enqueueToast({
        type: "error",
        message: "Failed to send connection request",
      });
    }
  };
  if (!isOpen) return null;
  return (
    <Box className="bg-overlay-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <Box className="bg-background-surface relative w-full max-w-2xl rounded-xl shadow-lg">
        {/* Header */}
        <Box className="border-border flex items-center justify-between border-b p-4">
          <Title as="h2" size="lg" className="text-text-primary font-medium">
            {config.searchModal.title}
          </Title>
          <CloseButton onClick={onClose} size="sm" label="Close" />
        </Box>

        {/* Search Input */}
        <Box className="border-border border-b p-4">
          <Box className="relative">
            <Icon
              name="search"
              className="text-text-secondary absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2"
            />
            <Input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={config.searchModal.searchPlaceholder}
              className="border-border focus:border-primary focus:ring-accent-muted bg-background-surface w-full rounded-lg border px-10 py-2.5 text-base focus:outline-none focus:ring-2"
            />
          </Box>
        </Box>

        {/* Results */}
        <Box className="max-h-96 overflow-y-auto p-4">
          {searchQuery.length < 2 ? null : isLoading ? (
            <Box className="py-8 text-center">
              <KeyTurnLoader message={config.searchModal.searchingMessage} />
            </Box>
          ) : clients.length === 0 ? (
            <Box className="text-text-secondary py-8 text-center text-base font-medium">
              {config.searchModal.noResultsMessage} "{searchQuery}"
            </Box>
          ) : (
            <Box className="space-y-2">
              {clients.map((client) => (
                <Box
                  key={client.id}
                  className={`rounded-lg border p-3 transition-colors ${
                    selectedClientId === client.id
                      ? "border-primary bg-primary-muted"
                      : "border-border hover:bg-accent-muted"
                  }`}
                >
                  {selectedClientId === client.id ? (
                    <Box className="space-y-3">
                      <Box className="flex items-start gap-3">
                        <Box className="bg-accent-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                          <Icon name="user" className="text-text-primary h-5 w-5" />
                        </Box>
                        <Box className="flex-1">
                          <Title as="h3" size="md" className="text-text-primary font-semibold">
                            {client.name}
                          </Title>
                          <BodyText as="p" size="md" className="text-text-secondary font-medium">
                            {client.email}
                          </BodyText>
                        </Box>
                      </Box>
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Add a message (optional)..."
                        className="border-border focus:border-primary focus:ring-accent-muted w-full rounded-lg border px-3 py-2 text-base focus:outline-none focus:ring-2"
                        rows={3}
                      />
                      <Box className="flex gap-2">
                        <Button
                          onClick={() => handleSendRequest(client.id)}
                          disabled={isCreatingRequest}
                          variant="outline"
                          size="md"
                          icon={<Icon name="send" />}
                          iconPosition="left"
                          className="bg-accent hover:bg-accent-hover border-accent flex-1 text-white hover:text-white"
                        >
                          {config.searchModal.sendButtonLabel}
                        </Button>
                        <CancelButton
                          onClick={() => {
                            setSelectedClientId(null);
                            setMessage("");
                          }}
                          size="md"
                        >
                          Cancel
                        </CancelButton>
                      </Box>
                    </Box>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedClientId(client.id)}
                      className="flex h-auto min-h-0 w-full items-start justify-start gap-3 py-0 text-left"
                    >
                      <Box className="bg-accent-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                        <Icon name="user" className="text-text-primary h-5 w-5" />
                      </Box>
                      <Box className="flex-1">
                        <Title as="h3" size="md" className="text-text-primary font-semibold">
                          {client.name}
                        </Title>
                        <BodyText as="p" size="md" className="text-text-secondary font-medium">
                          {client.email}
                        </BodyText>
                        {client.phone && (
                          <BodyText as="p" size="sm" className="text-text-disabled font-medium">
                            {client.phone}
                          </BodyText>
                        )}
                      </Box>
                    </Button>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
