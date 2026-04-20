import {
  forwardRef,
  type RefObject,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { Icon } from "@ui/icons";

import { useUserData } from "packages/hooks/data/auth/useUserData";
import { useAuthStore, useUIStore } from "packages/store";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader.web";
import Button from "packages/ui/components/button/Button";
import { Textarea } from "packages/ui/components/form/FormField";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Input, Label, Title } from "@/components/ui";
import { getMessagingConfig } from "@/features/agent/components/messaging/screen/messagingConfig";
import { useAgentSearch } from "@/features/agent/hooks/data/useAgentSearch";
import { useConnectionRequests } from "@/features/agent/hooks/data/useConnectionRequests";
import { connectionRequestApiErrorMessage } from "@/features/agent/utils/connectionRequestApiError";

export type AgentSearchContentHandle = {
  /** Sends a connection request for the currently selected agent. Returns true if sent successfully. */
  submitSelectedRequest: () => Promise<boolean>;
};

export type AgentSearchContentProps = {
  /** Called after a connection request is sent successfully (e.g. close modal). */
  onSuccess?: () => void;
  /** When false, search is not run (e.g. modal closed). Default true. */
  isActive?: boolean;
  /** Optional ref for the search input (e.g. for modal focus). */
  inputRef?: RefObject<HTMLInputElement | null>;
  className?: string;
};

export const AgentSearchContent = forwardRef<AgentSearchContentHandle, AgentSearchContentProps>(
  function AgentSearchContent(
    {
      onSuccess,
      isActive = true,
      inputRef: inputRefProp,
      className = "",
    },
    ref
  ) {
    const config = getMessagingConfig("client").searchModal;
    const [searchQuery, setSearchQuery] = useState("");
    const [message, setMessage] = useState("");
    const messageRef = useRef("");
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const selectedAgentIdRef = useRef<string | null>(null);
    const { agents, isLoading } = useAgentSearch(searchQuery, isActive);
    const { createRequestAsInitiator, isCreatingRequest } = useConnectionRequests();
    const { userProfile } = useUserData();
    const authUser = useAuthStore((s) => s.user);
    const enqueueToast = useUIStore((s) => s.enqueueToast);
    const initiatorId = userProfile?.id ?? authUser?.id;
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = inputRefProp ?? internalRef;

    useEffect(() => {
      selectedAgentIdRef.current = selectedAgentId;
    }, [selectedAgentId]);

    useEffect(() => {
      messageRef.current = message;
    }, [message]);

    const handleSendRequest = async (agentId: string): Promise<boolean> => {
      if (!initiatorId) {
        enqueueToast({
          type: "error",
          message: "Profile not loaded. Please try again in a moment.",
        });
        return false;
      }
      try {
        const note = messageRef.current.trim() || undefined;
        const { alreadyPending } = await createRequestAsInitiator(
          initiatorId,
          agentId,
          false,
          note
        );
        if (alreadyPending) {
          enqueueToast({
            type: "warning",
            message: "A connection request is already pending with this agent.",
          });
          return false;
        }
        enqueueToast({ type: "success", message: "Request sent" });
        setMessage("");
        setSelectedAgentId(null);
        onSuccess?.();
        return true;
      } catch (err: unknown) {
        enqueueToast({
          type: "error",
          message: connectionRequestApiErrorMessage(err),
        });
        return false;
      }
    };

    useImperativeHandle(ref, () => ({
      submitSelectedRequest: async () => {
        const id = selectedAgentIdRef.current;
        if (!id) return false;
        return handleSendRequest(id);
      },
    }));

    return (
      <Box className={`text-left ${className}`.trim()}>
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
              placeholder={config.searchPlaceholder}
              className="border-border bg-background-surface text-text-primary placeholder:text-text-secondary focus:border-input-variant-focus-border w-full rounded-lg border px-10 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400"
            />
          </Box>
        </Box>

        {/* Results */}
        <Box className="max-h-96 overflow-y-auto p-4">
          {searchQuery.length < 2 ? null : isLoading ? (
            <Box className="flex justify-start py-8">
              <KeyTurnLoader message={config.searchingMessage} />
            </Box>
          ) : agents.length === 0 ? (
            <Box className="text-text-secondary py-8 text-left text-sm">
              {config.noResultsMessage} "{searchQuery}"
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
                          placeholder="Add a note (optional)"
                          className="border-border bg-background-surface text-text-primary placeholder:text-text-secondary focus:border-input-variant-focus-border w-full resize-none rounded-lg border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400"
                          rows={4}
                        />
                      </Box>
                      <Box className="flex justify-start gap-3 pt-2">
                        <Button
                          onClick={() => void handleSendRequest(agent.id)}
                          disabled={isCreatingRequest || !initiatorId}
                          variant="tertiary"
                          size="md"
                          icon={<Icon name="send" />}
                          iconPosition="left"
                          className="min-w-0 flex-1"
                        >
                          {config.sendButtonLabel}
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
    );
  }
);
