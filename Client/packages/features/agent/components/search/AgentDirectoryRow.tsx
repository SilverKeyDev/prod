import { Icon } from "@ui/icons";

import { Button, Textarea } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Label, Title } from "@/components/ui";
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
      <Box className="border-border bg-background-base space-y-4 rounded-lg border p-4 shadow-sm">
        <Box className="border-border flex items-start gap-3 border-b pb-3">
          <Box className="bg-primary-muted flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full">
            <Icon name="user" className="text-text-secondary h-6 w-6" />
          </Box>
          <Box className="min-w-0 flex-1">
            <Box className="mb-0.5 flex flex-wrap items-center gap-2">
              <Title as="h3" size="md" className="text-text-primary font-semibold">
                {agent.name}
              </Title>
              <AgentConnectionStatusBadge status={connectionStatus} />
            </Box>
            <BodyText as="p" size="sm" className="text-text-secondary truncate">
              {agent.email}
            </BodyText>
          </Box>
        </Box>
        <Box>
          <Label
            htmlFor={`agent-connect-message-${agent.id}`}
            className="text-text-secondary mb-2 block font-medium"
          >
            {messageFieldLabel}
          </Label>
          <Textarea
            id={`agent-connect-message-${agent.id}`}
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder={messagePlaceholder}
            className="border-border bg-background-surface text-text-primary placeholder:text-text-secondary focus:border-input-variant-focus-border w-full resize-none rounded-lg border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400"
            rows={4}
          />
        </Box>
        <Box className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-start">
          <Button
            onClick={() => void onSendRequest()}
            disabled={isCreatingRequest || !canSendRequest}
            variant="tertiary"
            size="md"
            iconName="send"
            iconPosition="left"
            className="min-w-0 sm:flex-1"
          >
            {sendButtonLabel}
          </Button>
          <Button
            onClick={onCollapseConnect}
            variant="outline"
            size="md"
            iconName="x"
            iconPosition="left"
            className="border-border bg-border text-text-secondary px-6 hover:bg-neutral-100"
          >
            {cancelButtonLabel}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="border-border hover:bg-background-base rounded-lg border p-4 transition-all">
      <Box className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <Box className="flex min-w-0 flex-1 items-start gap-3">
          <Box className="bg-accent-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
            <Icon name="user" className="h-5 w-5 text-black" />
          </Box>
          <Box className="min-w-0 flex-1">
            <Box className="flex flex-wrap items-center gap-2">
              <Title as="h3" size="sm" className="font-medium text-black">
                {agent.name}
              </Title>
              <AgentConnectionStatusBadge status={connectionStatus} />
            </Box>
            <BodyText as="p" size="sm" className="text-text-secondary truncate">
              {agent.email}
            </BodyText>
            {agent.phone ? (
              <BodyText as="p" size="xs" className="text-text-disabled">
                {agent.phone}
              </BodyText>
            ) : null}
          </Box>
        </Box>
        <Box className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            iconName="external-link"
            iconPosition="left"
            onClick={onOpenProfile}
            className="border-border"
          >
            {profileButtonLabel}
          </Button>
          {showConnect ? (
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              iconName="handshake"
              iconPosition="left"
              onClick={onExpandConnect}
            >
              {connectButtonLabel}
            </Button>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
