import { useEffect, useRef, useState } from "react";

import { Icon } from "@ui/icons";

import { useUserData } from "packages/hooks/data/auth/useUserData";
import { useAuthStore, useUIStore } from "packages/store";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader.web";
import { ProfileAvatar } from "packages/ui/components/avatar";
import { Textarea } from "packages/ui/components/form/FormField";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Button, CancelButton, CloseButton, Input, Title } from "@/components/ui";
import { getMessagingConfig } from "@/features/agent/components/messaging/screen/messagingConfig";
import { useClientSearch } from "@/features/agent/hooks/data/useAgentSearch";
import { useConnectionRequests } from "@/features/agent/hooks/data/useConnectionRequests";
import { connectionRequestApiErrorMessage } from "@/features/agent/utils/connectionRequestApiError";
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
  const authUser = useAuthStore((s) => s.user);
  const initiatorId = userProfile?.id ?? authUser?.id;
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  const handleSendRequest = async (clientId: string) => {
    if (!initiatorId) {
      enqueueToast({
        type: "error",
        message: "Profile not loaded. Please try again in a moment.",
      });
      return;
    }
    try {
      const { alreadyPending } = await createRequestAsInitiator(
        initiatorId,
        clientId,
        true,
        message.trim() || undefined
      );
      if (alreadyPending) {
        enqueueToast({
          type: "warning",
          message: "A connection request is already pending with this client.",
        });
        return;
      }
      enqueueToast({ type: "success", message: "Request sent" });
      setMessage("");
      setSelectedClientId(null);
      onClose();
    } catch (err: unknown) {
      enqueueToast({
        type: "error",
        message: connectionRequestApiErrorMessage(err),
      });
    }
  };
  if (!isOpen) return null;
  return (
    <Box className="bg-overlay-backdrop z-modal fixed inset-0 flex items-center justify-center p-4">
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
              className="border-border focus:border-input-variant-focus-border bg-background-surface w-full rounded-lg border px-10 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-neutral-400"
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
                      ? "border-border bg-primary-muted"
                      : "border-border hover:bg-accent-muted"
                  }`}
                >
                  {selectedClientId === client.id ? (
                    <Box className="space-y-3">
                      <Box className="flex items-start gap-3">
                        <Box className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-neutral-100">
                          <ProfileAvatar
                            imageUrl={client.profile_picture}
                            label={client.name}
                            imageClassName="h-full w-full object-cover"
                          />
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
                        placeholder="Add a note (optional)"
                        className="border-border focus:border-input-variant-focus-border w-full rounded-lg border px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-neutral-400"
                        rows={3}
                      />
                      <Box className="flex gap-2">
                        <Button
                          onClick={() => handleSendRequest(client.id)}
                          disabled={isCreatingRequest || !initiatorId}
                          variant="tertiary"
                          size="md"
                          icon={<Icon name="send" />}
                          iconPosition="left"
                          className="flex-1"
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
                      contentAlign="start"
                      onClick={() => setSelectedClientId(client.id)}
                      className="flex h-auto min-h-0 w-full items-start justify-start gap-3 py-0 text-left"
                    >
                      <Box className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-neutral-100">
                        <ProfileAvatar
                          imageUrl={client.profile_picture}
                          label={client.name}
                          imageClassName="h-full w-full object-cover"
                        />
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
