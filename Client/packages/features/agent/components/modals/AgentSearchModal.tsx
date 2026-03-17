import { useEffect, useRef, useState } from "react";

import { Icon } from "@ui/icons";

import { useUserData } from "packages/hooks/data/auth/useUserData";
import { useUIStore } from "packages/store";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader.web";
import Button from "packages/ui/components/button/Button";
import CloseButton from "packages/ui/components/button/CloseButton";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Input, Label, Textarea, Title } from "@/components/ui";
import { getMessagingConfig } from "@/features/agent/components/messagingConfig";
import { useAgentSearch } from "@/features/agent/hooks/data/useAgentSearch";
import { useConnectionRequests } from "@/features/agent/hooks/data/useConnectionRequests";
type AgentSearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
};
export default function AgentSearchModal({ isOpen, onClose }: AgentSearchModalProps) {
  const config = getMessagingConfig("client");
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const { agents, isLoading } = useAgentSearch(searchQuery, isOpen);
  const { createRequestAsInitiator, isCreatingRequest } = useConnectionRequests();
  const { userProfile } = useUserData();
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  const handleSendRequest = async (agentId: string) => {
    if (!userProfile?.id) return;
    try {
      await createRequestAsInitiator(userProfile.id, agentId, false, message.trim() || undefined);
      enqueueToast({
        type: "success",
        message: "Connection request sent",
      });
      setMessage("");
      setSelectedAgentId(null);
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
    <Box className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Box className="bg-background-surface relative w-full max-w-2xl rounded-xl shadow-lg">
        {/* Header */}
        <Box className="border-border flex items-center justify-between border-b p-4">
          <Title as="h2" size="lg" className="text-text-primary font-semibold">
            {config.searchModal.title}
          </Title>
          <CloseButton onClick={onClose} size="sm" label="Close" />
        </Box>

        {/* Search Input */}
        <Box className="border-border border-b p-4">
          <Box className="relative">
            <Icon
              name="search"
              className="text-text-disabled absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2"
            />
            <Input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={config.searchModal.searchPlaceholder}
              className="border-border bg-background-surface text-text-primary placeholder:text-text-secondary focus:border-primary focus:ring-accent-muted w-full rounded-lg border px-10 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2"
            />
          </Box>
        </Box>

        {/* Results */}
        <Box className="max-h-96 overflow-y-auto p-4">
          {searchQuery.length < 2 ? null : isLoading ? (
            <Box className="py-8 text-center">
              <KeyTurnLoader message={config.searchModal.searchingMessage} />
            </Box>
          ) : agents.length === 0 ? (
            <Box className="text-text-secondary py-8 text-center text-sm">
              {config.searchModal.noResultsMessage} "{searchQuery}"
            </Box>
          ) : (
            <Box className="space-y-2">
              {agents.map((agent) => (
                <Box
                  key={agent.id}
                  className={`rounded-lg border p-4 transition-all ${
                    selectedAgentId === agent.id
                      ? "border-border bg-background-base shadow-sm"
                      : "border-border hover:border-border hover:bg-background-base"
                  }`}
                >
                  {selectedAgentId === agent.id ? (
                    <Box className="space-y-4">
                      <Box className="border-border flex items-start gap-3 border-b pb-3">
                        <Box className="bg-primary-muted flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full">
                          <Icon name="user" className="text-text-secondary h-6 w-6" />
                        </Box>
                        <Box className="min-w-0 flex-1">
                          <Title
                            as="h3"
                            size="md"
                            className="text-text-primary mb-0.5 font-semibold"
                          >
                            {agent.name}
                          </Title>
                          <BodyText as="p" size="sm" className="text-text-secondary truncate">
                            {agent.email}
                          </BodyText>
                        </Box>
                      </Box>
                      <Box>
                        <Label
                          htmlFor="agent-search-message"
                          className="text-text-secondary mb-2 block font-medium"
                        >
                          Message (optional)
                        </Label>
                        <Textarea
                          id="agent-search-message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Add a message..."
                          className="border-border bg-background-surface text-text-primary placeholder:text-text-secondary focus:border-primary focus:ring-accent-muted w-full resize-none rounded-lg border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2"
                          rows={4}
                        />
                      </Box>
                      <Box className="flex gap-3 pt-2">
                        <Button
                          onClick={() => handleSendRequest(agent.id)}
                          disabled={isCreatingRequest}
                          variant="outline"
                          size="md"
                          icon={<Icon name="send" />}
                          iconPosition="left"
                          className="bg-accent-lighter hover:bg-accent border-accent-lighter min-w-0 flex-1 text-white hover:text-white"
                        >
                          {config.searchModal.sendButtonLabel}
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedAgentId(null);
                            setMessage("");
                          }}
                          variant="outline"
                          size="md"
                          icon={<Icon name="x" />}
                          iconPosition="left"
                          className="border-border bg-border text-text-secondary hover:bg-primary-muted px-6"
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAgentId(agent.id)}
                      className="flex h-auto min-h-0 w-full items-start justify-start gap-3 py-0 text-left"
                    >
                      <Box className="bg-accent-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                        <Icon name="user" className="h-5 w-5 text-black" />
                      </Box>
                      <Box className="flex-1">
                        <Title as="h3" size="sm" className="font-medium text-black">
                          {agent.name}
                        </Title>
                        <BodyText as="p" size="sm" className="text-text-secondary">
                          {agent.email}
                        </BodyText>
                        {agent.phone && (
                          <BodyText as="p" size="xs" className="text-text-disabled">
                            {agent.phone}
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
