/// <reference types="nativewind/types" />
import { Icon } from "@ui/icons";

import { Button } from "packages/ui";
import { Box, Text } from "packages/ui/components/primitives";
import Input from "packages/ui/components/primitives/input/Input";

import type { AgentSearchResult } from "@/features/agent/api/agent";
import type { AgentConnectionDisplayStatus } from "@/features/agent/utils/connectionRequestStatus";
import { canSendConnectionRequest } from "@/features/agent/utils/connectionRequestStatus";

import { AgentConnectionStatusBadge } from "./AgentConnectionStatusBadge";

export type AgentDirectoryRowProps = {
  agent: AgentSearchResult;
  connectionStatus?: AgentConnectionDisplayStatus;
  isExpanded: boolean;
  onExpandConnect: () => void;
  onCollapseConnect: () => void;
  onOpenProfile: () => void;
  profileButtonLabel: string;
  connectButtonLabel: string;
  message: string;
  onMessageChange: (value: string) => void;
  onSendRequest: () => void;
  isCreatingRequest: boolean;
  canSendRequest: boolean;
  sendButtonLabel: string;
  cancelButtonLabel: string;
  messageFieldLabel: string;
  messagePlaceholder: string;
};

export function AgentDirectoryRow({
  agent,
  connectionStatus = "none",
  isExpanded,
  onExpandConnect,
  onCollapseConnect,
  onOpenProfile,
  profileButtonLabel,
  connectButtonLabel,
  message,
  onMessageChange,
  onSendRequest,
  isCreatingRequest,
  canSendRequest,
  sendButtonLabel,
  cancelButtonLabel,
  messageFieldLabel,
  messagePlaceholder,
}: AgentDirectoryRowProps) {
  const showConnect = canSendConnectionRequest(connectionStatus);

  if (isExpanded) {
    return (
      <Box className="border-border bg-background-base gap-4 rounded-lg border p-4 shadow-sm">
        <Box className="border-border flex flex-row items-start gap-3 border-b pb-3">
          <Box className="bg-primary-muted flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full">
            <Icon name="user" className="text-text-secondary h-6 w-6" />
          </Box>
          <Box className="min-w-0 flex-1">
            <Box className="mb-0.5 flex-row flex-wrap items-center gap-2">
              <Text className="text-text-primary text-base font-semibold">{agent.name}</Text>
              <AgentConnectionStatusBadge status={connectionStatus} />
            </Box>
            <Text className="text-text-secondary text-sm" numberOfLines={1}>
              {agent.email}
            </Text>
          </Box>
        </Box>
        <Box>
          <Text className="text-text-secondary mb-2 font-medium">{messageFieldLabel}</Text>
          <Input
            value={message}
            onChangeText={onMessageChange}
            placeholder={messagePlaceholder}
            multiline
            className="border-border bg-background-surface text-text-primary min-h-24 py-3 text-sm"
            textAlignVertical="top"
          />
        </Box>
        <Box className="flex flex-row flex-wrap justify-start gap-3 pt-2">
          <Button
            onPress={onSendRequest}
            disabled={isCreatingRequest || !canSendRequest}
            variant="tertiary"
            size="md"
            iconName="send"
            iconPosition="left"
            className="min-w-0 flex-1"
          >
            {sendButtonLabel}
          </Button>
          <Button
            onPress={onCollapseConnect}
            variant="outline"
            size="md"
            iconName="x"
            iconPosition="left"
            className="border-border bg-border text-text-secondary px-6"
          >
            {cancelButtonLabel}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="border-border rounded-lg border p-4">
      <Box className="gap-3">
        <Box className="flex flex-row items-start gap-3">
          <Box className="bg-accent-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
            <Icon name="user" className="h-5 w-5 text-black" />
          </Box>
          <Box className="min-w-0 flex-1">
            <Box className="flex-row flex-wrap items-center gap-2">
              <Text className="font-medium text-black">{agent.name}</Text>
              <AgentConnectionStatusBadge status={connectionStatus} />
            </Box>
            <Text className="text-text-secondary text-sm" numberOfLines={1}>
              {agent.email}
            </Text>
            {agent.phone ? <Text className="text-text-disabled text-xs">{agent.phone}</Text> : null}
          </Box>
        </Box>
        <Box className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            iconName="external-link"
            iconPosition="left"
            onPress={onOpenProfile}
            className="border-border"
          >
            {profileButtonLabel}
          </Button>
          {showConnect ? (
            <Button
              variant="tertiary"
              size="sm"
              iconName="handshake"
              iconPosition="left"
              onPress={onExpandConnect}
            >
              {connectButtonLabel}
            </Button>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
