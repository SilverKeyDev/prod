/// <reference types="nativewind/types" />
import {
  type ComponentRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { useUserData } from "packages/hooks/data/auth/useUserData";
import { useAuthStore, useUIStore } from "packages/store";
import { Loading } from "packages/ui/components/asset/loading/Loading";
import Button from "packages/ui/components/button/Button";
import { Box, Text, TouchableBox } from "packages/ui/components/primitives";
import Input from "packages/ui/components/primitives/input/Input";

import { getMessagingConfig } from "@/features/agent/components/messaging/screen/messagingConfig";
import { useAgentSearch } from "@/features/agent/hooks/data/useAgentSearch";
import { useConnectionRequests } from "@/features/agent/hooks/data/useConnectionRequests";
import { connectionRequestApiErrorMessage } from "@/features/agent/utils/connectionRequestApiError";

import type { AgentSearchContentHandle, AgentSearchContentProps } from "./AgentSearchContent.types";

export type {
  AgentSearchContentHandle,
  AgentSearchContentProps,
  AgentSearchPrimaryAction,
} from "./AgentSearchContent.types";

export const AgentSearchContent = forwardRef<AgentSearchContentHandle, AgentSearchContentProps>(
  function AgentSearchContent(
    {
      onSuccess,
      isActive = true,
      inputRef: inputRefProp,
      className = "",
      primaryAction = "connectionRequest",
      onOpenAgentProfile,
      connectButtonLabel = "Connect",
    },
    ref
  ) {
    const { t } = useLocalization();
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
    const internalRef = useRef<ComponentRef<typeof Input>>(null);
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
        <Box className="border-border border-b p-4">
          <Box className="relative">
            <Icon
              name="search"
              className="text-text-disabled z-header pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2"
            />
            <Input
              ref={inputRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={config.searchPlaceholder}
              className="border-border bg-background-surface text-text-primary placeholder:text-text-secondary w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm"
            />
          </Box>
        </Box>

        <Box className="p-4">
          {searchQuery.length > 0 && searchQuery.length < 2 ? (
            <Text className="text-text-secondary py-4 text-sm">
              {t("agent.discovery_search_min_chars")}
            </Text>
          ) : searchQuery.length < 2 ? null : isLoading ? (
            <Box className="flex justify-start py-8">
              <Loading />
            </Box>
          ) : agents.length === 0 ? (
            <Text className="text-text-secondary py-8 text-sm">
              {config.noResultsMessage} &quot;{searchQuery}&quot;
            </Text>
          ) : (
            <Box className="gap-2">
              {agents.map((agent) => (
                <Box
                  key={agent.id}
                  className={`rounded-lg border p-4 ${
                    selectedAgentId === agent.id
                      ? "border-border bg-background-base shadow-sm"
                      : "border-border"
                  }`}
                >
                  {selectedAgentId === agent.id ? (
                    <Box className="gap-4">
                      <Box className="border-border flex flex-row items-start gap-3 border-b pb-3">
                        <Box className="bg-primary-muted flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full">
                          <Icon name="user" className="text-text-secondary h-6 w-6" />
                        </Box>
                        <Box className="min-w-0 flex-1">
                          <Text className="text-text-primary mb-0.5 text-base font-semibold">
                            {agent.name}
                          </Text>
                          <Text className="text-text-secondary text-sm" numberOfLines={1}>
                            {agent.email}
                          </Text>
                        </Box>
                      </Box>
                      <Box>
                        <Text className="text-text-secondary mb-2 font-medium">
                          Message (optional)
                        </Text>
                        <Input
                          value={message}
                          onChangeText={setMessage}
                          placeholder="Add a note (optional)"
                          multiline
                          className="border-border bg-background-surface text-text-primary min-h-24 py-3 text-sm"
                          textAlignVertical="top"
                        />
                      </Box>
                      <Box className="flex flex-row flex-wrap justify-start gap-3 pt-2">
                        <Button
                          onPress={() => void handleSendRequest(agent.id)}
                          disabled={isCreatingRequest || !initiatorId}
                          variant="tertiary"
                          size="md"
                          iconName="send"
                          iconPosition="left"
                          className="min-w-0 flex-1"
                        >
                          {config.sendButtonLabel}
                        </Button>
                        <Button
                          onPress={() => {
                            setSelectedAgentId(null);
                            setMessage("");
                          }}
                          variant="outline"
                          size="md"
                          iconName="x"
                          iconPosition="left"
                          className="border-border bg-border text-text-secondary px-6"
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : primaryAction === "openProfile" && onOpenAgentProfile ? (
                    <Box className="flex flex-col gap-2">
                      <Box className="flex flex-row items-start justify-between gap-2">
                        <TouchableBox
                          onPress={() => onOpenAgentProfile(agent)}
                          label={agent.name}
                          className="min-w-0 flex-1 flex-row items-start gap-3 rounded-lg py-1 active:bg-neutral-100"
                        >
                          <Box className="bg-accent-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                            <Icon name="user" className="h-5 w-5 text-black" />
                          </Box>
                          <Box className="min-w-0 flex-1">
                            <Text className="font-medium text-black">{agent.name}</Text>
                            <Text className="text-text-secondary text-sm" numberOfLines={1}>
                              {agent.email}
                            </Text>
                            {agent.phone ? (
                              <Text className="text-text-disabled text-xs">{agent.phone}</Text>
                            ) : null}
                          </Box>
                        </TouchableBox>
                        <Button
                          variant="outline"
                          size="sm"
                          onPress={() => setSelectedAgentId(agent.id)}
                          className="border-border flex-shrink-0"
                        >
                          {connectButtonLabel}
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <TouchableBox
                      onPress={() => setSelectedAgentId(agent.id)}
                      label={agent.name}
                      className="w-full flex-row items-start gap-3 rounded-lg py-1 active:bg-neutral-100"
                    >
                      <Box className="bg-accent-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                        <Icon name="user" className="h-5 w-5 text-black" />
                      </Box>
                      <Box className="min-w-0 flex-1">
                        <Text className="font-medium text-black">{agent.name}</Text>
                        <Text className="text-text-secondary text-sm">{agent.email}</Text>
                        {agent.phone ? (
                          <Text className="text-text-disabled text-xs">{agent.phone}</Text>
                        ) : null}
                      </Box>
                    </TouchableBox>
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
