import React from "react";

import { Icon } from "@ui/icons";

import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader.web";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Button, Title } from "@/components/ui";
import type {
  MessagingConfig,
  MessagingMode,
} from "@/features/agent/components/messaging/screen/messagingConfig";

type EmptyStatesProps = {
  mode: MessagingMode;
  config: MessagingConfig;
  selectedClientName?: string;
  onSearchClick?: () => void;
};

export function UnifiedMessagesListAgentBlockedEmpty({ config }: { config: MessagingConfig }) {
  return (
    <Box className="flex h-full items-center justify-center">
      <Box className="text-center">
        <Box className="bg-accent-muted mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full">
          <Icon name="message-circle" className="text-text-secondary h-8 w-8" />
        </Box>
        <Title as="h3" size="lg" className="text-text-primary mb-2 font-medium">
          {config.emptyStates.noMessages.title}
        </Title>
        <BodyText as="p" size="sm" className="text-text-secondary mx-auto max-w-md">
          {config.emptyStates.noMessages.message}
        </BodyText>
      </Box>
    </Box>
  );
}

export function UnifiedMessagesListClientNoAgentEmpty({
  config,
  onSearchClick,
}: Pick<EmptyStatesProps, "config" | "onSearchClick">) {
  return (
    <Box className="flex h-full items-center justify-center">
      <Box className="text-center">
        <Icon name="message-circle" className="text-text-secondary mx-auto mb-3 h-16 w-16" />
        <Title as="h3" size="lg" className="text-text-primary mb-2 font-medium">
          {config.emptyStates.noAgent.title}
        </Title>
        <BodyText as="p" size="sm" className="text-text-secondary mb-4">
          {config.emptyStates.noAgent.message}
        </BodyText>
        {onSearchClick && (
          <Button
            variant="outline"
            size="sm"
            icon={<Icon name="search" className="h-4 w-4" />}
            iconPosition="left"
            onClick={onSearchClick}
            className="border-border hover:bg-accent-muted bg-background-surface text-text-secondary hover:text-text-primary mx-auto flex items-center justify-center gap-2 hover:border-neutral-400"
          >
            {config.emptyStates.noAgent.actionLabel}
          </Button>
        )}
      </Box>
    </Box>
  );
}

export function UnifiedMessagesListLoadingHistory() {
  return (
    <Box className="flex h-full items-center justify-center">
      <KeyTurnLoader message="Loading conversation..." />
    </Box>
  );
}

export function UnifiedMessagesListNoMessagesYet({
  mode,
  config,
  selectedClientName,
}: Pick<EmptyStatesProps, "mode" | "config" | "selectedClientName">) {
  return (
    <Box className="flex h-full items-center justify-center">
      <Box className="text-center">
        <Box className="bg-accent-muted mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full">
          <Icon name="message-circle" className="text-text-secondary h-8 w-8" />
        </Box>
        <Title as="h3" size="lg" className="text-text-primary mb-2 font-medium">
          {config.emptyStates.noMessages.title}
        </Title>
        <BodyText as="p" size="sm" className="text-text-secondary mx-auto max-w-md">
          {mode === "agent" && selectedClientName
            ? config.emptyStates.noMessages.message.replace("your client", selectedClientName)
            : config.emptyStates.noMessages.message}
        </BodyText>
      </Box>
    </Box>
  );
}
